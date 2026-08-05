import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { Project, Task, Worklog, User } from '../models/index.js';
import { buildAnalyticsPayload } from './reportAnalytics.js';

const router = express.Router();
router.use(authenticate);

router.get('/analytics', async (req, res, next) => {
  try {
    const { dateFrom, dateTo, projectId, taskStatus, userId } = req.query;

    const [projects, tasks, worklogs, users] = await Promise.all([
      Project.findAll({ attributes: ['id', 'name', 'status'] }),
      Task.findAll({ attributes: ['id', 'title', 'status', 'actualMinutes', 'projectId', 'assigneeId', 'startTime', 'endTime'] }),
      Worklog.findAll({ attributes: ['id', 'logDate', 'taskMinutes', 'meetingMinutes', 'documentationMinutes', 'idleMinutes', 'userId'] }),
      User.findAll({ attributes: ['id', 'fullName'] }),
    ]);

    const payload = buildAnalyticsPayload({
      projects: projects.map((project) => project.toJSON()),
      tasks: tasks.map((task) => task.toJSON()),
      worklogs: worklogs.map((worklog) => worklog.toJSON()),
      users: users.map((user) => user.toJSON()),
      filters: {
        dateFrom,
        dateTo,
        projectId,
        taskStatus,
        userId,
      },
    });

    res.json(payload);
  } catch (error) {
    next(error);
  }
});

export default router;
