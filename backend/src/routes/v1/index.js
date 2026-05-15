const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.route');
const userRoutes = require('./user.route'); 
// const quizRoutes = require('./quiz.route'); // Sẽ làm sau

// Gom tất cả các route lại dưới tiền tố /v1
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
// router.use('/quizzes', quizRoutes);

module.exports = router;