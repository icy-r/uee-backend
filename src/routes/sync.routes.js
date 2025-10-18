const express = require('express');
const router = express.Router();
const syncController = require('../controllers/sync.controller');
const { optionalAuth } = require('../middleware/auth');

// Apply authentication to all routes
router.use(optionalAuth);

/**
 * @route POST /api/sync/batch
 * @desc Process batch sync operations from offline device
 * @access Private
 */
router.post('/batch', syncController.processBatchSync);

/**
 * @route GET /api/sync/status
 * @desc Get sync status for a project
 * @access Private
 */
router.get('/status', syncController.getSyncStatus);

/**
 * @route POST /api/sync/resolve-conflict
 * @desc Manually resolve a sync conflict
 * @access Private
 */
router.post('/resolve-conflict', syncController.resolveConflict);

module.exports = router;

