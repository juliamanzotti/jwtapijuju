const db = require('../config/db');
const { DataTypes } = require('sequelize');

module.exports = db.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  isAdmin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
});
