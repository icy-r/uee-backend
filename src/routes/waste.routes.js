const express = require('express');
const router = express.Router();
const wasteController = require('../controllers/waste.controller');
const { optionalAuth } = require('../middleware/auth');

// Apply authentication to all routes
router.use(optionalAuth);

/**
 * @route POST /api/waste
 * @desc Create a new waste record
 * @access Private
 */
router.post('/', wasteController.createWaste);

/**
 * @route GET /api/waste
 * @desc Get all waste records with filters
 * @access Private
 */
router.get('/', wasteController.getWaste);

/**
 * @route GET /api/waste/analytics
 * @desc Get waste analytics for a project
 * @access Private
 */
router.get('/analytics', wasteController.getWasteAnalytics);

/**
 * @route GET /api/waste/trends
 * @desc Get waste trends over time
 * @access Private
 */
router.get('/trends', wasteController.getWasteTrends);

/**
 * @route GET /api/waste/export
 * @desc Export waste report
 * @access Private
 */
router.get('/export', wasteController.exportWasteReport);

/**
 * @route GET /api/waste/:id
 * @desc Get waste record by ID
 * @access Private
 */
router.get('/:id', wasteController.getWasteById);

/**
 * @route PUT /api/waste/:id
 * @desc Update waste record
 * @access Private
 */
router.put('/:id', wasteController.updateWaste);

/**
 * @route DELETE /api/waste/:id
 * @desc Delete waste record
 * @access Private
 */
router.delete('/:id', wasteController.deleteWaste);

module.exports = router;

