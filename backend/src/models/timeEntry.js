import { DataTypes } from 'sequelize';
import { sequelize } from './db.js';

export const TimeEntry = sequelize.define('TimeEntry', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  entryDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  category: {
    type: DataTypes.ENUM('TASK', 'MEETING', 'DOCUMENTATION', 'OTHER'),
    defaultValue: 'TASK',
  },
  notes: {
    type: DataTypes.TEXT,
  }
});
