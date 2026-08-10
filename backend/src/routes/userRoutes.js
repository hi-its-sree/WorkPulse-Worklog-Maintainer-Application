import express from 'express';
import { User } from '../models/user.js';
import { authenticate } from '../middleware/authenticate.js';
import { buildUserResponse } from '../utils/buildUserResponse.js';
import { isProfileComplete } from '../utils/profileCompletion.js';
import { resolveProfileNotifications } from '../utils/resolveProfileNotifications.js';

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  const users = await User.findAll({ attributes: ['id', 'fullName', 'employeeId', 'email', 'department', 'jobTitle', 'role', 'enabled'] });
  res.json(users);
});

router.get('/me', async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(buildUserResponse(user));
});

router.patch('/me', async (req, res) => {
  const allowedUpdates = ['fullName', 'email', 'employeeId', 'department', 'jobTitle', 'phone', 'location', 'manager'];
  const updates = Object.keys(req.body).filter((key) => allowedUpdates.includes(key));
  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  updates.forEach((field) => {
    user[field] = req.body[field];
  });

  await user.save();

  // The reminder has served its purpose once the profile is complete.
  if (isProfileComplete(user)) {
    await resolveProfileNotifications(user.id);
  }

  res.json({ message: 'Profile updated successfully', user: buildUserResponse(user) });
});

export default router;
