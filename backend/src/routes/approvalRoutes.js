import express from 'express';
import { Approval } from '../models/approval.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();
router.use(authenticate);

router.get('/', authorize(['ADMIN', 'HR', 'PROJECT_MANAGER', 'TEAM_LEAD']), async (req, res, next) => {
  try {
    const approvals = await Approval.findAll();
    res.json(approvals);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', authorize(['ADMIN', 'HR', 'PROJECT_MANAGER', 'TEAM_LEAD']), async (req, res, next) => {
  try {
    const approval = await Approval.findByPk(req.params.id);
    if (!approval) return res.status(404).json({ message: 'Approval not found' });
    await approval.update({ status: req.body.status, comment: req.body.comment, reviewedAt: new Date() });
    res.json(approval);
  } catch (error) {
    next(error);
  }
});

export default router;
