const { route, pagination, paged, fail } = require('../shared/http');
const { Reader, Loan, Book } = require('../models');

const controller = require('./reader.service').controller;

// Histórico de empréstimos de um leitor
controller.loans = route(async (req, res) => {
  const readerId = req.params.id;
  if (!(await Reader.findByPk(readerId))) fail(404, 'Leitor não encontrado.');

  const { page, limit, offset } = pagination(req.query);
  const result = await Loan.findAndCountAll({
    where: { readerId },
    include: [Book],
    limit,
    offset,
    order: [['id', 'DESC']]
  });

  res.json(paged(result, page, limit));
});

module.exports = controller;
