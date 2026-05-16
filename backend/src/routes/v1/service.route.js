const express = require('express');
const router = express.Router();
const db = require('../../config/database');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, title, description FROM services WHERE status = "VISIBLE" ORDER BY id'
    );
    res.json({ status: 'success', data: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;