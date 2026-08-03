import { DataTypes } from 'sequelize';
import { sequelize } from './db.js';

export const ProjectModule = sequelize.define('ProjectModule', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  }
});
