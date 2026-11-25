const bcrypt = require('bcrypt');
const { User } = require('../models');
const { fail } = require('../shared/http');
const { publicUser } = require('../auth/auth.service');

const SALT_ROUNDS = 10;

// Atendentes criados por aqui nunca são administradores
async function create(data) {
  const user = await User.create({
    ...data,
    password: await bcrypt.hash(data.password, SALT_ROUNDS),
    isAdmin: false
  });
  return publicUser(user);
}

async function update(id, data) {
  const user = await User.findByPk(id);
  if (!user) fail(404, 'Atendente não encontrado.');

  if (data.password) data.password = await bcrypt.hash(data.password, SALT_ROUNDS);

  await user.update(data);
  return publicUser(user);
}

module.exports = { create, update };
