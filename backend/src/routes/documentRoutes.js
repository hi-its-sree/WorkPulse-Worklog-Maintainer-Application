import express from 'express';
import { body, validationResult } from 'express-validator';
import { Document } from '../models/document.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();
router.use(authenticate);

router.post('/', [body('title').notEmpty()], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const document = await Document.create({ ...req.body, authorId: req.user.id });
    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const docs = await Document.findAll({ where: { authorId: req.user.id } });
    res.json(docs);
  } catch (error) {
    next(error);
  }
});

export default router;
