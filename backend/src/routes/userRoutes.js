import express from 'express';
import { User } from '../models/user.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  const users = await User.findAll({ attributes: ['id', 'fullName', 'employeeId', 'email', 'department', 'designation', 'role', 'enabled'] });
  res.json(users);
});

export default router;
