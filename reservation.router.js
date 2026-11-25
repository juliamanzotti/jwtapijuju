const router = require('express').Router();
const controller = require('./reservation.controller');

router.get('/', controller.list);
router.post('/', controller.create);
router.patch('/:id/cancel', controller.cancel);

module.exports = router;
