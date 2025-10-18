const Project = require('../models/Project');
const Task = require('../models/Task');
const Material = require('../models/Material');
const Budget = require('../models/Budget');
const weatherService = require('../services/weather.service');
const geminiService = require('../services/gemini.service');
const sustainabilityService = require("../services/sustainability.service");
const analyticsService = require("../services/analytics.service");
const catchAsync = require("../utils/catchAsync");
const { successResponse, errorResponse } = require("../utils/responseHandler");

// Simple in-memory cache for dashboard data (5-minute TTL)
const dashboardCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached data or execute function and cache result
 */
const getCached = async (key, fetchFn) => {
  const cached = dashboardCache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await fetchFn();
  dashboardCache.set(key, { data, timestamp: Date.now() });

  return data;
};

/**
 * Get project overview with status and progress
 */
exports.getOverview = catchAsync(async (req, res) => {
  const { projectId } = req.query;

  if (!projectId) {
    return errorResponse(res, "Project ID is required", 400);
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return errorResponse(res, "Project not found", 404);
  }

  // Get task statistics
  const tasks = await Task.find({ projectId });
  const taskStats = {
    total: tasks.length,
    notStarted: tasks.filter((t) => t.status === "not_started").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    overdue: tasks.filter((t) => t.isOverdue).length,
  };

  // Get material statistics
  const materials = await Material.find({ projectId });
  const materialStats = {
    total: materials.length,
    needsReorder: materials.filter((m) => m.needsReorder()).length,
    totalValue: materials.reduce((sum, m) => sum + m.totalCost, 0),
  };

  // Get budget information
  const budget = await Budget.findOne({ projectId });
  const budgetStats = budget
    ? {
        total: budget.totalBudget,
        spent: budget.totalExpenses,
        remaining: budget.remainingBudget,
        utilizationPercentage: budget.utilizationPercentage,
        alertLevel: budget.getBudgetAlertLevel(),
      }
    : null;

  // Update progress
  await project.calculateProgress();
  await project.calculateSustainabilityScore();

  const overview = {
    project: {
      id: project._id,
      name: project.name,
      status: project.status,
      progressPercentage: project.progressPercentage,
      sustainabilityScore: project.sustainabilityScore,
      startDate: project.startDate,
      expectedEndDate: project.expectedEndDate,
      daysElapsed: Math.floor(
        (Date.now() - project.startDate) / (1000 * 60 * 60 * 24)
      ),
      daysRemaining: Math.floor(
        (project.expectedEndDate - Date.now()) / (1000 * 60 * 60 * 24)
      ),
    },
    tasks: taskStats,
    materials: materialStats,
    budget: budgetStats,
  };

  successResponse(res, overview, "Project overview retrieved successfully");
});

/**
 * Get progress analytics and trends
 */
exports.getAnalytics = catchAsync(async (req, res) => {
  const { projectId } = req.query;

  if (!projectId) {
    return errorResponse(res, "Project ID is required", 400);
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return errorResponse(res, "Project not found", 404);
  }

  const tasks = await Task.find({ projectId }).sort({ createdAt: 1 });
  const materials = await Material.find({ projectId });
  const budget = await Budget.findOne({ projectId });

  // Task completion trend (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const completedTasks = tasks.filter(
    (t) => t.completedAt && t.completedAt >= thirtyDaysAgo
  );
  const taskTrend = this.groupTasksByDay(completedTasks);

  // Expense trend
  const expenseTrend = budget
    ? this.groupExpensesByDay(budget.expenses, thirtyDaysAgo)
    : [];

  // Material usage trend
  const materialUsageTrend = this.calculateMaterialUsageTrend(
    materials,
    thirtyDaysAgo
  );

  // Sustainability trend
  const sustainabilityTrend = {
    current: project.sustainabilityScore,
    ecoFriendlyPercentage: this.calculateEcoFriendlyPercentage(materials),
    wasteReductionPercentage: this.calculateWasteReduction(materials),
  };

  const analytics = {
    taskCompletionTrend: taskTrend,
    expenseTrend,
    materialUsageTrend,
    sustainabilityTrend,
    productivity: {
      tasksPerDay: completedTasks.length / 30,
      avgTaskDuration: this.calculateAvgTaskDuration(completedTasks),
    },
  };

  successResponse(res, analytics, "Analytics retrieved successfully");
});

/**
 * Get weather data for project location (with caching)
 * @route GET /api/dashboard/weather
 */
