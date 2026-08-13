import { DataTypes } from 'sequelize';
import { sequelize } from './db.js';

export const ProjectAssignment = sequelize.define('ProjectAssignment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  role: {
    type: DataTypes.ENUM('OWNER', 'CONTRIBUTOR', 'REVIEWER'),
    allowNull: false,
    defaultValue: 'CONTRIBUTOR',
  }
});
