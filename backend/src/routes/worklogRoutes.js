import express from 'express';
import { Op } from 'sequelize';
import { body, validationResult } from 'express-validator';
import { Worklog } from '../models/worklog.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();
router.use(authenticate);

const MANAGER_ROLES = ['ADMIN', 'HR', 'PROJECT_MANAGER', 'TEAM_LEAD'];

const worklogFields = ['details', 'remarks', 'completionStatus', 'status', 'approvalNotes', 'idleMinutes'];

export const WORKLOG_ROLLUP_FIELDS = ['plannedMinutes', 'actualMinutes', 'taskMinutes', 'meetingMinutes', 'documentationMinutes', 'otherMinutes'];

const minutesOf = (detail) => Number(detail?.actualMinutes || 0);

// The per-session rows are the source of truth; the rollups analytics reads are
// derived here so a saved worklog can never disagree with the reports.
const buildRollups = (details = []) => {
  const rows = Array.isArray(details) ? details : [];
  const sumByKind = (kind) => rows.filter((detail) => detail?.kind === kind).reduce((sum, detail) => sum + minutesOf(detail), 0);

  return {
    plannedMinutes: rows.reduce((sum, detail) => sum + Number(detail?.plannedMinutes || 0), 0),
    actualMinutes: rows.reduce((sum, detail) => sum + minutesOf(detail), 0),
    taskMinutes: sumByKind('TASK'),
    meetingMinutes: sumByKind('MEETING'),
    documentationMinutes: sumByKind('DOCUMENTATION'),
    otherMinutes: sumByKind('OTHER'),
  };
};

const pickWorklogPayload = (payload = {}) => {
  const picked = worklogFields.reduce((acc, field) => (
    payload[field] === undefined ? acc : { ...acc, [field]: payload[field] }
  ), {});
  return { ...picked, ...buildRollups(payload.details) };
};

const buildDateFilter = (query) => {
  if (query.dateFrom && query.dateTo) return { [Op.between]: [query.dateFrom, query.dateTo] };
  if (query.dateFrom) return { [Op.gte]: query.dateFrom };
  if (query.dateTo) return { [Op.lte]: query.dateTo };
  return null;
};

router.get('/', async (req, res, next) => {
  try {
    const where = {};
    const canSeeEveryone = MANAGER_ROLES.includes(req.user.role);
    if (req.query.userId) {
      where.userId = Number(req.query.userId);
    } else if (!(canSeeEveryone && req.query.scope === 'all')) {
      where.userId = req.user.id;
    }
    const dateFilter = buildDateFilter(req.query);
    if (dateFilter) where.logDate = dateFilter;

    const worklogs = await Worklog.findAll({ where, order: [['logDate', 'ASC']] });
    res.json(worklogs);
  } catch (error) {
    next(error);
  }
});

router.get('/:logDate', async (req, res, next) => {
  try {
    const worklog = await Worklog.findOne({ where: { userId: req.user.id, logDate: req.params.logDate } });
    if (!worklog) return res.status(404).json({ message: 'No worklog saved for this date' });
    res.json(worklog);
  } catch (error) {
    next(error);
  }
});

// One worklog per person per day: saving the same date again updates it in place.
router.put('/:logDate', async (req, res, next) => {
  try {
    const logDate = req.params.logDate;
    const existing = await Worklog.findOne({ where: { userId: req.user.id, logDate } });
    if (existing) {
      await existing.update(pickWorklogPayload(req.body));
      return res.json(existing);
    }
    const worklog = await Worklog.create({ ...pickWorklogPayload(req.body), logDate, userId: req.user.id });
    res.status(201).json(worklog);
  } catch (error) {
    next(error);
  }
});

router.post('/', [body('logDate').isISO8601()], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const worklog = await Worklog.create({ ...pickWorklogPayload(req.body), logDate: req.body.logDate, userId: req.user.id, status: 'DRAFT' });
    res.status(201).json(worklog);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/submit', async (req, res, next) => {
  try {
    const worklog = await Worklog.findByPk(req.params.id);
    if (!worklog) return res.status(404).json({ message: 'Worklog not found' });
    if (worklog.userId !== req.user.id && !MANAGER_ROLES.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    await worklog.update({ status: 'SUBMITTED' });
    res.json(worklog);
  } catch (error) {
    next(error);
  }
});

export default router;
