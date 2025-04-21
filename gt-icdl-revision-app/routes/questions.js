const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { getHint } = require('../config/openrouter');

// Get random questions for a module
router.get('/:moduleId', (req, res) => {
  const { moduleId } = req.params;
  const limit = 100; // Number of questions to return
  const query = `
    SELECT * FROM questions 
    WHERE module_id = ?
    ORDER BY RANDOM()
    LIMIT ?
  `;
  db.all(query, [moduleId, limit], (err, questions) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(questions);
  });
});

// Submit answers and get score
router.post('/:moduleId/submit', (req, res) => {
  const { moduleId } = req.params;
  const { answers } = req.body;
  const userId = 1; // Temporary - replace with actual user ID from auth

  // Validate answers
  if (!Array.isArray(answers)) {
    return res.status(400).json({ error: 'Invalid answers format' });
  }

  // Calculate score
  const query = `
    SELECT id, answer FROM questions 
    WHERE module_id = ? AND id IN (${answers.map(a => a.questionId).join(',')})
  `;
  db.all(query, [moduleId], (err, correctAnswers) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const score = answers.reduce((total, answer) => {
      const correct = correctAnswers.find(ca => ca.id === answer.questionId);
      return total + (correct && correct.answer === answer.answer ? 1 : 0);
    }, 0);

    // Save progress
    const progressQuery = `
      INSERT OR REPLACE INTO user_progress 
      (user_id, module_id, score, last_attempt)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `;
    db.run(progressQuery, [userId, moduleId, score], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to save progress' });
      }
      res.json({ score, total: answers.length });
    });
  });
});

// Get hint for a question
router.post('/:id/hint', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `SELECT question FROM questions WHERE id = ?`;
    db.get(query, [id], async (err, row) => {
      if (err || !row) {
        return res.status(404).json({ error: 'Question not found' });
      }
      
      const hint = await getHint(row.question);
      if (!hint) {
        return res.status(500).json({ error: 'Failed to generate hint' });
      }
      
      res.json({ hint });
    });
  } catch (error) {
    console.error('Error getting hint:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;