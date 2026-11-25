const { Op } = require('sequelize');
const { Book, Loan } = require('../models');

// Indicadores do painel do administrador
async function dashboard() {
  const [books, activeLoans, overdueLoans, fines] = await Promise.all([
    Book.count(),
    Loan.count({ where: { returnDate: null } }),
    Loan.count({ where: { returnDate: null, dueDate: { [Op.lt]: new Date() } } }),
    Loan.sum('fine')
  ]);

  return { books, activeLoans, overdueLoans, fines: Number(fines || 0) };
}

module.exports = { dashboard };
