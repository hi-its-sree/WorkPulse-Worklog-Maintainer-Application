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
  // Names what the notification is asking for, so it can be retired automatically
  // once that thing is done (e.g. PROFILE_INCOMPLETE once the profile is filled in).
  key: {
    type: DataTypes.STRING,
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // Set when the person marks it seen: it stops being listed.
  dismissedAt: {
    type: DataTypes.DATE,
  },
  // "Remind me later": hidden until this moment passes, then listed again.
  snoozedUntil: {
    type: DataTypes.DATE,
  },
  // Set when whatever it was asking for has happened.
  resolvedAt: {
    type: DataTypes.DATE,
  }
});
