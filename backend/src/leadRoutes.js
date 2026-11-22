const express = require('express');
const repo = require('./leadRepository');
const { validateLead, STATUSES } = require('./validation');

const router = express.Router();

function parseId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'Invalid lead id' });
    return null;
  }
  return id;
}

// GET /api/leads?search=&status=&sortBy=&order=&page=&limit=
router.get('/', (req, res) => {
  const { search, status, sortBy, order } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

  if (status && !STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid status filter' });
  }

  const { leads, total } = repo.findAll({
    search: search ? search.trim() : '',
    status,
    sortBy,
    order,
    page,
    limit,
  });

  res.json({
    data: leads,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// GET /api/leads/stats  (must come before /:id)
router.get('/stats', (req, res) => {
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  repo.countByStatus().forEach(({ status, count }) => {
    counts[status] = count;
  });
  res.json({ total: Object.values(counts).reduce((a, b) => a + b, 0), byStatus: counts });
});

// GET /api/leads/:id
router.get('/:id', (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const lead = repo.findById(id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  res.json(lead);
});

// POST /api/leads
router.post('/', (req, res) => {
  const { isValid, errors, data } = validateLead(req.body);
  if (!isValid) return res.status(400).json({ error: 'Validation failed', details: errors });
  res.status(201).json(repo.create(data));
});

// PUT /api/leads/:id
router.put('/:id', (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const { isValid, errors, data } = validateLead(req.body);
  if (!isValid) return res.status(400).json({ error: 'Validation failed', details: errors });
  const lead = repo.update(id, data);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  res.json(lead);
});

// DELETE /api/leads/:id
router.delete('/:id', (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  if (!repo.remove(id)) return res.status(404).json({ error: 'Lead not found' });
  res.status(204).send();
});

module.exports = router;