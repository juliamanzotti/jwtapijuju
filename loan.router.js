const router = require('express').Router();
const controller = require('./loan.controller');

router.get('/', controller.list);
router.post('/', controller.create);
router.patch('/:id/return', controller.returnBook);

module.exports = router;
