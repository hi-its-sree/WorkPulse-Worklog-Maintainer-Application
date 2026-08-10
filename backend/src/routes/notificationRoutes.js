import express from 'express';
import { Op } from 'sequelize';
import { Notification } from '../models/notification.js';
import { User } from '../models/user.js';
import { authenticate } from '../middleware/authenticate.js';
import { isProfileComplete } from '../utils/profileCompletion.js';
import { resolveProfileNotifications } from '../utils/resolveProfileNotifications.js';

const router = express.Router();
router.use(authenticate);

const SNOOZE_LIMIT_MINUTES = 60 * 24 * 30;

// A notification stays listed until it is seen, snoozed into the future, or the
// thing it was asking for is done.
const visibleWhere = (userId) => ({
  recipientId: userId,
  dismissedAt: null,
  resolvedAt: null,
  [Op.or]: [{ snoozedUntil: null }, { snoozedUntil: { [Op.lte]: new Date() } }],
});

// Retires reminders whose purpose has since been fulfilled, including ones raised
// before the profile was completed.
const resolveFulfilled = async (userId) => {
  const user = await User.findByPk(userId);
  if (user && isProfileComplete(user)) {
    await resolveProfileNotifications(userId);
  }
};

const findOwned = async (id, userId) => {
  const note = await Notification.findByPk(id);
  if (!note || note.recipientId !== userId) return null;
  return note;
};

router.get('/', async (req, res, next) => {
  try {
    await resolveFulfilled(req.user.id);
    const notes = await Notification.findAll({ where: visibleWhere(req.user.id), order: [['createdAt', 'DESC']] });
    res.json(notes);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    const note = await findOwned(req.params.id, req.user.id);
    if (!note) return res.status(404).json({ message: 'Notification not found' });
    await note.update({ read: true });
    res.json(note);
  } catch (error) {
    next(error);
  }
});

// Seen: the person has dealt with it, so it leaves the list for good.
router.patch('/:id/seen', async (req, res, next) => {
  try {
    const note = await findOwned(req.params.id, req.user.id);
    if (!note) return res.status(404).json({ message: 'Notification not found' });
    await note.update({ read: true, dismissedAt: new Date(), snoozedUntil: null });
    res.json(note);
  } catch (error) {
    next(error);
  }
});

// Remind me later: hidden until the chosen delay has passed, then it comes back.
router.patch('/:id/snooze', async (req, res, next) => {
  try {
    const minutes = Number(req.body?.minutes);
    if (!Number.isFinite(minutes) || minutes <= 0 || minutes > SNOOZE_LIMIT_MINUTES) {
      return res.status(400).json({ message: 'A snooze between 1 minute and 30 days is required.' });
    }

    const note = await findOwned(req.params.id, req.user.id);
    if (!note) return res.status(404).json({ message: 'Notification not found' });

    const snoozedUntil = new Date(Date.now() + minutes * 60 * 1000);
    await note.update({ snoozedUntil, read: false });
    res.json(note);
  } catch (error) {
    next(error);
  }
});

export default router;
