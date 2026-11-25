const db = require('../config/db');
const { DataTypes } = require('sequelize');

module.exports = db.define('Author', {
  name: { type: DataTypes.STRING, allowNull: false },
  nationality: DataTypes.STRING,
  birthDate: DataTypes.DATEONLY
});
