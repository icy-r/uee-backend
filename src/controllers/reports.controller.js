const Project = require('../models/Project');
const Task = require('../models/Task');
const Material = require('../models/Material');
const Waste = require('../models/Waste');
const Budget = require('../models/Budget');
const sustainabilityService = require('../services/sustainability.service');
const analyticsService = require('../services/analytics.service');
const catchAsync = require('../utils/catchAsync');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Generate project status report
 * @route POST /api/projects/:id/reports/status
 */
exports.generateStatusReport = catchAsync(async (req, res) => {
  const { id: projectId } = req.params;
  const { startDate, endDate } = req.body;

  const project = await Project.findById(projectId);
  if (!project) {
    return errorResponse(res, 'Project not found', 404);
  }

  // Get analytics
  const [progressAnalytics, materialAnalytics, budgetAnalytics, teamAnalytics] = await Promise.all([
    analyticsService.getProgressAnalytics(projectId, { startDate, endDate }),
    analyticsService.getMaterialAnalytics(projectId, { startDate, endDate }),
    analyticsService.getBudgetAnalytics(projectId),
    analyticsService.getTeamAnalytics(projectId)
  ]);

  // Get recent tasks
  const recentTasks = await Task.find({ projectId })
    .sort({ updatedAt: -1 })
    .limit(10)
    .select('title status priority deadline assignedTo')
    .lean();

  const report = {
    reportType: 'status',
    generatedAt: new Date(),
    generatedBy: req.user.uid,
    dateRange: { startDate, endDate },
    project: {
      id: project._id,
      name: project.name,
      status: project.status,
      location: project.location,
      startDate: project.startDate,
      endDate: project.endDate,
      progressPercentage: project.progressPercentage,
      sustainabilityScore: project.sustainabilityScore
    },
    summary: {
      tasks: progressAnalytics.summary,
      materials: materialAnalytics.summary,
      budget: budgetAnalytics.summary,
      team: teamAnalytics.summary
    },
    progress: {
      tasksByStatus: progressAnalytics.tasksByStatus,
      tasksByPriority: progressAnalytics.tasksByPriority,
      estimatedCompletion: progressAnalytics.estimatedCompletionDate
    },
    recentActivity: recentTasks,
    alerts: this.generateAlerts(progressAnalytics, budgetAnalytics, materialAnalytics)
  };

  successResponse(res, report, 'Status report generated successfully');
});

/**
 * Generate expense report
 * @route POST /api/projects/:id/reports/expenses
 */
exports.generateExpenseReport = catchAsync(async (req, res) => {
  const { id: projectId } = req.params;
  const { startDate, endDate } = req.body;

  const project = await Project.findById(projectId);
  if (!project) {
    return errorResponse(res, 'Project not found', 404);
  }

  // Get budget analytics
  const budgetAnalytics = await analyticsService.getBudgetAnalytics(projectId);

  // Get detailed expenses
  const budgets = await Budget.find({ projectId });
  
  let allExpenses = [];
  budgets.forEach(budget => {
    if (budget.expenses && budget.expenses.length > 0) {
      budget.expenses.forEach(expense => {
        allExpenses.push({
          ...expense.toObject(),
          category: budget.category
        });
      });
    }
  });

  // Filter by date range if provided
  if (startDate || endDate) {
    allExpenses = allExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      if (startDate && expenseDate < new Date(startDate)) return false;
      if (endDate && expenseDate > new Date(endDate)) return false;
      return true;
    });
  }

  // Sort by date (most recent first)
  allExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

  const report = {
    reportType: 'expenses',
    generatedAt: new Date(),
    generatedBy: req.user.uid,
    dateRange: { startDate, endDate },
    project: {
      id: project._id,
      name: project.name,
      totalBudget: project.budget
    },
    summary: budgetAnalytics.summary,
    breakdown: budgetAnalytics.budgetByCategory,
    expenses: allExpenses,
    forecast: budgetAnalytics.forecast,
    overBudgetCategories: budgetAnalytics.categoriesOverBudget
  };

  successResponse(res, report, 'Expense report generated successfully');
});

/**
 * Generate sustainability report
 * @route POST /api/projects/:id/reports/sustainability
 */
