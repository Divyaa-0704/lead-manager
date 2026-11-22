const jwt = require('jsonwebtoken');
const userRepo = require('./userRepository');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is missing. Add it to backend/.env');
}

function signToken(user) {
  return jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please log in' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = userRepo.findById(payload.id);
    if (!user) return res.status(401).json({ error: 'Please log in again' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }
}

module.exports = { signToken, requireAuth };