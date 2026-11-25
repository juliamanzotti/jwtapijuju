const db = require('../config/db');
const { DataTypes } = require('sequelize');

module.exports = db.define('RefreshToken', {
  token: { type: DataTypes.STRING, allowNull: false, unique: true },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  revoked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
});
