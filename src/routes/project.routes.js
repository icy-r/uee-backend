const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { optionalAuth } = require('../middleware/auth');
const { queryParsers } = require('../middleware/queryParser');

// Apply optional authentication to all project routes
router.use(optionalAuth);

/**
 * @route   POST /api/projects
 * @desc    Create new project
 * @access  Public (MVP)
 */
router.post('/', projectController.createProject);

/**
 * @route   GET /api/projects
 * @desc    Get all projects with flexible filtering
 * @query   any field with operators [eq, ne, gt, gte, lt, lte, contains, in, nin], sort, select, page, limit
 * @access  Public (MVP)
 */
router.get('/', queryParsers.projects, projectController.getProjects);

/**
 * @route   GET /api/projects/:id
 * @desc    Get single project by ID
 * @access  Public (MVP)
 */
router.get('/:id', projectController.getProjectById);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project
 * @access  Public (MVP)
 */
router.put('/:id', projectController.updateProject);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete project
 * @access  Public (MVP)
 */
router.delete('/:id', projectController.deleteProject);

/**
 * @route   PUT /api/projects/:id/progress
 * @desc    Calculate and update project progress
 * @access  Public (MVP)
 */
router.put('/:id/progress', projectController.updateProgress);

/**
 * @route   PUT /api/projects/:id/sustainability
 * @desc    Calculate and update sustainability score
 * @access  Public (MVP)
 */
router.put('/:id/sustainability', projectController.updateSustainabilityScore);

module.exports = router;

