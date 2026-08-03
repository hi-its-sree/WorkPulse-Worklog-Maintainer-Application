import express from 'express';
import { body, validationResult } from 'express-validator';
import { Worklog } from '../models/worklog.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();
router.use(authenticate);

router.post('/', [
  body('logDate').isISO8601(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const worklog = await Worklog.create({ ...req.body, status: 'DRAFT' });
  res.status(201).json(worklog);
});

router.get('/', async (req, res) => {
  const worklogs = await Worklog.findAll();
  res.json(worklogs);
});

router.patch('/:id/submit', async (req, res) => {
  const worklog = await Worklog.findByPk(req.params.id);
  if (!worklog) return res.status(404).json({ message: 'Worklog not found' });
  await worklog.update({ status: 'SUBMITTED' });
  res.json(worklog);
});

export default router;
