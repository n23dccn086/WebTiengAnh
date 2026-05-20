const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.route');
const userRoutes = require('./user.route');
const flashcardRoutes = require('./flashcard.route');
const flashcardSetRoutes = require('./flashcardSet.route');
const serviceRoutes = require('./service.route');
const staticQuizRoutes = require('./staticQuiz.route');
const dictionaryRoutes = require('./dictionary.route');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/flashcards', flashcardRoutes);
router.use('/flashcard-sets', flashcardSetRoutes);
router.use('/services', serviceRoutes);
router.use('/static-quizzes', staticQuizRoutes);
router.use('/dictionary', dictionaryRoutes);

module.exports = router;