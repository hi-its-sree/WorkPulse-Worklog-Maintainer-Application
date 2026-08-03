import { DataTypes } from 'sequelize';
import { sequelize } from './db.js';

export const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  priority: {
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
    defaultValue: 'MEDIUM',
  },
  plannedMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  actualMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('PLANNED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'BLOCKED'),
    defaultValue: 'PLANNED',
  },
  startTime: {
    type: DataTypes.DATE,
  },
  endTime: {
    type: DataTypes.DATE,
  },
  reasonCode: {
    type: DataTypes.ENUM('REQUIREMENT_CHANGE', 'TECHNICAL_ISSUE', 'DEPENDENCY_WAITING', 'OTHER'),
  }
});