exports.generateSustainabilityReport = catchAsync(async (req, res) => {
  const { id: projectId } = req.params;

  const project = await Project.findById(projectId);
  if (!project) {
    return errorResponse(res, 'Project not found', 404);
  }

  // Get sustainability data
  const [scores, carbonFootprint, recommendations, benchmark] = await Promise.all([
    sustainabilityService.calculateProjectScore(projectId),
    sustainabilityService.calculateCarbonFootprint(projectId),
    sustainabilityService.getRecommendations(projectId),
    sustainabilityService.compareToBenchmark(projectId)
  ]);

  // Get waste analytics
  const wasteAnalytics = await Waste.getProjectAnalytics(projectId);

  const report = {
    reportType: 'sustainability',
    generatedAt: new Date(),
    generatedBy: req.user.uid,
    project: {
      id: project._id,
      name: project.name,
      location: project.location
    },
    overallScore: scores.overallScore,
    grade: scores.overallScore >= 90 ? 'A' : scores.overallScore >= 80 ? 'B' : scores.overallScore >= 70 ? 'C' : scores.overallScore >= 60 ? 'D' : 'F',
    scores: scores.scores,
    metrics: scores.metrics,
    carbonFootprint,
    wasteManagement: {
      ...wasteAnalytics,
      recommendations: recommendations.filter(r => r.category === 'waste')
    },
    recommendations: recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }),
    benchmark,
    certificationPotential: this.assessCertificationPotential(scores.overallScore)
  };

  successResponse(res, report, 'Sustainability report generated successfully');
});

/**
 * Generate material usage report
 * @route POST /api/projects/:id/reports/materials
 */
exports.generateMaterialReport = catchAsync(async (req, res) => {
  const { id: projectId } = req.params;
  const { startDate, endDate } = req.body;

  const project = await Project.findById(projectId);
  if (!project) {
    return errorResponse(res, 'Project not found', 404);
  }

  // Get material analytics
  const materialAnalytics = await analyticsService.getMaterialAnalytics(projectId, { startDate, endDate });

  // Get all materials with details
  const materials = await Material.find({ projectId });

  // Get waste data
  const wasteAnalytics = await Waste.getProjectAnalytics(projectId, startDate, endDate);

  const report = {
    reportType: 'materials',
    generatedAt: new Date(),
    generatedBy: req.user.uid,
    dateRange: { startDate, endDate },
    project: {
      id: project._id,
      name: project.name
    },
    summary: materialAnalytics.summary,
    materialsByType: materialAnalytics.materialsByType,
    costBreakdown: materialAnalytics.costBreakdown,
    usageTrends: materialAnalytics.usageOverTime,
    lowStockMaterials: materialAnalytics.lowStockMaterials,
    wasteAnalysis: wasteAnalytics,
    efficiency: {
      wasteRatio: materialAnalytics.summary.wasteRatio,
      utilizationRate: 100 - materialAnalytics.summary.wasteRatio,
      ecoFriendlyPercentage: this.calculateEcoFriendlyPercentage(materials)
    },
    recommendations: this.generateMaterialRecommendations(materialAnalytics, wasteAnalytics)
  };

  successResponse(res, report, 'Material report generated successfully');
});

/**
 * Generate comprehensive project report
 * @route POST /api/projects/:id/reports/comprehensive
 */
exports.generateComprehensiveReport = catchAsync(async (req, res) => {
  const { id: projectId } = req.params;
  const { startDate, endDate } = req.body;

  const project = await Project.findById(projectId);
  if (!project) {
    return errorResponse(res, 'Project not found', 404);
  }

  // Get all analytics
  const [
    progressAnalytics,
    materialAnalytics,
    budgetAnalytics,
    teamAnalytics,
    sustainabilityScores
  ] = await Promise.all([
    analyticsService.getProgressAnalytics(projectId, { startDate, endDate }),
    analyticsService.getMaterialAnalytics(projectId, { startDate, endDate }),
    analyticsService.getBudgetAnalytics(projectId),
    analyticsService.getTeamAnalytics(projectId),
    sustainabilityService.calculateProjectScore(projectId)
  ]);

  const report = {
    reportType: 'comprehensive',
    generatedAt: new Date(),
    generatedBy: req.user.uid,
    dateRange: { startDate, endDate },
    project: {
      id: project._id,
      name: project.name,
      status: project.status,
      location: project.location,
      startDate: project.startDate,
      endDate: project.endDate,
      budget: project.budget
    },
    executiveSummary: {
      projectHealth: this.assessProjectHealth(progressAnalytics, budgetAnalytics),
      completionPercentage: progressAnalytics.summary.completionRate,
      budgetUtilization: budgetAnalytics.summary.utilizationRate,
      sustainabilityScore: sustainabilityScores.overallScore,
      keyMetrics: {
        tasksCompleted: progressAnalytics.summary.completedTasks,
        totalSpent: budgetAnalytics.summary.totalSpent,
        teamSize: teamAnalytics.summary.teamSize,
        daysRemaining: progressAnalytics.daysToCompletion
      }
    },
    progress: progressAnalytics,
    materials: materialAnalytics,
    budget: budgetAnalytics,
    team: teamAnalytics,
    sustainability: sustainabilityScores,
    criticalIssues: this.identifyCriticalIssues(progressAnalytics, budgetAnalytics, materialAnalytics)
  };

  successResponse(res, report, 'Comprehensive report generated successfully');
});

