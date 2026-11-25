const { route } = require('../shared/http');
const service = require('./report.service');

module.exports = {
  dashboard: route(async (req, res) => res.json(await service.dashboard()))
};
