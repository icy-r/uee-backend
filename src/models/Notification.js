const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    index: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    index: true
  },
  type: {
    type: String,
    required: [true, 'Notification type is required'],
    enum: [
      'task_assigned',
      'task_updated',
      'task_completed',
      'deadline_approaching',
      'deadline_passed',
      'budget_alert',
      'budget_exceeded',
      'low_stock',
      'material_ordered',
      'weather_alert',
      'milestone_reached',
      'document_uploaded',
      'comment_added',
      'sustainability_update',
      'system_announcement'
    ],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date,
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  actionUrl: {
    type: String,
    default: null
  },
  actionLabel: {
    type: String,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ projectId: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for checking if notification is expired
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to mark all notifications as read for a user
notificationSchema.statics.markAllAsRead = async function(userId, projectId = null) {
  const query = { userId, read: false };
  
  if (projectId) {
    query.projectId = projectId;
  }

  return await this.updateMany(
    query,
    { 
      read: true,
      readAt: new Date()
    }
  );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId, projectId = null) {
  const query = { userId, read: false };
  
  if (projectId) {
    query.projectId = projectId;
  }

  return await this.countDocuments(query);
};

// Static method to delete old read notifications
notificationSchema.statics.deleteOldNotifications = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return await this.deleteMany({
    read: true,
    readAt: { $lt: cutoffDate }
  });
};

// Static method to get recent notifications
notificationSchema.statics.getRecent = async function(userId, limit = 20, projectId = null) {
  const query = { userId };
  
  if (projectId) {
    query.projectId = projectId;
  }

  return await this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('projectId', 'name')
    .lean();
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;

