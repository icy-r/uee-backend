const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budget.controller');
const { optionalAuth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// Apply optional authentication to all budget routes
router.use(optionalAuth);

/**
 * @route   POST /api/budget
 * @desc    Create or set project budget
 * @access  Public (MVP)
 */
router.post('/', validate(schemas.createBudget), budgetController.createBudget);

/**
 * @route   GET /api/budget
 * @desc    Get budget overview
 * @query   projectId
 * @access  Public (MVP)
 */
router.get('/', budgetController.getBudgetOverview);

/**
 * @route   POST /api/budget/expenses
 * @desc    Log new expense
 * @access  Public (MVP)
 */
router.post('/expenses', validate(schemas.logExpense), budgetController.logExpense);

/**
 * @route   GET /api/budget/expenses
 * @desc    Get all expenses
 * @query   projectId, category, startDate, endDate
 * @access  Public (MVP)
 */
router.get('/expenses', budgetController.getExpenses);

/**
 * @route   PUT /api/budget/:projectId/expenses/:expenseId
 * @desc    Update expense
 * @access  Public (MVP)
 */
router.put('/:projectId/expenses/:expenseId', budgetController.updateExpense);

/**
 * @route   DELETE /api/budget/:projectId/expenses/:expenseId
 * @desc    Delete expense
 * @access  Public (MVP)
 */
router.delete('/:projectId/expenses/:expenseId', budgetController.deleteExpense);

/**
 * @route   GET /api/budget/report
 * @desc    Generate expense report
 * @query   projectId, startDate, endDate
 * @access  Public (MVP)
 */
router.get('/report', budgetController.generateReport);

/**
 * @route   GET /api/budget/cost-prediction
 * @desc    Get AI-based cost predictions
 * @query   projectId, timeframe
 * @access  Public (MVP)
 */
router.get('/cost-prediction', budgetController.getCostPrediction);

/**
 * @route   POST /api/budget/optimize
 * @desc    Get AI-based budget optimization suggestions
 * @access  Public (MVP)
 */
router.post('/optimize', budgetController.optimizeBudget);

/**
 * @route   GET /api/budget/analytics
 * @desc    Get budget analytics
 * @query   projectId
 * @access  Public (MVP)
 */
router.get('/analytics', budgetController.getBudgetAnalytics);

module.exports = router;

