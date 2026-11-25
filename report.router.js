const router = require('express').Router();
const { isAdmin } = require('../auth/auth.middleware');
const controller = require('./report.controller');

router.get('/dashboard', isAdmin, controller.dashboard);

module.exports = router;