exports.getWeather = catchAsync(async (req, res) => {
  const { location, projectId } = req.query;

  let weatherLocation = location;

  // If projectId is provided, get location from project
  if (projectId && !location) {
    const project = await Project.findById(projectId);
    if (project) {
      weatherLocation = project.location;
    }
  }

  if (!weatherLocation) {
    return errorResponse(res, "Location or projectId is required", 400);
  }

  // Cache weather data for 1 hour
  const cacheKey = `weather:${weatherLocation}`;
  const weatherData = await getCached(cacheKey, async () => {
    const results = await Promise.all([
      weatherService.getCurrentWeather(weatherLocation),
      weatherService.getForecast(weatherLocation, 5),
    ]);

    const [currentWeather, forecast] = results;
    return {
      current: currentWeather,
      forecast: forecast.forecasts,
      workableDays: forecast.workableDay,
      location: weatherLocation,
      fetchedAt: new Date(),
    };
  });

  successResponse(res, weatherData, "Weather data retrieved successfully");
});

/**
 * Get sustainability score and recommendations (enhanced with new service)
 * @route GET /api/dashboard/sustainability
 */
exports.getSustainabilityScore = catchAsync(async (req, res) => {
  const { projectId } = req.query;

  if (!projectId) {
    return errorResponse(res, "Project ID is required", 400);
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return errorResponse(res, "Project not found", 404);
  }

  // Use new sustainability service
  const [scores, carbonFootprint, recommendations, benchmark] =
    await Promise.all([
      sustainabilityService.calculateProjectScore(projectId),
      sustainabilityService.calculateCarbonFootprint(projectId),
      sustainabilityService.getRecommendations(projectId),
      sustainabilityService.compareToBenchmark(projectId),
    ]);

  // Update project with latest score
  if (project.sustainabilityScore !== scores.overallScore) {
    project.sustainabilityScore = scores.overallScore;
    await project.save();
  }

  const result = {
    score: scores.overallScore,
    scores: scores.scores,
    metrics: scores.metrics,
    carbonFootprint,
    recommendations: recommendations.slice(0, 5), // Top 5 recommendations
    benchmark,
    grade:
      scores.overallScore >= 90
        ? "A"
        : scores.overallScore >= 80
        ? "B"
        : scores.overallScore >= 70
        ? "C"
        : scores.overallScore >= 60
        ? "D"
        : "F",
  };

  successResponse(res, result, "Sustainability score retrieved successfully");
});

// Helper methods
exports.groupTasksByDay = (tasks) => {
  const grouped = {};
  
  tasks.forEach(task => {
    const dateKey = task.completedAt.toISOString().split('T')[0];
    grouped[dateKey] = (grouped[dateKey] || 0) + 1;
  });

  return Object.entries(grouped).map(([date, count]) => ({ date, count }));
};

exports.groupExpensesByDay = (expenses, fromDate) => {
  const grouped = {};
  
  expenses
    .filter(e => e.date >= fromDate)
    .forEach(expense => {
      const dateKey = expense.date.toISOString().split('T')[0];
      grouped[dateKey] = (grouped[dateKey] || 0) + expense.amount;
    });

  return Object.entries(grouped).map(([date, amount]) => ({ date, amount }));
};

exports.calculateMaterialUsageTrend = (materials, fromDate) => {
  const allUsage = [];
  
  materials.forEach(material => {
    material.usageLog
      .filter(log => log.date >= fromDate)
      .forEach(log => allUsage.push({ date: log.date, quantity: log.quantity }));
  });

  const grouped = {};
  allUsage.forEach(usage => {
    const dateKey = usage.date.toISOString().split('T')[0];
    grouped[dateKey] = (grouped[dateKey] || 0) + usage.quantity;
  });

  return Object.entries(grouped).map(([date, quantity]) => ({ date, quantity }));
};

exports.calculateEcoFriendlyPercentage = (materials) => {
  if (materials.length === 0) return 0;
  const ecoCount = materials.filter(m => m.ecoFriendly).length;
  return Math.round((ecoCount / materials.length) * 100);
};

exports.calculateWasteReduction = (materials) => {
  const totalUsage = materials.reduce((sum, m) => sum + m.totalUsage, 0);
  const totalWaste = materials.reduce((sum, m) => sum + m.totalWaste, 0);
  
  if (totalUsage === 0) return 100;
  
  const wastePercentage = (totalWaste / totalUsage) * 100;
  return Math.round(Math.max(0, 100 - wastePercentage));
};

exports.assessEnvironmentalImpact = (materials) => {
  const score = this.calculateEcoFriendlyPercentage(materials);
  
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'moderate';
  return 'needs improvement';
};

exports.calculateAvgTaskDuration = (tasks) => {
  if (tasks.length === 0) return 0;
  
  const durations = tasks
    .filter(t => t.completedAt && t.createdAt)
    .map(t => (t.completedAt - t.createdAt) / (1000 * 60 * 60 * 24)); // days
  
  return durations.length > 0 
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;
};

