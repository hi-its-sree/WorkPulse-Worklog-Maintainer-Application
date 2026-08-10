import { DataTypes } from 'sequelize';
import { sequelize } from './db.js';

export const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  projectNumber: {
    type: DataTypes.STRING,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  client: {
    type: DataTypes.STRING,
  },
  manager: {
    type: DataTypes.STRING,
  },
  teamMembers: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  startDate: {
    type: DataTypes.DATEONLY,
  },
  endDate: {
    type: DataTypes.DATEONLY,
  },
  status: {
    type: DataTypes.ENUM('PLANNED', 'ACTIVE', 'AT_RISK', 'COMPLETED', 'ON_HOLD'),
    defaultValue: 'PLANNED',
  }
});
