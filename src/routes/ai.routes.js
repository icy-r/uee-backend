const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { optionalAuth } = require('../middleware/auth');

// Apply authentication to all routes
router.use(optionalAuth);

/**
 * @route POST /api/ai/estimate-materials
 * @desc Estimate material quantities for a project
 * @access Private
 */
router.post('/estimate-materials', aiController.estimateMaterials);

/**
 * @route POST /api/ai/predict-costs
 * @desc Predict future material costs
 * @access Private
 */
router.post('/predict-costs', aiController.predictCosts);

/**
 * @route POST /api/ai/predict-completion
 * @desc Predict project completion date
 * @access Private
 */
router.post('/predict-completion', aiController.predictCompletion);

/**
 * @route POST /api/ai/extract-tasks
 * @desc Extract tasks from document using OCR and AI
 * @access Private
 */
router.post('/extract-tasks', aiController.extractTasksFromDocument);

/**
 * @route POST /api/ai/optimize-budget
 * @desc Get AI-powered budget optimization suggestions
 * @access Private
 */
router.post('/optimize-budget', aiController.optimizeBudget);

/**
 * @route POST /api/ai/ocr
 * @desc Perform OCR on a document
 * @access Private
 */
router.post('/ocr', aiController.performOCR);

/**
 * @route GET /api/ai/predictions
 * @desc Get AI prediction history for a project
 * @access Private
 */
router.get('/predictions', aiController.getPredictionHistory);

/**
 * @route GET /api/ai/stats
 * @desc Get AI prediction statistics
 * @access Private
 */
router.get('/stats', aiController.getPredictionStats);

/**
 * @route POST /api/ai/feedback
 * @desc Submit feedback on an AI prediction
 * @access Private
 */
router.post('/feedback', aiController.submitPredictionFeedback);

module.exports = router;

