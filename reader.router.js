const controller = require('./reader.controller');
const router = require('../shared/resource').router(controller);

router.get('/:id/loans', controller.loans);

module.exports = router;
