import express from 'express';
import { body, validationResult } from 'express-validator';
import { TimeEntry } from '../models/timeEntry.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();
router.use(authenticate);

router.post('/', [body('entryDate').isISO8601(), body('minutes').isInt({ min: 0 })], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const entry = await TimeEntry.create({ ...req.body, userId: req.user.id });
    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const entries = await TimeEntry.findAll({ where: { userId: req.user.id } });
    res.json(entries);
  } catch (error) {
    next(error);
  }
});

export default router;
