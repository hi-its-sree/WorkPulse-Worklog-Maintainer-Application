import { DataTypes } from 'sequelize';
import { sequelize } from './db.js';

export const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('TECHNICAL', 'USER_MANUAL', 'REQUIREMENT', 'DESIGN', 'OTHER'),
    defaultValue: 'OTHER',
  },
  status: {
    type: DataTypes.ENUM('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED'),
    defaultValue: 'DRAFT',
  },
  content: {
    type: DataTypes.TEXT,
  }
});
