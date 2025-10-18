const notificationService = require('../services/notification.service');
const catchAsync = require('../utils/catchAsync');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Get notifications for a user
 * @route GET /api/notifications
 */
exports.getNotifications = catchAsync(async (req, res) => {
  const userId = req.user.uid;
  const filters = {
    projectId: req.query.projectId,
    type: req.query.type,
    read: req.query.read !== undefined ? req.query.read === 'true' : undefined,
    priority: req.query.priority,
    limit: req.query.limit || 50,
    skip: req.query.skip || 0
  };

  const notifications = await notificationService.getNotifications(userId, filters);

  successResponse(res, {
    notifications,
    count: notifications.length
  }, 'Notifications retrieved successfully');
});

/**
 * Mark notification as read
 * @route PUT /api/notifications/:id/read
 */
exports.markAsRead = catchAsync(async (req, res) => {
  const { id } = req.params;

  const notification = await notificationService.markAsRead(id);

  successResponse(res, notification, 'Notification marked as read');
});

/**
 * Mark all notifications as read
 * @route PUT /api/notifications/read-all
 */
exports.markAllAsRead = catchAsync(async (req, res) => {
  const userId = req.user.uid;
  const { projectId } = req.body;

  const result = await notificationService.markAllAsRead(userId, projectId);

  successResponse(res, {
    modifiedCount: result.modifiedCount
  }, 'All notifications marked as read');
});

/**
 * Delete notification
 * @route DELETE /api/notifications/:id
 */
exports.deleteNotification = catchAsync(async (req, res) => {
  const { id } = req.params;

  await notificationService.deleteNotification(id);

  successResponse(res, null, 'Notification deleted successfully');
});

/**
 * Get unread notification count
 * @route GET /api/notifications/unread-count
 */
exports.getUnreadCount = catchAsync(async (req, res) => {
  const userId = req.user.uid;
  const { projectId } = req.query;

  const count = await notificationService.getUnreadCount(userId, projectId);

  successResponse(res, { count }, 'Unread count retrieved successfully');
});

/**
 * Create a test notification (for development)
 * @route POST /api/notifications/test
 */
exports.createTestNotification = catchAsync(async (req, res) => {
  const userId = req.user.uid;
  const { title, message, type = 'system_announcement', priority = 'medium' } = req.body;

  const notification = await notificationService.createNotification(userId, type, {
    title: title || 'Test Notification',
    message: message || 'This is a test notification',
    priority
  });

  successResponse(res, notification, 'Test notification created successfully', 201);
});

