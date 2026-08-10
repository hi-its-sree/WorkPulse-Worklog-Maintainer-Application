import express from 'express';
import { body, validationResult } from 'express-validator';
import { Project } from '../models/project.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();
// Every signed-in member can maintain the project register: the app has no role
// administration screen yet, so gating writes by role locked everyone out.
router.use(authenticate);

const editableFields = ['projectNumber', 'name', 'description', 'client', 'manager', 'teamMembers', 'startDate', 'endDate', 'status'];

// Dates are optional: a project can be registered before its schedule is agreed.
const pickProjectPayload = (body) => editableFields.reduce((payload, field) => {
  if (body[field] === undefined) return payload;
  if ((field === 'startDate' || field === 'endDate') && !body[field]) return { ...payload, [field]: null };
  if (field === 'teamMembers') return { ...payload, teamMembers: Array.isArray(body.teamMembers) ? body.teamMembers : [] };
  return { ...payload, [field]: body[field] };
}, {});

router.post('/', [
  body('name').notEmpty(),
  body('startDate').optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body('endDate').optional({ nullable: true, checkFalsy: true }).isISO8601(),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const project = await Project.create(pickProjectPayload(req.body));
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const projects = await Project.findAll({ order: [['id', 'DESC']] });
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    await project.update(pickProjectPayload(req.body));
    res.json(project);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    await project.destroy();
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
