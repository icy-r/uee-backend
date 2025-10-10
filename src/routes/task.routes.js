const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const { optionalAuth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { queryParsers } = require('../middleware/queryParser');
const upload = require('../utils/fileUpload');

// Apply optional authentication to all task routes
router.use(optionalAuth);

/**
 * @route   POST /api/tasks
 * @desc    Create new task
 * @access  Public (MVP)
 */
router.post('/', validate(schemas.createTask), taskController.createTask);

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks with flexible filtering
 * @query   projectId, any field with operators [eq, ne, gt, gte, lt, lte, contains, in, nin], sort, select, page, limit
 * @access  Public (MVP)
 */
router.get('/', queryParsers.tasks, taskController.getTasks);

/**
 * @route   GET /api/tasks/statistics
 * @desc    Get task statistics for a project
 * @query   projectId
 * @access  Public (MVP)
 */
router.get('/statistics', taskController.getTaskStatistics);

/**
 * @route   GET /api/tasks/timeline
 * @desc    Get task timeline/gantt data
 * @query   projectId
 * @access  Public (MVP)
 */
router.get('/timeline', taskController.getTimeline);

/**
 * @route   GET /api/tasks/:id
 * @desc    Get single task by ID
 * @access  Public (MVP)
 */
router.get('/:id', taskController.getTaskById);

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update task details
 * @access  Public (MVP)
 */
router.put('/:id', validate(schemas.updateTask), taskController.updateTask);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete task
 * @access  Public (MVP)
 */
router.delete('/:id', taskController.deleteTask);

/**
 * @route   PUT /api/tasks/:id/progress
 * @desc    Update task progress/status
 * @access  Public (MVP)
 */
router.put('/:id/progress', validate(schemas.updateTaskProgress), taskController.updateProgress);

/**
 * @route   POST /api/tasks/:id/photos
 * @desc    Upload task photos
 * @access  Public (MVP)
 */
router.post('/:id/photos', upload.array('photos', 10), taskController.uploadPhotos);

/**
 * @route   POST /api/tasks/:id/time-log
 * @desc    Log time spent on task
 * @access  Public (MVP)
 */
router.post('/:id/time-log', validate(schemas.logTime), taskController.logTime);

/**
 * @route   GET /api/tasks/:id/workers
 * @desc    Get workers assigned to a task
 * @access  Public (MVP)
 */
router.get('/:id/workers', taskController.getWorkers);

module.exports = router;

