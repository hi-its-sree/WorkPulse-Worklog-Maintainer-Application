import { DataTypes } from 'sequelize';
import { sequelize } from './db.js';

export const Worklog = sequelize.define('Worklog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  logDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  taskMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  meetingMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  documentationMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  idleMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'),
    defaultValue: 'DRAFT',
  },
  approvalNotes: {
    type: DataTypes.TEXT,
  }
});
