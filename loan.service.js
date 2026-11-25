const db = require('../config/db');
const { Op } = require('sequelize');
const { Book, Reader, Loan, Reservation } = require('../models');
const { fail, pagination, paged } = require('../shared/http');

const DAY_MS = 86400000;
const LOAN_DAYS = 7;
const MAX_ACTIVE_LOANS = 3;
const QUEUE_ORDER = [['createdAt', 'ASC'], ['id', 'ASC']];

// O status ATRASADO não é gravado: é calculado pela data de vencimento
function display(loan) {
  const data = loan.toJSON();

  if (data.returnDate) data.status = 'DEVOLVIDO';
  else if (new Date(data.dueDate) < new Date()) data.status = 'ATRASADO';
  else data.status = 'ATIVO';

  return data;
}

function statusFilter(status) {
  const now = new Date();

  if (status === 'DEVOLVIDO') return { returnDate: { [Op.ne]: null } };
  if (status === 'ATIVO') return { returnDate: null, dueDate: { [Op.gte]: now } };
  if (status === 'ATRASADO') return { returnDate: null, dueDate: { [Op.lt]: now } };
  return {};
}

async function list(query) {
  const { page, limit, offset } = pagination(query);

  const result = await Loan.findAndCountAll({
    where: statusFilter(query.status),
    include: [Book, Reader],
    limit,
    offset,
    order: [['id', 'DESC']]
  });

  return { ...paged(result, page, limit), data: result.rows.map(display) };
}

async function create({ bookId, readerId }, userId) {
  return db.transaction(async transaction => {
    const book = await Book.findByPk(bookId, { transaction });
    const reader = await Reader.findByPk(readerId, { transaction });
    if (!book || !reader) fail(404, 'Livro ou leitor não encontrado.');

    // Regras do leitor
    const openLoans = await Loan.findAll({ where: { readerId, returnDate: null }, transaction });
    if (openLoans.length >= MAX_ACTIVE_LOANS) fail(409, 'Leitor já tem três empréstimos ativos.');
    if (openLoans.some(loan => loan.dueDate < new Date())) fail(409, 'Leitor tem empréstimo atrasado.');

    // Regras do livro
    if (book.availableCopies <= 0) fail(409, 'Livro sem exemplares disponíveis. Faça uma reserva.');

    // Se há fila, só o primeiro da fila pode pegar o exemplar
    const nextInQueue = await Reservation.findOne({
      where: { bookId, status: { [Op.in]: ['PENDENTE', 'PRONTA'] } },
      order: QUEUE_ORDER,
      transaction
    });
    if (nextInQueue && nextInQueue.readerId !== readerId) {
      fail(409, 'Exemplar reservado para outro leitor.');
    }

    const now = new Date();
    const dueDate = new Date(now.getTime() + LOAN_DAYS * DAY_MS);

    const loan = await Loan.create(
      { bookId, readerId, userId, loanDate: now, dueDate, status: 'ATIVO', fine: 0 },
      { transaction }
    );
    await book.decrement('availableCopies', { by: 1, transaction });

    if (nextInQueue) await nextInQueue.update({ status: 'ATENDIDA' }, { transaction });

    return loan;
  });
}

async function returnBook(id) {
  return db.transaction(async transaction => {
    const loan = await Loan.findByPk(id, { transaction });
    if (!loan) fail(404, 'Empréstimo não encontrado.');
    if (loan.returnDate) fail(409, 'Livro já devolvido.');

    // Multa: R$ 1,00 por dia de atraso
    const now = new Date();
    const lateDays = Math.ceil((now - new Date(loan.dueDate)) / DAY_MS);
    const fine = Math.max(0, lateDays);

    await loan.update({ returnDate: now, status: 'DEVOLVIDO', fine }, { transaction });

    const book = await Book.findByPk(loan.bookId, { transaction });
    await book.increment('availableCopies', { by: 1, transaction });

    // Avisa o primeiro da fila de reservas
    const nextInQueue = await Reservation.findOne({
      where: { bookId: loan.bookId, status: 'PENDENTE' },
      order: QUEUE_ORDER,
      transaction
    });
    if (nextInQueue) await nextInQueue.update({ status: 'PRONTA' }, { transaction });

    return display(loan);
  });
}

module.exports = { list, create, returnBook };
