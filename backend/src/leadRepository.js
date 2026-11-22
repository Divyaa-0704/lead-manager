const db = require('../db');

const SORTABLE_COLUMNS = ['name', 'email', 'company', 'status', 'created_at'];

// ownerId = a user's id means "only that user's leads".
// ownerId = null means "everyone's leads" (used for managers).

function findAll({ ownerId, search, status, sortBy, order, page, limit }) {
  const conditions = [];
  const params = {};

  if (ownerId) {
    conditions.push('l.user_id = @ownerId');
    params.ownerId = ownerId;
  }
  if (search) {
    conditions.push('(l.name LIKE @search OR l.email LIKE @search OR l.company LIKE @search)');
    params.search = `%${search}%`;
  }
  if (status) {
    conditions.push('l.status = @status');
    params.status = status;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sortColumn = SORTABLE_COLUMNS.includes(sortBy) ? sortBy : 'created_at';
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
  const offset = (page - 1) * limit;

  const total = db
    .prepare(`SELECT COUNT(*) AS count FROM leads l ${where}`)
    .get(params).count;
  const leads = db
    .prepare(
      `SELECT l.*, u.name AS owner_name
       FROM leads l JOIN users u ON u.id = l.user_id
       ${where}
       ORDER BY l.${sortColumn} ${sortOrder}
       LIMIT @limit OFFSET @offset`
    )
    .all({ ...params, limit, offset });

  return { leads, total };
}

function findById(id, ownerId = null) {
  const lead = db
    .prepare(
      `SELECT l.*, u.name AS owner_name
       FROM leads l JOIN users u ON u.id = l.user_id
       WHERE l.id = ?`
    )
    .get(id);
  if (!lead) return undefined;
  if (ownerId && lead.user_id !== ownerId) return undefined;
  return lead;
}

function create(userId, { name, email, phone, company, source, status }) {
  const result = db
    .prepare(
      `INSERT INTO leads (user_id, name, email, phone, company, source, status)
       VALUES (@userId, @name, @email, @phone, @company, @source, @status)`
    )
    .run({ userId, name, email, phone, company, source, status });
  return findById(result.lastInsertRowid);
}

function update(id, ownerId, { name, email, phone, company, source, status }) {
  const result = db
    .prepare(
      `UPDATE leads
       SET name = @name, email = @email, phone = @phone, company = @company,
           source = @source, status = @status, updated_at = datetime('now')
       WHERE id = @id AND (@ownerId IS NULL OR user_id = @ownerId)`
    )
    .run({ id, ownerId, name, email, phone, company, source, status });
  return result.changes ? findById(id) : null;
}

function remove(id, ownerId) {
  return (
    db
      .prepare('DELETE FROM leads WHERE id = @id AND (@ownerId IS NULL OR user_id = @ownerId)')
      .run({ id, ownerId }).changes > 0
  );
}

function countByStatus(ownerId) {
  if (ownerId) {
    return db
      .prepare('SELECT status, COUNT(*) AS count FROM leads WHERE user_id = ? GROUP BY status')
      .all(ownerId);
  }
  return db.prepare('SELECT status, COUNT(*) AS count FROM leads GROUP BY status').all();
}

module.exports = { findAll, findById, create, update, remove, countByStatus };