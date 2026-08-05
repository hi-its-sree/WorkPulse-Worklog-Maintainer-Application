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
  jobTitle: {
    type: DataTypes.STRING,
  },
  phone: {
    type: DataTypes.STRING,
  },
  location: {
    type: DataTypes.STRING,
  },
  manager: {
    type: DataTypes.STRING,
  },
  securityAnswerPetName: {
    type: DataTypes.STRING,
  },
  securityAnswerChildhoodNickname: {
    type: DataTypes.STRING,
  },
  securityAnswerBirthplace: {
    type: DataTypes.STRING,
  },
  securityAnswerFavoritePlace: {
    type: DataTypes.STRING,
  },
  securityAnswerFavoriteMovie: {
    type: DataTypes.STRING,
  },
  securityResetAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  securityResetLockedUntil: {
    type: DataTypes.DATE,
  },
  visibility: {
    type: DataTypes.STRING,
    defaultValue: 'Internal only',
  },
  accessLevel: {
    type: DataTypes.STRING,
    defaultValue: 'Standard user',
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Active',
  },
  lastLoginAt: {
    type: DataTypes.DATE,
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
