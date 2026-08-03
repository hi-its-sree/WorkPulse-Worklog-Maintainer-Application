import { DataTypes } from 'sequelize';
import { sequelize } from './db.js';

export const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  employeeId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  department: {
    type: DataTypes.STRING,
  },
  designation: {
    type: DataTypes.STRING,
  },
  role: {
    type: DataTypes.ENUM('EMPLOYEE', 'TEAM_LEAD', 'PROJECT_MANAGER', 'HR', 'ADMIN'),
    allowNull: false,
    defaultValue: 'EMPLOYEE',
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});
