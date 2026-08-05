import express from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import projectRoutes from './projectRoutes.js';
import taskRoutes from './taskRoutes.js';
import meetingRoutes from './meetingRoutes.js';
import worklogRoutes from './worklogRoutes.js';
import dailyPlanRoutes from './dailyPlanRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import documentRoutes from './documentRoutes.js';
import approvalRoutes from './approvalRoutes.js';
import timeEntryRoutes from './timeEntryRoutes.js';
import reportRoutes from './reportRoutes.js';

const router = express.Router();
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/meetings', meetingRoutes);
router.use('/worklogs', worklogRoutes);
router.use('/daily-plans', dailyPlanRoutes);
router.use('/notifications', notificationRoutes);
router.use('/documents', documentRoutes);
router.use('/approvals', approvalRoutes);
router.use('/time-entries', timeEntryRoutes);
router.use('/reports', reportRoutes);

export default router;
