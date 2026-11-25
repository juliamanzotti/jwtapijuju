const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Valida o access token do header Authorization: Bearer <token>
async function authenticate(req, res, next) {
  const match = /^Bearer (.+)$/.exec(req.header('Authorization') || '');
  if (!match) return res.status(401).json({ error: 'Access token ausente.' });

  try {
    const payload = jwt.verify(match[1], process.env.JWT_SECRET);
    const user = await User.findByPk(payload.id);

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Usuário indisponível.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Access token inválido ou expirado.' });
  }
}

// Libera a rota somente para administradores
function isAdmin(req, res, next) {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Acesso permitido apenas ao administrador.' });
  }
  next();
}

module.exports = { authenticate, isAdmin };
