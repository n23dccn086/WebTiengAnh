const express = require('express');
const router = express.Router();

// Import tất cả các route
const authRoutes = require('./auth.route');
const userRoutes = require('./user.route');
const flashcardRoutes = require('./flashcard.route');
const flashcardSetRoutes = require('./flashcardSet.route');
const serviceRoutes = require('./service.route');
const studyRoutes = require("./study.route");
const srsRoutes = require("./srs.route");
const dictionaryRoutes = require("./dictionary.route"); // Import dictionary
const paymentRoutes = require('./payment.route');
const adminRoute = require('./admin.route');
const statisticsRoutes = require('./statistics.route');
const contactRoutes = require('./contact.route');
const tipRoutes = require('./tip.route');

// Gắn route vào hệ thống
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/flashcards', flashcardRoutes);
router.use('/flashcard-sets', flashcardSetRoutes);
router.use('/services', serviceRoutes);
router.use("/study", studyRoutes);
router.use("/srs", srsRoutes);
router.use("/dictionary", dictionaryRoutes); // ← BỎ COMMENT DÒNG NÀY
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoute.adminRouter);
router.use('/super-admin', adminRoute.superAdminRouter);
router.use('/statistics', statisticsRoutes);
router.use('/contact', contactRoutes);
router.use('/tip', tipRoutes);

module.exports = router;