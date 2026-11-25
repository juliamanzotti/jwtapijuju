const db = require('../config/db');
const { DataTypes } = require('sequelize');

module.exports = db.define('Category', {
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: DataTypes.TEXT
});
