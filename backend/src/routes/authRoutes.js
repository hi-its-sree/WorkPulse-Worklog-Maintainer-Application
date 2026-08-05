import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.js';

const router = express.Router();

const securityQuestions = [
  { key: 'securityAnswerPetName', question: "What was your pet's name?" },
  { key: 'securityAnswerChildhoodNickname', question: 'What was your childhood nickname?' },
  { key: 'securityAnswerBirthplace', question: 'Where were you born?' },
  { key: 'securityAnswerFavoritePlace', question: 'What is your favorite place?' },
  { key: 'securityAnswerFavoriteMovie', question: 'What is your favorite movie?' },
];

const pickRandomQuestions = (questions, count) => {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

router.post('/register', [
  body('fullName').notEmpty(),
  body('employeeId').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  body('securityAnswerPetName').notEmpty(),
  body('securityAnswerChildhoodNickname').notEmpty(),
  body('securityAnswerBirthplace').notEmpty(),
  body('securityAnswerFavoritePlace').notEmpty(),
  body('securityAnswerFavoriteMovie').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    fullName,
    employeeId,
    email,
    department,
    jobTitle,
    phone,
    location,
    manager,
    password,
    role,
    securityAnswerPetName,
    securityAnswerChildhoodNickname,
    securityAnswerBirthplace,
    securityAnswerFavoritePlace,
    securityAnswerFavoriteMovie,
  } = req.body;

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    return res.status(409).json({ message: 'Email already in use' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const hashedPetName = await bcrypt.hash(securityAnswerPetName.trim().toLowerCase(), 12);
  const hashedNickname = await bcrypt.hash(securityAnswerChildhoodNickname.trim().toLowerCase(), 12);
  const hashedBirthplace = await bcrypt.hash(securityAnswerBirthplace.trim().toLowerCase(), 12);
  const hashedFavoritePlace = await bcrypt.hash(securityAnswerFavoritePlace.trim().toLowerCase(), 12);
  const hashedFavoriteMovie = await bcrypt.hash(securityAnswerFavoriteMovie.trim().toLowerCase(), 12);

  const user = await User.create({
    fullName,
    employeeId,
    email,
    department,
    jobTitle,
    phone,
    location,
    manager,
    password: hashedPassword,
    role: role || 'EMPLOYEE',
    securityAnswerPetName: hashedPetName,
    securityAnswerChildhoodNickname: hashedNickname,
    securityAnswerBirthplace: hashedBirthplace,
    securityAnswerFavoritePlace: hashedFavoritePlace,
    securityAnswerFavoriteMovie: hashedFavoriteMovie,
  });

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });

  res.status(201).json({
    token,
    user: {
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
    },
  });
});

router.post('/recover', [
  body('email').isEmail(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(400).json({ message: 'Unable to start password recovery. Please verify your email.' });
  }

  if (user.securityResetLockedUntil && user.securityResetLockedUntil > new Date()) {
    return res.status(429).json({ message: 'Too many incorrect attempts. Please try again later.' });
  }

  const selectedQuestions = pickRandomQuestions(securityQuestions, 3);
  const recoveryToken = jwt.sign({ email: user.email, questions: selectedQuestions.map((question) => question.key), purpose: 'security-recovery' }, process.env.JWT_SECRET, { expiresIn: '15m' });

  res.json({ questions: selectedQuestions.map(({ key, question }) => ({ key, question })), recoveryToken });
});

router.post('/recover/verify', [
  body('recoveryToken').notEmpty(),
  body('answers').isArray({ min: 3, max: 3 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { recoveryToken, answers } = req.body;
  let payload;

  try {
    payload = jwt.verify(recoveryToken, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(400).json({ message: 'Recovery link expired or invalid.' });
  }

  if (payload.purpose !== 'security-recovery') {
    return res.status(400).json({ message: 'Invalid recovery request.' });
  }

  const user = await User.findOne({ where: { email: payload.email } });
  if (!user) {
    return res.status(400).json({ message: 'Invalid recovery request.' });
  }

  if (user.securityResetLockedUntil && user.securityResetLockedUntil > new Date()) {
    return res.status(429).json({ message: 'Too many incorrect attempts. Please try again later.' });
  }

  if (!Array.isArray(answers) || answers.length !== payload.questions.length) {
    return res.status(400).json({ message: 'Answers are malformed.' });
  }

  let matched = true;
  for (const answer of answers) {
    if (!payload.questions.includes(answer.key) || typeof answer.answer !== 'string') {
      matched = false;
      break;
    }

    const normalizedAnswer = answer.answer.trim().toLowerCase();
    const storedHash = user[answer.key];
    if (!storedHash) {
      matched = false;
      break;
    }

    const isCorrect = await bcrypt.compare(normalizedAnswer, storedHash);
    if (!isCorrect) {
      matched = false;
      break;
    }
  }

  if (!matched) {
    user.securityResetAttempts += 1;
    if (user.securityResetAttempts >= 3) {
      user.securityResetLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
    await user.save();
    return res.status(401).json({ message: 'One or more answers are incorrect.' });
  }

  user.securityResetAttempts = 0;
  user.securityResetLockedUntil = null;
  await user.save();

  const resetToken = jwt.sign({ id: user.id, purpose: 'password-reset' }, process.env.JWT_SECRET, { expiresIn: '15m' });
  res.json({ resetToken });
});

router.post('/reset-password', [
  body('resetToken').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { resetToken, newPassword } = req.body;
  let payload;

  try {
    payload = jwt.verify(resetToken, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(400).json({ message: 'Reset token expired or invalid.' });
  }

  if (payload.purpose !== 'password-reset') {
    return res.status(400).json({ message: 'Invalid reset request.' });
  }

  const user = await User.findByPk(payload.id);
  if (!user) {
    return res.status(400).json({ message: 'Invalid reset request.' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  user.password = hashedPassword;
  user.securityResetAttempts = 0;
  user.securityResetLockedUntil = null;
  await user.save();

  res.json({ message: 'Password reset successfully.' });
});

router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });
  res.json({ token, user: {
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
