const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { optionalAuth } = require('../middleware/auth');

// Apply authentication to all routes
router.use(optionalAuth);

/**
 * @route GET /api/notifications
 * @desc Get notifications for authenticated user
 * @access Private
 */
router.get('/', notificationController.getNotifications);

/**
 * @route GET /api/notifications/unread-count
 * @desc Get unread notification count
 * @access Private
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * @route PUT /api/notifications/read-all
 * @desc Mark all notifications as read
 * @access Private
 */
router.put('/read-all', notificationController.markAllAsRead);

/**
 * @route POST /api/notifications/test
 * @desc Create a test notification (development)
 * @access Private
 */
router.post('/test', notificationController.createTestNotification);

/**
 * @route PUT /api/notifications/:id/read
 * @desc Mark notification as read
 * @access Private
 */
router.put('/:id/read', notificationController.markAsRead);

/**
 * @route DELETE /api/notifications/:id
 * @desc Delete notification
 * @access Private
 */
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;

