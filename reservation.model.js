const db = require('../config/db');
const { DataTypes } = require('sequelize');

module.exports = db.define('Reservation', {
  status: {
    type: DataTypes.ENUM('PENDENTE', 'PRONTA', 'ATENDIDA', 'CANCELADA'),
    allowNull: false,
    defaultValue: 'PENDENTE'
  }
});
