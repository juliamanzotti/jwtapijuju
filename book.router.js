// Somente administradores podem criar, editar e excluir
module.exports = require('../shared/resource').router(require('./book.controller'), true);
