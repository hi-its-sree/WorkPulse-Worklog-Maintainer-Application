import { DataTypes } from 'sequelize';
import { sequelize } from './db.js';

export const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING,
  },
  description: {
    type: DataTypes.TEXT,
  }
});
