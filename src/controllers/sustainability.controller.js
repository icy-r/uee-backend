const sustainabilityService = require('../services/sustainability.service');
const SustainabilityMetrics = require('../models/SustainabilityMetrics');
const catchAsync = require('../utils/catchAsync');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Get project sustainability score
 * @route GET /api/sustainability/score
 */
exports.getProjectSustainabilityScore = catchAsync(async (req, res) => {
  const { projectId } = req.query;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  const scores = await sustainabilityService.calculateProjectScore(projectId);

  successResponse(res, scores, 'Sustainability score calculated successfully');
});

/**
 * Get carbon footprint for a project
 * @route GET /api/sustainability/carbon-footprint
 */
exports.getCarbonFootprint = catchAsync(async (req, res) => {
  const { projectId } = req.query;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  const carbonFootprint = await sustainabilityService.calculateCarbonFootprint(projectId);

  successResponse(res, carbonFootprint, 'Carbon footprint calculated successfully');
});

/**
 * Get AI-powered sustainability recommendations
 * @route GET /api/sustainability/recommendations
 */
exports.getRecommendations = catchAsync(async (req, res) => {
  const { projectId } = req.query;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  const recommendations = await sustainabilityService.getRecommendations(projectId);

  successResponse(res, {
    recommendations,
    count: recommendations.length
  }, 'Recommendations generated successfully');
});

/**
 * Get sustainability trends for a project
 * @route GET /api/sustainability/trends
 */
exports.getSustainabilityTrends = catchAsync(async (req, res) => {
  const { projectId, timeRange = '30' } = req.query;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  const days = parseInt(timeRange);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get historical metrics
  const metrics = await SustainabilityMetrics.find({
    projectId,
    date: { $gte: startDate }
  })
  .sort({ date: 1 })
  .select('date overallScore scores carbonFootprint');

  // Calculate trend
  const trend = await SustainabilityMetrics.calculateTrend(projectId, days);

  successResponse(res, {
    metrics,
    trend,
    timeRange: `${days} days`
  }, 'Sustainability trends retrieved successfully');
});

/**
 * Compare project to industry benchmark
 * @route GET /api/sustainability/benchmark
 */
exports.compareToBenchmark = catchAsync(async (req, res) => {
  const { projectId } = req.query;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  const benchmark = await sustainabilityService.compareToBenchmark(projectId);

  successResponse(res, benchmark, 'Benchmark comparison completed successfully');
});

/**
 * Get complete sustainability dashboard data
 * @route GET /api/sustainability/dashboard
 */
exports.getSustainabilityDashboard = catchAsync(async (req, res) => {
  const { projectId } = req.query;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  // Fetch all sustainability data in parallel
  const [scores, carbonFootprint, recommendations, benchmark, latestMetrics] = await Promise.all([
    sustainabilityService.calculateProjectScore(projectId),
    sustainabilityService.calculateCarbonFootprint(projectId),
    sustainabilityService.getRecommendations(projectId),
    sustainabilityService.compareToBenchmark(projectId),
    SustainabilityMetrics.getLatestForProject(projectId)
  ]);

  // Get trend data (last 30 days)
  const trend = await SustainabilityMetrics.calculateTrend(projectId, 30);

  successResponse(res, {
    currentScore: scores,
    carbonFootprint,
    recommendations: recommendations.slice(0, 5), // Top 5 recommendations
    benchmark,
    trend,
    lastUpdated: latestMetrics?.calculatedAt || new Date()
  }, 'Sustainability dashboard data retrieved successfully');
});

/**
 * Save/update sustainability metrics
 * @route POST /api/sustainability/calculate
 */
exports.calculateAndSaveMetrics = catchAsync(async (req, res) => {
  const { projectId } = req.body;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  const metrics = await sustainabilityService.saveSustainabilityMetrics(projectId);

  successResponse(res, metrics, 'Sustainability metrics calculated and saved successfully', 201);
});

/**
 * Get sustainability metrics history
 * @route GET /api/sustainability/history
 */
exports.getMetricsHistory = catchAsync(async (req, res) => {
  const { projectId, limit = 30 } = req.query;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  const history = await SustainabilityMetrics.getHistory(projectId, parseInt(limit));

  successResponse(res, {
    history,
    count: history.length
  }, 'Sustainability metrics history retrieved successfully');
});

/**
 * Get latest sustainability metrics
 * @route GET /api/sustainability/latest
 */
exports.getLatestMetrics = catchAsync(async (req, res) => {
  const { projectId } = req.query;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  const metrics = await SustainabilityMetrics.getLatestForProject(projectId);

  if (!metrics) {
    return errorResponse(res, 'No sustainability metrics found for this project', 404);
  }

  successResponse(res, metrics, 'Latest sustainability metrics retrieved successfully');
});

/**
 * Add custom recommendation to existing metrics
 * @route POST /api/sustainability/recommendations/add
 */
exports.addCustomRecommendation = catchAsync(async (req, res) => {
  const { projectId, recommendation } = req.body;

  if (!projectId || !recommendation) {
    return errorResponse(res, 'Project ID and recommendation are required', 400);
  }

  // Get latest metrics
  let metrics = await SustainabilityMetrics.getLatestForProject(projectId);

  if (!metrics) {
    // Create new metrics if none exist
    metrics = await sustainabilityService.saveSustainabilityMetrics(projectId);
  }

  // Add recommendation
  await metrics.addRecommendation({
    category: recommendation.category || 'general',
    priority: recommendation.priority || 'medium',
    title: recommendation.title,
    description: recommendation.description,
    potentialImpact: recommendation.potentialImpact || 'moderate',
    estimatedCostSaving: recommendation.estimatedCostSaving || 0,
    estimatedCO2Reduction: recommendation.estimatedCO2Reduction || 0,
    implementationDifficulty: recommendation.implementationDifficulty || 'medium'
  });

  successResponse(res, metrics, 'Recommendation added successfully');
});

