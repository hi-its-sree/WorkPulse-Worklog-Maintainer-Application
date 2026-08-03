import { DataTypes } from 'sequelize';
import { sequelize } from './db.js';

export const Approval = sequelize.define('Approval', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
    defaultValue: 'PENDING',
  },
  comment: {
    type: DataTypes.TEXT,
  },
  reviewedAt: {
    type: DataTypes.DATE,
  }
});
