const express = require('express');
const router = express.Router();
const sustainabilityController = require('../controllers/sustainability.controller');
const { optionalAuth } = require('../middleware/auth');

// Apply authentication to all routes
router.use(optionalAuth);

/**
 * @route GET /api/sustainability/score
 * @desc Get project sustainability score
 * @access Private
 */
router.get('/score', sustainabilityController.getProjectSustainabilityScore);

/**
 * @route GET /api/sustainability/carbon-footprint
 * @desc Get carbon footprint for a project
 * @access Private
 */
router.get('/carbon-footprint', sustainabilityController.getCarbonFootprint);

/**
 * @route GET /api/sustainability/recommendations
 * @desc Get AI-powered sustainability recommendations
 * @access Private
 */
router.get('/recommendations', sustainabilityController.getRecommendations);

/**
 * @route GET /api/sustainability/trends
 * @desc Get sustainability trends over time
 * @access Private
 */
router.get('/trends', sustainabilityController.getSustainabilityTrends);

/**
 * @route GET /api/sustainability/benchmark
 * @desc Compare project to industry benchmark
 * @access Private
 */
router.get('/benchmark', sustainabilityController.compareToBenchmark);

/**
 * @route GET /api/sustainability/dashboard
 * @desc Get complete sustainability dashboard data
 * @access Private
 */
router.get('/dashboard', sustainabilityController.getSustainabilityDashboard);

/**
 * @route GET /api/sustainability/history
 * @desc Get sustainability metrics history
 * @access Private
 */
router.get('/history', sustainabilityController.getMetricsHistory);

/**
 * @route GET /api/sustainability/latest
 * @desc Get latest sustainability metrics
 * @access Private
 */
router.get('/latest', sustainabilityController.getLatestMetrics);

/**
 * @route POST /api/sustainability/calculate
 * @desc Calculate and save sustainability metrics
 * @access Private
 */
router.post('/calculate', sustainabilityController.calculateAndSaveMetrics);

/**
 * @route POST /api/sustainability/recommendations/add
 * @desc Add custom recommendation
 * @access Private
 */
router.post('/recommendations/add', sustainabilityController.addCustomRecommendation);

module.exports = router;

