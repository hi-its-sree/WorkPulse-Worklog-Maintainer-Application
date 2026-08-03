import express from 'express';
import { body, validationResult } from 'express-validator';
import { DailyPlan } from '../models/dailyPlan.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();
router.use(authenticate);

router.post('/', [body('planDate').isISO8601()], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const plan = await DailyPlan.create({ ...req.body, userId: req.user.id });
    res.status(201).json(plan);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const plans = await DailyPlan.findAll({ where: { userId: req.user.id } });
    res.json(plans);
  } catch (error) {
    next(error);
  }
});

export default router;