// Helper methods
exports.generateAlerts = (progressAnalytics, budgetAnalytics, materialAnalytics) => {
  const alerts = [];

  // Budget alerts
  if (budgetAnalytics.summary.utilizationRate > 90) {
    alerts.push({
      type: 'budget',
      severity: budgetAnalytics.summary.utilizationRate > 100 ? 'critical' : 'high',
      message: `Budget ${budgetAnalytics.summary.utilizationRate.toFixed(1)}% utilized`
    });
  }

  // Task alerts
  if (progressAnalytics.summary.overdueTasks > 0) {
    alerts.push({
      type: 'tasks',
      severity: 'medium',
      message: `${progressAnalytics.summary.overdueTasks} overdue task(s)`
    });
  }

  // Material alerts
  if (materialAnalytics.summary.lowStockCount > 0) {
    alerts.push({
      type: 'materials',
      severity: 'medium',
      message: `${materialAnalytics.summary.lowStockCount} material(s) low in stock`
    });
  }

  return alerts;
};

exports.assessCertificationPotential = (score) => {
  if (score >= 85) return 'LEED Platinum / BREEAM Outstanding';
  if (score >= 75) return 'LEED Gold / BREEAM Excellent';
  if (score >= 65) return 'LEED Silver / BREEAM Very Good';
  if (score >= 55) return 'LEED Certified / BREEAM Good';
  return 'Below certification standards';
};

exports.calculateEcoFriendlyPercentage = (materials) => {
  if (materials.length === 0) return 0;
  
  const ecoFriendlyCount = materials.filter(m => {
    const name = (m.name || '').toLowerCase();
    const type = (m.type || '').toLowerCase();
    return name.includes('eco') || name.includes('recycled') || name.includes('sustainable') ||
           type.includes('eco') || type.includes('recycled') || type.includes('sustainable');
  }).length;

  return parseFloat(((ecoFriendlyCount / materials.length) * 100).toFixed(2));
};

exports.generateMaterialRecommendations = (materialAnalytics, wasteAnalytics) => {
  const recommendations = [];

  if (materialAnalytics.summary.wasteRatio > 15) {
    recommendations.push({
      priority: 'high',
      category: 'waste_reduction',
      suggestion: 'Implement better material planning to reduce waste',
      potentialSavings: 'High'
    });
  }

  if (materialAnalytics.summary.lowStockCount > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'inventory',
      suggestion: 'Reorder low-stock materials to avoid project delays',
      potentialSavings: 'Medium'
    });
  }

  if (wasteAnalytics.totals.recyclableCount > 0) {
    const recyclingRate = wasteAnalytics.totals.recyclableCount / wasteAnalytics.totals.totalRecords * 100;
    if (recyclingRate < 50) {
      recommendations.push({
        priority: 'medium',
        category: 'recycling',
        suggestion: 'Increase recycling efforts for recyclable materials',
        potentialSavings: 'Medium'
      });
    }
  }

  return recommendations;
};

exports.assessProjectHealth = (progressAnalytics, budgetAnalytics) => {
  const completionRate = progressAnalytics.summary.completionRate;
  const budgetUtilization = budgetAnalytics.summary.utilizationRate;
  const hasOverdueTasks = progressAnalytics.summary.overdueTasks > 0;

  if (budgetUtilization > 100 || hasOverdueTasks > 5) {
    return 'critical';
  }
  
  if (budgetUtilization > 90 || completionRate < 50 && hasOverdueTasks > 0) {
    return 'warning';
  }
  
  if (completionRate > 70 && budgetUtilization < 85) {
    return 'excellent';
  }
  
  return 'good';
};

exports.identifyCriticalIssues = (progressAnalytics, budgetAnalytics, materialAnalytics) => {
  const issues = [];

  // Budget overrun
  if (budgetAnalytics.forecast.budgetOverrunRisk) {
    issues.push({
      severity: 'critical',
      category: 'budget',
      issue: 'Budget overrun projected',
      impact: `Estimated overrun: ${budgetAnalytics.forecast.estimatedOverrun}`,
      recommendation: 'Review and optimize spending immediately'
    });
  }

  // Significant delays
  if (progressAnalytics.summary.completionRate < 50 && progressAnalytics.summary.overdueTasks > 5) {
    issues.push({
      severity: 'high',
      category: 'schedule',
      issue: 'Project significantly behind schedule',
      impact: `${progressAnalytics.summary.overdueTasks} overdue tasks`,
      recommendation: 'Reassess timeline and resource allocation'
    });
  }

  // High waste
  if (materialAnalytics.summary.wasteRatio > 20) {
    issues.push({
      severity: 'medium',
      category: 'materials',
      issue: 'Excessive material waste',
      impact: `${materialAnalytics.summary.wasteRatio.toFixed(1)}% waste ratio`,
      recommendation: 'Implement waste reduction strategies'
    });
  }

  return issues;
};

