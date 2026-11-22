const db = require('../db');

const SORTABLE_COLUMNS = ['name', 'email', 'company', 'status', 'created_at'];

function findAll({ search, status, sortBy, order, page, limit }) {
  const conditions = [];
  const params = {};

  if (search) {
    conditions.push('(name LIKE @search OR email LIKE @search OR company LIKE @search)');
    params.search = `%${search}%`;
  }
  if (status) {
    conditions.push('status = @status');
    params.status = status;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sortColumn = SORTABLE_COLUMNS.includes(sortBy) ? sortBy : 'created_at';
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
  const offset = (page - 1) * limit;

  const total = db.prepare(`SELECT COUNT(*) AS count FROM leads ${where}`).get(params).count;
  const leads = db
    .prepare(`SELECT * FROM leads ${where} ORDER BY ${sortColumn} ${sortOrder} LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit, offset });

  return { leads, total };
}

function findById(id) {
  return db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
}

function create({ name, email, phone, company, source, status }) {
  const result = db
    .prepare(
      `INSERT INTO leads (name, email, phone, company, source, status)
       VALUES (@name, @email, @phone, @company, @source, @status)`
    )
    .run({ name, email, phone, company, source, status });
  return findById(result.lastInsertRowid);
}

function update(id, { name, email, phone, company, source, status }) {
  const result = db
    .prepare(
      `UPDATE leads
       SET name = @name, email = @email, phone = @phone, company = @company,
           source = @source, status = @status, updated_at = datetime('now')
       WHERE id = @id`
    )
    .run({ id, name, email, phone, company, source, status });
  return result.changes ? findById(id) : null;
}

function remove(id) {
  return db.prepare('DELETE FROM leads WHERE id = ?').run(id).changes > 0;
}

function countByStatus() {
  return db.prepare('SELECT status, COUNT(*) AS count FROM leads GROUP BY status').all();
}

module.exports = { findAll, findById, create, update, remove, countByStatus };