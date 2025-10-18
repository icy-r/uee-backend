const Task = require('../models/Task');
const Project = require('../models/Project');
const catchAsync = require('../utils/catchAsync');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHandler');
const QueryBuilder = require('../utils/queryBuilder');
const queryConfig = require('../config/queryConfig');
const path = require('path');
const fs = require('fs');

/**
 * Create new task
 */
exports.createTask = catchAsync(async (req, res) => {
  const { projectId, assignedBy, ...taskData } = req.body;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return errorResponse(res, 'Project not found', 404);
  }

  const task = await Task.create({
    projectId,
    assignedBy: assignedBy || req.user?.uid || 'system',
    ...taskData
  });

  // Update project progress
  await project.calculateProgress();

  successResponse(res, task, 'Task created successfully', 201);
});

/**
 * Get all tasks with flexible filtering
 */
exports.getTasks = catchAsync(async (req, res) => {
  const { projectId, overdue } = req.query;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  // Use QueryBuilder for flexible filtering
  const queryBuilder = new QueryBuilder(Task, req.query, queryConfig.tasks)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  // Execute query
  let tasks = await queryBuilder.build();
  const total = await queryBuilder.countDocuments();

  // Filter overdue tasks if requested (client-side filter for virtual field)
  if (overdue === 'true') {
    tasks = tasks.filter(t => t.isOverdue);
  }

  const paginationMeta = queryBuilder.getPaginationMeta(total);

  paginatedResponse(
    res,
    tasks,
    paginationMeta,
    'Tasks retrieved successfully'
  );
});

/**
 * Get single task by ID
 */
exports.getTaskById = catchAsync(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('dependencies', 'title status');

  if (!task) {
    return errorResponse(res, 'Task not found', 404);
  }

  successResponse(res, task, 'Task retrieved successfully');
});

/**
 * Update task details
 */
exports.updateTask = catchAsync(async (req, res) => {
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!task) {
    return errorResponse(res, 'Task not found', 404);
  }

  // Update project progress if status changed
  if (req.body.status) {
    const project = await Project.findById(task.projectId);
    if (project) {
      await project.calculateProgress();
    }
  }

  successResponse(res, task, 'Task updated successfully');
});

/**
 * Delete task
 */
exports.deleteTask = catchAsync(async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.id);

  if (!task) {
    return errorResponse(res, 'Task not found', 404);
  }

  // Update project progress
  const project = await Project.findById(task.projectId);
  if (project) {
    await project.calculateProgress();
  }

  successResponse(res, null, 'Task deleted successfully');
});

/**
 * Update task progress/status
 */
exports.updateProgress = catchAsync(async (req, res) => {
  const { status, notes } = req.body;
  
  const task = await Task.findById(req.params.id);
  if (!task) {
    return errorResponse(res, 'Task not found', 404);
  }

  task.status = status;
  if (notes) {
    task.notes = task.notes ? `${task.notes}\n${notes}` : notes;
  }

  await task.save();

  // Update project progress
  const project = await Project.findById(task.projectId);
  if (project) {
    await project.calculateProgress();
  }

  successResponse(res, task, 'Task progress updated successfully');
});

/**
 * Upload task photos
 */
exports.uploadPhotos = catchAsync(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    return errorResponse(res, 'Task not found', 404);
  }

  if (!req.files || req.files.length === 0) {
    return errorResponse(res, 'No photos uploaded', 400);
  }

  const photos = req.files.map(file => ({
    url: `/uploads/${task.projectId}/${file.filename}`,
    filename: file.filename,
    caption: req.body.caption || '',
    uploadedBy: req.user?.uid || 'anonymous',
    uploadedAt: new Date()
  }));

  task.photos.push(...photos);
  await task.save();

  successResponse(res, { photos, task }, 'Photos uploaded successfully');
});

/**
 * Log time spent on task
 */
exports.logTime = catchAsync(async (req, res) => {
  const { hours, description, date } = req.body;
  
  const task = await Task.findById(req.params.id);
  if (!task) {
    return errorResponse(res, 'Task not found', 404);
  }

  task.timeLogs.push({
    hours,
    description,
    date: date || new Date(),
    loggedBy: req.user?.uid || 'anonymous'
  });

  await task.save();

  successResponse(res, task, 'Time logged successfully');
});

/**
 * Get workers assigned to a task
 */
exports.getWorkers = catchAsync(async (req, res) => {
  const task = await Task.findById(req.params.id);
  
  if (!task) {
    return errorResponse(res, 'Task not found', 404);
  }

  // In a full implementation, this would fetch user details from Firebase
  // For MVP, we return the worker IDs/emails
  const workers = task.assignedTo.map(workerId => ({
    id: workerId,
    assignedAt: task.createdAt
  }));

  successResponse(res, workers, 'Workers retrieved successfully');
});

/**
 * Get documents/images related to a task
 */
