const { z } = require('zod');
const service = require('./reservation.service');
const { route } = require('../shared/http');

const createSchema = z.object({
  bookId: z.number().int().positive(),
  readerId: z.number().int().positive()
});

module.exports = {
  list: route(async (req, res) => res.json(await service.list(req.query))),

  create: route(async (req, res) => {
    const reservation = await service.create(createSchema.parse(req.body));
    res.status(201).json(reservation);
  }),

  cancel: route(async (req, res) => res.json(await service.cancel(req.params.id)))
};
