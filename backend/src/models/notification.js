import { DataTypes } from 'sequelize';
import { sequelize } from './db.js';

export const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  body: {
    type: DataTypes.TEXT,
  },
  category: {
    type: DataTypes.ENUM('MEETING', 'WORKLOG', 'APPROVAL', 'DEADLINE', 'SYSTEM'),
    defaultValue: 'SYSTEM',
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
});
