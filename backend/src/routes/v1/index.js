const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.route');

router.use('/auth', authRoutes);

// Sau này thêm các route khác
// router.use('/users', userRoutes);
// router.use('/quizzes', quizRoutes);

module.exports = router;