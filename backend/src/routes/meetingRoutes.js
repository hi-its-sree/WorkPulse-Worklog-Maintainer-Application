import express from 'express';
import { body, validationResult } from 'express-validator';
import { Meeting } from '../models/meeting.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();
router.use(authenticate);

router.post('/', [
  body('title').notEmpty(),
  body('date').isISO8601(),
  body('durationMinutes').isInt({ min: 1 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const meeting = await Meeting.create(req.body);
  res.status(201).json(meeting);
});

router.get('/', async (req, res) => {
  const meetings = await Meeting.findAll();
  res.json(meetings);
});

router.patch('/:id', async (req, res) => {
  const meeting = await Meeting.findByPk(req.params.id);
  if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
  await meeting.update(req.body);
  res.json(meeting);
});

export default router;
