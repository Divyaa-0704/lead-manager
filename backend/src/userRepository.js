const db = require('../db');

function findByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

function findById(id) {
  return db
    .prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?')
    .get(id);
}

function create({ name, email, passwordHash, role }) {
  const result = db
    .prepare(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES (@name, @email, @passwordHash, @role)`
    )
    .run({ name, email, passwordHash, role });
  return findById(result.lastInsertRowid);
}

module.exports = { findByEmail, findById, create };