exports.getTaskDocuments = catchAsync(async (req, res) => {
  const taskId = req.params.id;

  // Get the task first (to get projectId and embedded photos)
  const task = await Task.findById(taskId);
  if (!task) {
    return errorResponse(res, 'Task not found', 404);
  }

  // Find documents that generated this task
  const Document = require('../models/Document');
  const documentsGeneratedFromTask = await Document.find({
    'generatedTasks.taskId': taskId
  });

  // Optionally: Get all documents from the same project
  const projectDocuments = await Document.find({
    projectId: task.projectId
  }).limit(20); // Limit to avoid too many results

  const response = {
    // Photos embedded in the task
    taskPhotos: task.photos,
    
    // Documents that generated this task
    relatedDocuments: documentsGeneratedFromTask,
    
    // All documents from the project (optional)
    projectDocuments: projectDocuments,
    
    // Summary counts
    summary: {
      taskPhotos: task.photos.length,
      relatedDocuments: documentsGeneratedFromTask.length,
      projectDocuments: projectDocuments.length
    }
  };

  successResponse(res, response, 'Task documents retrieved successfully');
});

/**
 * Get task statistics for a project
 */
exports.getTaskStatistics = catchAsync(async (req, res) => {
  const { projectId } = req.query;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  const tasks = await Task.find({ projectId });

  const statistics = {
    total: tasks.length,
    byStatus: {
      notStarted: tasks.filter(t => t.status === 'not_started').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length
    },
    byPriority: {
      low: tasks.filter(t => t.priority === 'low').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      high: tasks.filter(t => t.priority === 'high').length
    },
    overdue: tasks.filter(t => t.isOverdue).length,
    completedThisWeek: this.getCompletedThisWeek(tasks),
    avgCompletionTime: this.calculateAvgCompletionTime(tasks),
    totalHoursLogged: tasks.reduce((sum, t) => sum + t.totalHours, 0),
    upcomingDeadlines: this.getUpcomingDeadlines(tasks, 7)
  };

  successResponse(res, statistics, 'Task statistics retrieved successfully');
});

/**
 * Get task timeline/gantt data (enhanced with dependencies and critical path)
 */
exports.getTimeline = catchAsync(async (req, res) => {
  const { projectId } = req.query;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  const tasks = await Task.find({ projectId })
    .populate('dependencies', 'title status completedAt')
    .sort({ deadline: 1 });

  const timeline = tasks.map(task => ({
    id: task._id,
    title: task.title,
    status: task.status,
    start: task.createdAt,
    end: task.completedAt || task.deadline,
    deadline: task.deadline,
    isCompleted: task.status === 'completed',
    isOverdue: task.isOverdue,
    assignedTo: task.assignedTo,
    dependencies: task.dependencies.map(dep => ({
      id: dep._id,
      title: dep.title,
      status: dep.status,
      isCompleted: dep.status === 'completed'
    })),
    estimatedHours: task.estimatedHours,
    progress: task.status === 'completed' ? 100 : task.status === 'in_progress' ? 50 : 0
  }));

  // Calculate critical path (tasks with no slack time)
  const criticalPath = this.calculateCriticalPath(tasks);

  successResponse(res, {
    timeline,
    criticalPath,
    projectStats: {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
      overdueTasks: tasks.filter(t => t.isOverdue).length
    }
  }, 'Task timeline retrieved successfully');
});

/**
 * Calculate critical path (simplified version)
 */
exports.calculateCriticalPath = (tasks) => {
  // Find tasks that have dependencies
  const tasksWithDeps = tasks.filter(t => t.dependencies && t.dependencies.length > 0);
  
  // Find the longest chain of dependent tasks
  const criticalTasks = [];
  
  tasksWithDeps.forEach(task => {
    if (task.dependencies.length > 0) {
      const allDepsCompleted = task.dependencies.every(dep => dep.status === 'completed');
      if (!allDepsCompleted && task.status !== 'completed') {
        criticalTasks.push({
          id: task._id,
          title: task.title,
          deadline: task.deadline,
          blockedBy: task.dependencies.filter(dep => dep.status !== 'completed').map(d => d.title)
        });
      }
    }
  });
  
  return criticalTasks;
};

// Helper methods
exports.getCompletedThisWeek = (tasks) => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  return tasks.filter(t => 
    t.completedAt && t.completedAt >= oneWeekAgo
  ).length;
};

exports.calculateAvgCompletionTime = (tasks) => {
  const completedTasks = tasks.filter(t => t.completedAt && t.createdAt);
  
  if (completedTasks.length === 0) return 0;

  const totalDays = completedTasks.reduce((sum, t) => {
    const days = (t.completedAt - t.createdAt) / (1000 * 60 * 60 * 24);
    return sum + days;
  }, 0);

  return Math.round(totalDays / completedTasks.length);
};

exports.getUpcomingDeadlines = (tasks, days) => {
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + days);

  return tasks
    .filter(t => 
      t.status !== 'completed' &&
      t.deadline >= now &&
      t.deadline <= future
    )
    .map(t => ({
      id: t._id,
      title: t.title,
      deadline: t.deadline,
      daysUntilDeadline: Math.ceil((t.deadline - now) / (1000 * 60 * 60 * 24)),
      priority: t.priority
    }))
    .sort((a, b) => a.deadline - b.deadline);
};

