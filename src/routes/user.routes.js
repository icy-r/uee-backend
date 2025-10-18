const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { optionalAuth, requireAuth } = require('../middleware/auth');

// Apply optional authentication to all user routes
router.use(optionalAuth);

/**
 * @route   GET /api/users/profile
 * @desc    Get current user's profile
 * @access  Authenticated user
 */
router.get('/profile', userController.getCurrentUserProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user's profile
 * @access  Authenticated user
 */
router.put('/profile', userController.updateCurrentUserProfile);

/**
 * @route   GET /api/users/projects
 * @desc    Get current user's assigned projects
 * @access  Authenticated user
 */
router.get('/projects', userController.getCurrentUserProjects);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Admin (MVP: Public with optional auth)
 */
router.post('/', userController.createUser);

/**
 * @route   POST /api/users/bulk-import
 * @desc    Bulk import users from CSV
 * @access  Admin (MVP: Public with optional auth)
 */
router.post('/bulk-import', userController.bulkImport);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Admin (MVP: Public with optional auth)
 */
router.get('/stats', userController.getUserStats);

/**
 * @route   GET /api/users
 * @desc    Get all users with filtering, sorting, pagination
 * @query   search, role, status, department, page, limit, sort
 * @access  Public (MVP)
 */
router.get('/', userController.getUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get single user by ID
 * @access  Public (MVP)
 */
router.get('/:id', userController.getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user information
 * @access  Admin (MVP: Public with optional auth)
 */
router.put('/:id', userController.updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Soft delete user (deactivate)
 * @access  Admin (MVP: Public with optional auth)
 */
router.delete('/:id', userController.deleteUser);

/**
 * @route   POST /api/users/:id/restore
 * @desc    Restore deleted user (reactivate)
 * @access  Admin (MVP: Public with optional auth)
 */
router.post('/:id/restore', userController.restoreUser);

/**
 * @route   PUT /api/users/:id/permissions
 * @desc    Update user permissions
 * @access  Admin (MVP: Public with optional auth)
 */
router.put('/:id/permissions', userController.updatePermissions);

/**
 * @route   PUT /api/users/:id/projects
 * @desc    Assign projects to user
 * @access  Admin/Project Manager (MVP: Public with optional auth)
 */
router.put('/:id/projects', userController.assignProjects);

/**
 * @route   GET /api/users/:id/activity
 * @desc    Get user activity logs
 * @access  Admin (MVP: Public with optional auth)
 */
router.get('/:id/activity', userController.getUserActivity);

/**
 * @route   PUT /api/users/:id/change-password
 * @desc    Change user password
 * @access  User/Admin (MVP: Public with optional auth)
 */
router.put('/:id/change-password', userController.changePassword);

module.exports = router;
