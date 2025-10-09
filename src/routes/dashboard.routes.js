const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { optionalAuth } = require('../middleware/auth');

// Apply optional authentication to all dashboard routes
router.use(optionalAuth);

/**
 * @route   GET /api/dashboard/overview
 * @desc    Get project overview with status and progress
 * @query   projectId
 * @access  Public (MVP)
 */
router.get('/overview', dashboardController.getOverview);

/**
 * @route   GET /api/dashboard/analytics
 * @desc    Get progress analytics and trends
 * @query   projectId
 * @access  Public (MVP)
 */
router.get('/analytics', dashboardController.getAnalytics);

/**
 * @route   GET /api/dashboard/weather
 * @desc    Get weather data for project location
 * @query   location, projectId
 * @access  Public (MVP)
 */
router.get('/weather', dashboardController.getWeather);

/**
 * @route   GET /api/dashboard/sustainability-score
 * @desc    Get sustainability score and AI recommendations
 * @query   projectId
 * @access  Public (MVP)
 */
router.get('/sustainability-score', dashboardController.getSustainabilityScore);

module.exports = router;

