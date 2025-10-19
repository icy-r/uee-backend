/**
 * Sync Routes
 * API endpoints for Firebase to MongoDB user synchronization
 */

const express = require('express');
const router = express.Router();
const syncController = require('../controllers/sync.controller');
const { requireAuth, optionalAuth } = require('../middleware/auth');

/**
 * @route   GET /api/sync/stats
 * @desc    Get synchronization statistics
 * @access  Public
 */
router.get('/stats', syncController.getSyncStats);

/**
 * @route   POST /api/sync/me
 * @desc    Sync current authenticated user to MongoDB
 * @access  Authenticated user
 */
router.post('/me', requireAuth, syncController.syncCurrentUser);

/**
 * @route   POST /api/sync/user/:firebaseUid
 * @desc    Manually sync a specific Firebase user to MongoDB
 * @access  Public (MVP: should be admin-only in production)
 */
router.post('/user/:firebaseUid', syncController.syncUser);

/**
 * @route   POST /api/sync/all
 * @desc    Sync all Firebase users to MongoDB
 * @access  Public (MVP: should be admin-only in production)
 */
router.post('/all', syncController.syncAllUsers);

/**
 * @route   POST /api/sync/webhook
 * @desc    Webhook endpoint for Firebase Cloud Functions
 * @access  Public (should validate webhook secret in production)
 */
router.post('/webhook', syncController.webhookSync);

module.exports = router;
