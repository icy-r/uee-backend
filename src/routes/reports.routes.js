const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const { optionalAuth } = require('../middleware/auth');

// Apply authentication to all routes
router.use(optionalAuth);

/**
 * @route POST /api/projects/:id/reports/status
 * @desc Generate project status report
 * @access Private
 */
router.post('/:id/reports/status', reportsController.generateStatusReport);

/**
 * @route POST /api/projects/:id/reports/expenses
 * @desc Generate expense report
 * @access Private
 */
router.post('/:id/reports/expenses', reportsController.generateExpenseReport);

/**
 * @route POST /api/projects/:id/reports/sustainability
 * @desc Generate sustainability report
 * @access Private
 */
router.post('/:id/reports/sustainability', reportsController.generateSustainabilityReport);

/**
 * @route POST /api/projects/:id/reports/materials
 * @desc Generate material usage report
 * @access Private
 */
router.post('/:id/reports/materials', reportsController.generateMaterialReport);

/**
 * @route POST /api/projects/:id/reports/comprehensive
 * @desc Generate comprehensive project report
 * @access Private
 */
router.post('/:id/reports/comprehensive', reportsController.generateComprehensiveReport);

module.exports = router;

