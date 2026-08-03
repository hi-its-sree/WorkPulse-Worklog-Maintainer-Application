import express from 'express';
import { body, validationResult } from 'express-validator';
import { Task } from '../models/task.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();
router.use(authenticate);

router.post('/', [
  body('title').notEmpty(),
  body('plannedMinutes').isInt({ min: 0 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const task = await Task.create({ ...req.body, status: 'PLANNED' });
  res.status(201).json(task);
});

router.get('/', async (req, res) => {
  const tasks = await Task.findAll();
  res.json(tasks);
});

router.patch('/:id', async (req, res) => {
  const task = await Task.findByPk(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  await task.update(req.body);
  res.json(task);
});

export default router;
