import express from 'express';
import { User } from '../models/user.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  const users = await User.findAll({ attributes: ['id', 'fullName', 'employeeId', 'email', 'department', 'jobTitle', 'role', 'enabled'] });
  res.json(users);
});

router.get('/me', async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: ['id', 'fullName', 'employeeId', 'email', 'department', 'jobTitle', 'phone', 'location', 'manager', 'role', 'status', 'accessLevel', 'visibility', 'createdAt', 'lastLoginAt'],
  });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

router.patch('/me', async (req, res) => {
  const allowedUpdates = ['fullName', 'phone', 'location', 'manager'];
  const updates = Object.keys(req.body).filter((key) => allowedUpdates.includes(key));
  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  updates.forEach((field) => {
    user[field] = req.body[field];
  });

  await user.save();
  res.json({ message: 'Profile updated successfully', user: {
    id: user.id,
    fullName: user.fullName,
    employeeId: user.employeeId,
    email: user.email,
    department: user.department,
    jobTitle: user.jobTitle,
    phone: user.phone,
    location: user.location,
    manager: user.manager,
    role: user.role,
    status: user.status,
    accessLevel: user.accessLevel,
    visibility: user.visibility,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  } });
});

export default router;
