const express = require('express');
const bcrypt = require('bcryptjs');
const userRepo = require('./userRepository');
const { signToken, requireAuth } = require('./auth');
const { EMAIL_REGEX } = require('./validation');

const router = express.Router();

const MANAGER_EMAILS = (process.env.MANAGER_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

function authResponse(user) {
  return { token: signToken(user), user };
}

// POST /api/auth/signup
router.post('/signup', async (req, res, next) => {
  try {
    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    const errors = {};
    if (!name) errors.name = 'Name is required';
    if (!email) errors.email = 'Email is required';
    else if (!EMAIL_REGEX.test(email)) errors.email = 'Email is not valid';
    if (!password) errors.password = 'Password is required';
    else if (password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    if (userRepo.findByEmail(email)) {
      return res.status(409).json({
        error: 'Validation failed',
        details: { email: 'An account with this email already exists' },
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const role = MANAGER_EMAILS.includes(email) ? 'manager' : 'sales';
    const user = userRepo.create({ name, email, passwordHash, role });
    res.status(201).json(authResponse(user));
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    const found = email ? userRepo.findByEmail(email) : null;
    const matches = found ? await bcrypt.compare(password, found.password_hash) : false;
    if (!matches) return res.status(401).json({ error: 'Incorrect email or password' });

    res.json(authResponse(userRepo.findById(found.id)));
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

module.exports = router;