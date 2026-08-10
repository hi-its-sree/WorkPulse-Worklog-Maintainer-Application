import express from 'express';
import { Op } from 'sequelize';
import { body, validationResult } from 'express-validator';
import { DailyPlan } from '../models/dailyPlan.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();
router.use(authenticate);

const planFields = ['summary', 'tasks', 'meetings', 'documentation', 'others', 'status', 'totalPlannedMinutes', 'totalActualMinutes'];

const pickPlanPayload = (payload = {}) => planFields.reduce((acc, field) => (
  payload[field] === undefined ? acc : { ...acc, [field]: payload[field] }
), {});

const buildDateFilter = (query) => {
  if (query.dateFrom && query.dateTo) return { [Op.between]: [query.dateFrom, query.dateTo] };
  if (query.dateFrom) return { [Op.gte]: query.dateFrom };
  if (query.dateTo) return { [Op.lte]: query.dateTo };
  return null;
};

router.get('/', async (req, res, next) => {
  try {
    const where = { userId: req.user.id };
    const dateFilter = buildDateFilter(req.query);
    if (dateFilter) where.planDate = dateFilter;
    const plans = await DailyPlan.findAll({ where, order: [['planDate', 'ASC']] });
    res.json(plans);
  } catch (error) {
    next(error);
  }
});

router.get('/:planDate', async (req, res, next) => {
  try {
    const plan = await DailyPlan.findOne({ where: { userId: req.user.id, planDate: req.params.planDate } });
    if (!plan) return res.status(404).json({ message: 'No plan saved for this date' });
    res.json(plan);
  } catch (error) {
    next(error);
  }
});

// One plan per person per day: saving the same date again updates it in place.
router.put('/:planDate', async (req, res, next) => {
  try {
    const planDate = req.params.planDate;
    const existing = await DailyPlan.findOne({ where: { userId: req.user.id, planDate } });
    if (existing) {
      await existing.update(pickPlanPayload(req.body));
      return res.json(existing);
    }
    const plan = await DailyPlan.create({ ...pickPlanPayload(req.body), planDate, userId: req.user.id });
    res.status(201).json(plan);
  } catch (error) {
    next(error);
  }
});

router.post('/', [body('planDate').isISO8601()], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const plan = await DailyPlan.create({ ...pickPlanPayload(req.body), planDate: req.body.planDate, userId: req.user.id });
    res.status(201).json(plan);
  } catch (error) {
    next(error);
  }
});

router.delete('/:planDate', async (req, res, next) => {
  try {
    const removed = await DailyPlan.destroy({ where: { userId: req.user.id, planDate: req.params.planDate } });
    if (!removed) return res.status(404).json({ message: 'No plan saved for this date' });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
