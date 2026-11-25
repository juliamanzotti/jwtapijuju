const { z } = require('zod');
const { Op } = require('sequelize');
const { Book, Author, Category, Loan, Reservation } = require('../models');
const { resource, fail } = require('../shared/resource');

const schema = z.object({
  title: z.string().min(2),
  isbn: z.string().min(5),
  year: z.number().int().min(1450).max(2200).optional().nullable(),
  totalCopies: z.number().int().min(0),
  categoryId: z.number().int().positive(),
  authorIds: z.array(z.number().int().positive()).min(1)
});

// Filtros extras da listagem: title, categoryId, authorId e available=true
async function buildFilters(query) {
  const where = {};

  if (query.title) where.title = { [Op.like]: `%${query.title}%` };
  if (query.categoryId) where.categoryId = Number(query.categoryId);
  if (query.available === 'true') where.availableCopies = { [Op.gt]: 0 };

  if (query.authorId) {
    const BookAuthor = Book.associations.Authors.through.model;
    const links = await BookAuthor.findAll({
      where: { authorId: Number(query.authorId) },
      attributes: ['bookId']
    });
    where.id = { [Op.in]: links.map(link => link.bookId) };
  }

  return where;
}

// Valida categoria/autores e recalcula os exemplares disponíveis
async function prepare(data, existing) {
  if (data.categoryId && !(await Category.findByPk(data.categoryId))) {
    fail(400, 'Categoria inválida.');
  }

  if (data.authorIds) {
    const found = await Author.count({ where: { id: data.authorIds } });
    if (found !== new Set(data.authorIds).size) fail(400, 'Autor inválido.');
  }

  if (!existing) {
    data.availableCopies = data.totalCopies;
    return;
  }

  if (data.totalCopies !== undefined) {
    const borrowed = existing.totalCopies - existing.availableCopies;
    if (data.totalCopies < borrowed) {
      fail(409, 'Total menor que os exemplares emprestados.');
    }
    data.availableCopies = data.totalCopies - borrowed;
  }
}

module.exports = resource({
  model: Book,
  include: [Category, Author],
  searchField: 'title',
  schema,
  whereExtra: buildFilters,
  prepare,
  afterWrite: async (book, data) => {
    if (data.authorIds) await book.setAuthors(data.authorIds);
  },
  beforeDelete: async book => {
    const hasLoans = await Loan.count({ where: { bookId: book.id } });
    const hasActiveReservation = await Reservation.count({
      where: { bookId: book.id, status: { [Op.in]: ['PENDENTE', 'PRONTA'] } }
    });

    if (hasLoans || hasActiveReservation) {
      fail(409, 'Livro com histórico de empréstimos ou reserva ativa.');
    }
  }
});
