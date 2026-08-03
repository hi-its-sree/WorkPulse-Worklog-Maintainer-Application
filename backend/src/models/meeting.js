import { DataTypes } from 'sequelize';
import { sequelize } from './db.js';

export const Meeting = sequelize.define('Meeting', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  startTime: {
    type: DataTypes.TIME,
  },
  durationMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
  },
  agenda: {
    type: DataTypes.TEXT,
  },
  notes: {
    type: DataTypes.TEXT,
  },
  actualDurationMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'),
    defaultValue: 'SCHEDULED',
  }
});
