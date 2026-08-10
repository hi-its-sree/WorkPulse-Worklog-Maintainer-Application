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
  // One row per session (task, meeting, documentation, other) as executed that day.
  details: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  plannedMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  actualMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
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
  otherMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  idleMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  remarks: {
    type: DataTypes.TEXT,
  },
  completionStatus: {
    type: DataTypes.ENUM('PENDING_TO_START', 'ONGOING', 'COMPLETED'),
    defaultValue: 'ONGOING',
  },
  status: {
    type: DataTypes.ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'),
    defaultValue: 'DRAFT',
  },
  approvalNotes: {
    type: DataTypes.TEXT,
  }
});
