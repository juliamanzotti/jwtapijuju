const router = require('express').Router();
const controller = require('./user.controller');
const { isAdmin } = require('../auth/auth.middleware');

// Todas as rotas de atendentes são exclusivas do administrador
router.use(isAdmin);

router.get('/', controller.list);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id/active', controller.active);

module.exports = router;
