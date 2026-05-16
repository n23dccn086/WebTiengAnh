const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.route');
const userRoutes = require('./user.route');
const flashcardRoutes = require('./flashcard.route');
const serviceRoutes = require('./service.route');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/flashcards', flashcardRoutes);
router.use('/services', serviceRoutes);

module.exports = router;