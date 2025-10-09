const mongoose = require('mongoose');

const timeLogSchema = new mongoose.Schema({
  hours: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    required: true
  },
  loggedBy: String
});

const photoSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  caption: String,
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  uploadedBy: String
});

const taskSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    minlength: 3,
    maxlength: 200
  },
  description: {
    type: String,
    required: [true, 'Task description is required']
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required']
  },
  assignedTo: [{
    type: String,
    required: true
  }],
  assignedBy: {
    type: String,
    required: true
  },
  timeLogs: [timeLogSchema],
  photos: [photoSchema],
  completedAt: Date,
  notes: String,
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }]
}, {
  timestamps: true
});

// Calculate total hours spent
taskSchema.virtual('totalHours').get(function() {
  return this.timeLogs.reduce((sum, log) => sum + log.hours, 0);
});

// Check if task is overdue
taskSchema.virtual('isOverdue').get(function() {
  return this.status !== 'completed' && new Date() > this.deadline;
});

// Enable virtuals in JSON
taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

// Update completed timestamp when status changes to completed
taskSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);

