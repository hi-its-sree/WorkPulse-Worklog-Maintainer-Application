import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.js';
import { Notification } from '../models/notification.js';
import { authenticate } from '../middleware/authenticate.js';
import { buildUserResponse } from '../utils/buildUserResponse.js';
import { isProfileComplete, PROFILE_INCOMPLETE_KEY } from '../utils/profileCompletion.js';

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
  } = req.body;

  const existing = await User.findOne({ where: { employeeId } });
  if (existing) {
    return res.status(409).json({ message: 'Employee ID already in use' });
  }
  const existingEmail = await User.findOne({ where: { email } });
  if (existingEmail) {
    return res.status(409).json({ message: 'Email already in use' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

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
  });


  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });

  res.status(201).json({
    token,
    user: buildUserResponse(user),
  });
});

router.post('/recover', [
  body('email').isEmail(),
  body('employeeId').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, employeeId } = req.body || {};

  const user = await User.findOne({ where: { email, employeeId } });
  if (!user) {
    return res.status(400).json({ message: 'Unable to start password recovery. Please verify your email and employee ID.' });
  }

  if (user.securityResetLockedUntil && user.securityResetLockedUntil > new Date()) {
    return res.status(429).json({ message: 'Too many incorrect attempts. Please try again later.' });
  }

  // Build list of questions the user has answered (should be 5 after setup)
  const userQuestions = securityQuestions.filter((q) => !!user[q.key]);
  if (userQuestions.length < 3) return res.status(400).json({ message: 'Not enough security questions configured for this account.' });

  const recoveryToken = jwt.sign({ id: user.id, questions: userQuestions.map((question) => question.key), purpose: 'security-recovery' }, process.env.JWT_SECRET, { expiresIn: '15m' });

  res.json({ questions: userQuestions.map(({ key, question }) => ({ key, question })), recoveryToken });
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

  const user = await User.findByPk(payload.id);
  if (!user) {
    return res.status(400).json({ message: 'Invalid recovery request.' });
  }

  if (user.securityResetLockedUntil && user.securityResetLockedUntil > new Date()) {
    return res.status(429).json({ message: 'Too many incorrect attempts. Please try again later.' });
  }

  if (!Array.isArray(answers) || answers.length !== 3) {
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
  body('employeeId').notEmpty(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { employeeId, password } = req.body;
  const user = await User.findOne({ where: { employeeId } });
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
  res.json({ token, user: buildUserResponse(user) });
});

router.get('/security-questions', authenticate, async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  if (
    user.securityAnswerPetName &&
    user.securityAnswerChildhoodNickname &&
    user.securityAnswerBirthplace &&
    user.securityAnswerFavoritePlace &&
    user.securityAnswerFavoriteMovie
  ) {
    return res.status(400).json({ message: 'Security questions are already configured.' });
  }

  // Return the full set of available questions for initial setup (user must answer all)
  const questions = securityQuestions;
  const setupToken = jwt.sign(
    { id: user.id, questions: questions.map((question) => question.key), purpose: 'security-setup' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  res.json({
    questions: questions.map(({ key, question }) => ({ key, question })),
    setupToken,
  });
});

router.post('/security-questions', [
  body('setupToken').notEmpty(),
  body('answers').isArray({ min: 5, max: 5 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { setupToken, answers } = req.body;
  let payload;

  try {
    payload = jwt.verify(setupToken, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(400).json({ message: 'Security setup token expired or invalid.' });
  }

  if (payload.purpose !== 'security-setup') {
    return res.status(400).json({ message: 'Invalid security setup request.' });
  }

  const user = await User.findByPk(payload.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  if (
    user.securityAnswerPetName &&
    user.securityAnswerChildhoodNickname &&
    user.securityAnswerBirthplace &&
    user.securityAnswerFavoritePlace &&
    user.securityAnswerFavoriteMovie
  ) {
    return res.status(400).json({ message: 'Security questions are already configured.' });
  }

  if (!Array.isArray(answers) || answers.length !== payload.questions.length) {
    return res.status(400).json({ message: 'Answers are malformed.' });
  }

  for (const answer of answers) {
    if (!payload.questions.includes(answer.key) || typeof answer.answer !== 'string') {
      return res.status(400).json({ message: 'Answers are malformed.' });
    }
  }

  const answerMap = {};
  for (const answer of answers) {
    const normalizedAnswer = answer.answer.trim().toLowerCase();
    answerMap[answer.key] = await bcrypt.hash(normalizedAnswer, 12);
  }

  user.securityAnswerPetName = answerMap.securityAnswerPetName;
  user.securityAnswerChildhoodNickname = answerMap.securityAnswerChildhoodNickname;
  user.securityAnswerBirthplace = answerMap.securityAnswerBirthplace;
  user.securityAnswerFavoritePlace = answerMap.securityAnswerFavoritePlace;
  user.securityAnswerFavoriteMovie = answerMap.securityAnswerFavoriteMovie;
  await user.save();

  // Ask for the missing profile details — but only while any are actually missing.
  try {
    if (!isProfileComplete(user)) {
      await Notification.create({
        recipientId: user.id,
        title: 'Complete your profile',
        body: 'Please complete your profile details (phone, location, job title, department) to get full access and notifications.',
        category: 'SYSTEM',
        key: PROFILE_INCOMPLETE_KEY,
      });
    }
  } catch (err) {
    console.error('Failed to create post-setup notification', err);
  }

  res.json({ user: buildUserResponse(user) });
});

export default router;
