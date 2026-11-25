const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../config/db');
const { User, RefreshToken } = require('../models');
const { fail } = require('../shared/http');

const REFRESH_TTL_MS = 7 * 86400000;

// Dados do usuário que podem ser devolvidos pela API (sem a senha)
function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    isAdmin: user.isAdmin,
    active: user.active
  };
}

// O refresh token nunca é salvo em texto puro, apenas o HMAC dele
function tokenHash(token) {
  return crypto
    .createHmac('sha256', process.env.JWT_REFRESH_SECRET)
    .update(token)
    .digest('hex');
}

// Gera access token (JWT) + refresh token (aleatório) para o usuário
async function issue(user, transaction) {
  const accessToken = jwt.sign(
    { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_TTL || '15m' }
  );

  const refreshToken = crypto.randomBytes(48).toString('hex');
  await RefreshToken.create(
    {
      token: tokenHash(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS)
    },
    { transaction }
  );

  return { accessToken, refreshToken, user: publicUser(user) };
}

async function login(email, password) {
  const user = await User.findOne({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    fail(401, 'E-mail ou senha inválidos.');
  }
  if (!user.active) fail(403, 'Atendente desativado.');

  return issue(user);
}

// Troca o refresh token por um novo par de tokens (rotação)
async function refresh(token) {
  if (!token) fail(401, 'Refresh token ausente.');

  const hash = tokenHash(token);
  const previous = await RefreshToken.findOne({ where: { token: hash } });
  if (!previous) fail(401, 'Refresh token inválido.');

  // Reuso de um token já revogado indica possível roubo: derruba todas as sessões
  if (previous.revoked) {
    await RefreshToken.update({ revoked: true }, { where: { userId: previous.userId } });
    fail(401, 'Refresh token reutilizado. Sessões revogadas.');
  }

  return db.transaction(async transaction => {
    const saved = await RefreshToken.findOne({ where: { token: hash }, transaction });
    if (!saved || saved.revoked) fail(401, 'Refresh token inválido.');
    if (saved.expiresAt <= new Date()) fail(401, 'Refresh token expirado.');

    const user = await User.findByPk(saved.userId, { transaction });
    if (!user || !user.active) fail(401, 'Usuário indisponível.');

    saved.revoked = true;
    await saved.save({ transaction });

    return issue(user, transaction);
  });
}

async function logout(token) {
  if (!token) return;
  await RefreshToken.update({ revoked: true }, { where: { token: tokenHash(token) } });
}

module.exports = { login, refresh, logout, publicUser };
