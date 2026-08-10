import { DataTypes } from 'sequelize';
import { sequelize } from './db.js';

export const DailyPlan = sequelize.define('DailyPlan', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  planDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  summary: {
    type: DataTypes.TEXT,
  },
  // The planner is free-form per person and department, so the sections are stored
  // as they were entered instead of being flattened into fixed columns.
  tasks: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  meetings: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  documentation: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  others: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  status: {
    type: DataTypes.ENUM('DRAFT', 'PLANNED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED'),
    defaultValue: 'DRAFT',
  },
  totalPlannedMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  totalActualMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  }
});
