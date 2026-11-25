const { z } = require('zod');
const service = require('./loan.service');
const { route } = require('../shared/http');

const createSchema = z.object({
  bookId: z.number().int().positive(),
  readerId: z.number().int().positive()
});

module.exports = {
  list: route(async (req, res) => res.json(await service.list(req.query))),

  create: route(async (req, res) => {
    const data = createSchema.parse(req.body);
    const loan = await service.create(data, req.user.id);
    res.status(201).json(loan);
  }),

  returnBook: route(async (req, res) => res.json(await service.returnBook(req.params.id)))
};
