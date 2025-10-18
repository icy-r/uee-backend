const Notification = require('../models/Notification');

/**
 * Create a new notification
 * @param {String} userId - User ID to send notification to
 * @param {String} type - Notification type
 * @param {Object} data - Notification data
 * @returns {Object} Created notification
 */
exports.createNotification = async (userId, type, data) => {
  try {
    const {
      title,
      message,
      projectId,
      priority = 'medium',
      actionUrl,
      actionLabel,
      expiresAt,
      additionalData = {}
    } = data;

    if (!title || !message) {
      throw new Error('Title and message are required');
    }

    const notification = await Notification.create({
      userId,
      projectId: projectId || null,
      type,
      title,
      message,
      priority,
      actionUrl,
      actionLabel,
      data: additionalData,
      expiresAt: expiresAt || null
    });

    console.log(`✅ Notification created for user ${userId}: ${title}`);

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create bulk notifications (for multiple users)
 * @param {Array} userIds - Array of user IDs
 * @param {String} type - Notification type
 * @param {Object} data - Notification data
 * @returns {Array} Created notifications
 */
exports.createBulkNotifications = async (userIds, type, data) => {
  try {
    const notifications = await Promise.all(
      userIds.map(userId => this.createNotification(userId, type, data))
    );

    console.log(`✅ ${notifications.length} bulk notifications created`);

    return notifications;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
};

/**
 * Get notifications for a user
 * @param {String} userId - User ID
 * @param {Object} filters - Filter options
 * @returns {Array} Notifications
 */
exports.getNotifications = async (userId, filters = {}) => {
  try {
    const {
      projectId,
      type,
      read,
      priority,
      limit = 50,
      skip = 0
    } = filters;

    const query = { userId };

    if (projectId) query.projectId = projectId;
    if (type) query.type = type;
    if (read !== undefined) query.read = read;
    if (priority) query.priority = priority;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate('projectId', 'name')
      .lean();

    return notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 * @param {String} notificationId - Notification ID
 * @returns {Object} Updated notification
 */
exports.markAsRead = async (notificationId) => {
  try {
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      throw new Error('Notification not found');
    }

    return await notification.markAsRead();
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 * @param {String} userId - User ID
 * @param {String} projectId - Optional project ID
 * @returns {Object} Update result
 */
exports.markAllAsRead = async (userId, projectId = null) => {
  try {
    return await Notification.markAllAsRead(userId, projectId);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete a notification
 * @param {String} notificationId - Notification ID
 * @returns {Object} Deleted notification
 */
exports.deleteNotification = async (notificationId) => {
  try {
    const notification = await Notification.findByIdAndDelete(notificationId);
    
    if (!notification) {
      throw new Error('Notification not found');
    }

    return notification;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Get unread notification count
 * @param {String} userId - User ID
 * @param {String} projectId - Optional project ID
 * @returns {Number} Unread count
 */
exports.getUnreadCount = async (userId, projectId = null) => {
  try {
    return await Notification.getUnreadCount(userId, projectId);
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }
};

/**
 * Send task assignment notification
 * @param {String} userId - User ID
 * @param {Object} task - Task object
 * @param {String} projectName - Project name
 */
exports.notifyTaskAssigned = async (userId, task, projectName) => {
  return await this.createNotification(userId, 'task_assigned', {
    title: 'New Task Assigned',
    message: `You have been assigned: ${task.title}`,
    projectId: task.projectId,
    priority: task.priority === 'high' ? 'high' : 'medium',
    actionUrl: `/tasks/${task._id}`,
    actionLabel: 'View Task',
    additionalData: {
      taskId: task._id,
      taskTitle: task.title,
      projectName
    }
  });
};

/**
 * Send deadline approaching notification
 * @param {String} userId - User ID
 * @param {Object} task - Task object
 */
exports.notifyDeadlineApproaching = async (userId, task) => {
  const daysUntilDeadline = Math.ceil(
    (new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24)
  );

  return await this.createNotification(userId, 'deadline_approaching', {
    title: 'Task Deadline Approaching',
    message: `"${task.title}" is due in ${daysUntilDeadline} day${daysUntilDeadline !== 1 ? 's' : ''}`,
    projectId: task.projectId,
    priority: daysUntilDeadline <= 2 ? 'high' : 'medium',
    actionUrl: `/tasks/${task._id}`,
    actionLabel: 'View Task',
    additionalData: {
      taskId: task._id,
      taskTitle: task.title,
      deadline: task.deadline,
      daysRemaining: daysUntilDeadline
    }
  });
};

/**
 * Send budget alert notification
 * @param {String} userId - User ID
 * @param {Object} project - Project object
 * @param {Number} utilizationPercentage - Budget utilization percentage
 */
exports.notifyBudgetAlert = async (userId, project, utilizationPercentage) => {
  const priority = utilizationPercentage >= 95 ? 'urgent' : utilizationPercentage >= 85 ? 'high' : 'medium';
  const message = utilizationPercentage >= 100
    ? `Budget exceeded for "${project.name}"`
    : `Budget ${utilizationPercentage.toFixed(1)}% utilized for "${project.name}"`;

  return await this.createNotification(userId, 'budget_alert', {
    title: 'Budget Alert',
    message,
    projectId: project._id,
    priority,
    actionUrl: `/projects/${project._id}/budget`,
    actionLabel: 'View Budget',
    additionalData: {
      projectId: project._id,
      projectName: project.name,
      utilizationPercentage
    }
  });
};

/**
 * Send low stock notification
 * @param {String} userId - User ID
 * @param {Object} material - Material object
 */
exports.notifyLowStock = async (userId, material, projectName) => {
  return await this.createNotification(userId, 'low_stock', {
    title: 'Low Stock Alert',
    message: `Low stock: ${material.name} (${material.quantity} ${material.unit} remaining)`,
    projectId: material.projectId,
    priority: 'high',
    actionUrl: `/materials/${material._id}`,
    actionLabel: 'View Material',
    additionalData: {
      materialId: material._id,
      materialName: material.name,
      quantity: material.quantity,
      unit: material.unit,
      projectName
    }
  });
};

/**
 * Send weather alert notification
 * @param {Array} userIds - Array of user IDs
 * @param {String} projectId - Project ID
 * @param {String} weatherCondition - Weather condition
 * @param {String} impact - Impact description
 */
exports.notifyWeatherAlert = async (userIds, projectId, weatherCondition, impact) => {
  return await this.createBulkNotifications(userIds, 'weather_alert', {
    title: 'Weather Alert',
    message: `${weatherCondition}: ${impact}`,
    projectId,
    priority: 'high',
    actionUrl: `/projects/${projectId}/dashboard`,
    actionLabel: 'View Dashboard',
    additionalData: {
      weatherCondition,
      impact
    }
  });
};

/**
 * Cleanup old read notifications (run periodically)
 */
exports.cleanupOldNotifications = async (daysOld = 30) => {
  try {
    const result = await Notification.deleteOldNotifications(daysOld);
    console.log(`✅ Deleted ${result.deletedCount} old notifications`);
    return result;
  } catch (error) {
    console.error('Error cleaning up old notifications:', error);
    throw error;
  }
};

