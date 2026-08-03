import express from 'express';
import { body, validationResult } from 'express-validator';
import { Project } from '../models/project.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();
router.use(authenticate);

router.post('/', authorize(['ADMIN', 'PROJECT_MANAGER']), [
  body('name').notEmpty(),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const project = await Project.create(req.body);
  res.status(201).json(project);
});

router.get('/', async (req, res) => {
  const projects = await Project.findAll();
  res.json(projects);
});

export default router;
