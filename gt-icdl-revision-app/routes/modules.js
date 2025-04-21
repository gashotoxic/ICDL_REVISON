const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all modules
router.get('/', (req, res) => {
  const query = `SELECT * FROM modules`;
  db.all(query, (err, modules) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(modules);
  });
});

// Get module by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const query = `SELECT * FROM modules WHERE id = ?`;
  db.get(query, [id], (err, module) => {
    if (err || !module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    res.json(module);
  });
});

// Get module progress for authenticated user
router.get('/:id/progress', (req, res) => {
  // TODO: Implement user authentication
  const { id } = req.params;
  const userId = 1; // Temporary - replace with actual user ID from auth
  const query = `SELECT * FROM user_progress WHERE user_id = ? AND module_id = ?`;
  db.get(query, [userId, id], (err, progress) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(progress || { score: 0, last_attempt: null });
  });
});

module.exports = router;