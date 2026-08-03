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
  totalPlannedMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  totalActualMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  }
});
