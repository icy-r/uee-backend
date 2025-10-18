const analyticsService = require('../services/analytics.service');
const catchAsync = require('../utils/catchAsync');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Get progress analytics
 * @route GET /api/projects/:id/analytics/progress
 */
exports.getProgressAnalytics = catchAsync(async (req, res) => {
  const { id: projectId } = req.params;
  const { startDate, endDate } = req.query;

  const analytics = await analyticsService.getProgressAnalytics(projectId, {
    startDate,
    endDate
  });

  successResponse(res, analytics, 'Progress analytics retrieved successfully');
});

/**
 * Get material analytics
 * @route GET /api/projects/:id/analytics/materials
 */
exports.getMaterialAnalytics = catchAsync(async (req, res) => {
  const { id: projectId } = req.params;
  const { startDate, endDate } = req.query;

  const analytics = await analyticsService.getMaterialAnalytics(projectId, {
    startDate,
    endDate
  });

  successResponse(res, analytics, 'Material analytics retrieved successfully');
});

/**
 * Get budget analytics
 * @route GET /api/projects/:id/analytics/budget
 */
exports.getBudgetAnalytics = catchAsync(async (req, res) => {
  const { id: projectId } = req.params;

  const analytics = await analyticsService.getBudgetAnalytics(projectId);

  successResponse(res, analytics, 'Budget analytics retrieved successfully');
});

/**
 * Get team productivity analytics
 * @route GET /api/projects/:id/analytics/team
 */
exports.getTeamAnalytics = catchAsync(async (req, res) => {
  const { id: projectId } = req.params;

  const analytics = await analyticsService.getTeamAnalytics(projectId);

  successResponse(res, analytics, 'Team analytics retrieved successfully');
});

/**
 * Get comprehensive analytics (all analytics combined)
 * @route GET /api/projects/:id/analytics
 */
exports.getComprehensiveAnalytics = catchAsync(async (req, res) => {
  const { id: projectId } = req.params;

  const analytics = await analyticsService.getComprehensiveAnalytics(projectId);

  successResponse(res, analytics, 'Comprehensive analytics retrieved successfully');
});

