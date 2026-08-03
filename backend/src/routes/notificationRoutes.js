import express from 'express';
import { Notification } from '../models/notification.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const notes = await Notification.findAll({ where: { recipientId: req.user.id }, order: [['createdAt', 'DESC']] });
    res.json(notes);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    const note = await Notification.findByPk(req.params.id);
    if (!note || note.recipientId !== req.user.id) return res.status(404).json({ message: 'Notification not found' });
    await note.update({ read: true });
    res.json(note);
  } catch (error) {
    next(error);
  }
});

export default router;
