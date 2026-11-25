const db = require('../config/db');
const { DataTypes } = require('sequelize');

module.exports = db.define('Reader', {
  name: { type: DataTypes.STRING, allowNull: false },
  cpf: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: DataTypes.STRING,
  phone: DataTypes.STRING
});
