import { User } from './user.js';
import { Department } from './department.js';
import { Project } from './project.js';
import { ProjectModule } from './projectModule.js';
import { Task } from './task.js';
import { DailyPlan } from './dailyPlan.js';
import { Meeting } from './meeting.js';
import { Worklog } from './worklog.js';
import { Notification } from './notification.js';
import { AuditLog } from './auditLog.js';
import { Document } from './document.js';
import { Approval } from './approval.js';
import { TimeEntry } from './timeEntry.js';
import { ProjectAssignment } from './projectAssignment.js';

User.belongsTo(Department, { foreignKey: 'departmentId', as: 'departmentRecord' });
Department.hasMany(User, { foreignKey: 'departmentId', as: 'users' });

Project.hasMany(Task, { foreignKey: 'projectId', as: 'tasks' });
Task.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

Project.hasMany(ProjectModule, { foreignKey: 'projectId', as: 'modules' });
ProjectModule.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// Aliased `assignedUsers` because `teamMembers` is the project's own column of
// free-text member names entered on the project form.
Project.belongsToMany(User, { through: ProjectAssignment, foreignKey: 'projectId', otherKey: 'userId', as: 'assignedUsers' });
User.belongsToMany(Project, { through: ProjectAssignment, foreignKey: 'userId', otherKey: 'projectId', as: 'projects' });

Task.belongsTo(User, { foreignKey: 'assigneeId', as: 'assignee' });
User.hasMany(Task, { foreignKey: 'assigneeId', as: 'tasks' });

DailyPlan.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
User.hasMany(DailyPlan, { foreignKey: 'userId', as: 'dailyPlans' });

Meeting.belongsTo(User, { foreignKey: 'organizerId', as: 'organizer' });
User.hasMany(Meeting, { foreignKey: 'organizerId', as: 'meetings' });

Worklog.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
User.hasMany(Worklog, { foreignKey: 'userId', as: 'worklogs' });

TimeEntry.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(TimeEntry, { foreignKey: 'userId', as: 'timeEntries' });

Document.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
User.hasMany(Document, { foreignKey: 'authorId', as: 'documents' });

Approval.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });
User.hasMany(Approval, { foreignKey: 'reviewerId', as: 'approvals' });

Notification.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });
User.hasMany(Notification, { foreignKey: 'recipientId', as: 'notifications' });

AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'actor' });
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
