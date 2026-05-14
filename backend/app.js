const express = require('express');
const cors = require('cors');
const v1Routes = require('./src/routes/v1');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1', v1Routes);

// Error handling middleware (tạm thời)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ status: 'error', message: 'Internal server error' });
});

module.exports = app;