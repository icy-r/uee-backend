const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { optionalAuth } = require('../middleware/auth');

// Apply authentication to all routes
router.use(optionalAuth);

/**
 * @route GET /api/projects/:id/analytics
 * @desc Get comprehensive analytics for a project
 * @access Private
 */
router.get('/:id/analytics', analyticsController.getComprehensiveAnalytics);

/**
 * @route GET /api/projects/:id/analytics/progress
 * @desc Get progress analytics for a project
 * @access Private
 */
router.get('/:id/analytics/progress', analyticsController.getProgressAnalytics);

/**
 * @route GET /api/projects/:id/analytics/materials
 * @desc Get material analytics for a project
 * @access Private
 */
router.get('/:id/analytics/materials', analyticsController.getMaterialAnalytics);

/**
 * @route GET /api/projects/:id/analytics/budget
 * @desc Get budget analytics for a project
 * @access Private
 */
router.get('/:id/analytics/budget', analyticsController.getBudgetAnalytics);

/**
 * @route GET /api/projects/:id/analytics/team
 * @desc Get team productivity analytics
 * @access Private
 */
router.get('/:id/analytics/team', analyticsController.getTeamAnalytics);

module.exports = router;

