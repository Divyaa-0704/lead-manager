require('dotenv').config();
const express = require('express');
const cors = require('cors');
require('./db');
const leadRoutes = require('./src/leadRoutes');
const authRoutes = require('./src/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Lead Manager API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);

// Unknown address
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Safety net for unexpected errors (including bad JSON)
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});