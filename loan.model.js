const db = require('../config/db');
const { DataTypes } = require('sequelize');

module.exports = db.define('Loan', {
  loanDate: { type: DataTypes.DATE, allowNull: false },
  dueDate: { type: DataTypes.DATE, allowNull: false },
  returnDate: DataTypes.DATE,
  status: { type: DataTypes.ENUM('ATIVO', 'DEVOLVIDO'), allowNull: false, defaultValue: 'ATIVO' },
  fine: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 }
});
