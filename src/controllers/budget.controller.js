const Budget = require('../models/Budget');
const Project = require('../models/Project');
const Material = require('../models/Material');
const geminiService = require('../services/gemini.service');
const catchAsync = require('../utils/catchAsync');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Create or set project budget
 */
exports.createBudget = catchAsync(async (req, res) => {
  const { projectId, totalBudget, allocations, contingencyPercentage } = req.body;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return errorResponse(res, 'Project not found', 404);
  }

  // Check if budget already exists
  let budget = await Budget.findOne({ projectId });
  
  if (budget) {
    // Update existing budget
    budget.totalBudget = totalBudget;
    budget.allocations = allocations || budget.allocations;
    if (contingencyPercentage !== undefined) {
      budget.contingencyPercentage = contingencyPercentage;
    }
    await budget.save();
    
    return successResponse(res, budget, 'Budget updated successfully');
  }

  // Create new budget
  budget = await Budget.create({
    projectId,
    totalBudget,
    allocations: allocations || {
      materials: 0,
      labor: 0,
      equipment: 0,
      other: 0
    },
    contingencyPercentage: contingencyPercentage || 10
  });

  successResponse(res, budget, 'Budget created successfully', 201);
});

/**
 * Get budget overview
 */
exports.getBudgetOverview = catchAsync(async (req, res) => {
  const { projectId } = req.query;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  const budget = await Budget.findOne({ projectId });
  
  if (!budget) {
    return errorResponse(res, 'Budget not found for this project', 404);
  }

  const overview = {
    totalBudget: budget.totalBudget,
    totalExpenses: budget.totalExpenses,
    remainingBudget: budget.remainingBudget,
    utilizationPercentage: budget.utilizationPercentage,
    allocations: budget.allocations,
    expensesByCategory: budget.expensesByCategory,
    alertLevel: budget.getBudgetAlertLevel(),
    contingency: {
      percentage: budget.contingencyPercentage,
      amount: (budget.totalBudget * budget.contingencyPercentage) / 100
    },
    currency: budget.currency
  };

  successResponse(res, overview, 'Budget overview retrieved successfully');
});

/**
 * Log new expense
 */
exports.logExpense = catchAsync(async (req, res) => {
  const { projectId, category, amount, description, date, invoiceNumber, vendor } = req.body;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  const budget = await Budget.findOne({ projectId });
  
  if (!budget) {
    return errorResponse(res, 'Budget not found. Please create a budget first.', 404);
  }

  budget.expenses.push({
    category,
    amount,
    description,
    date: date || new Date(),
    invoiceNumber,
    vendor,
    addedBy: req.user?.uid || 'system'
  });

  await budget.save();

  // Check if budget exceeded
  const alert = budget.isBudgetExceeded() 
    ? { warning: 'Budget exceeded!', alertLevel: budget.getBudgetAlertLevel() }
    : null;

  successResponse(
    res,
    { budget, alert },
    'Expense logged successfully'
  );
});

/**
 * Get all expenses
 */
exports.getExpenses = catchAsync(async (req, res) => {
  const { projectId, category, startDate, endDate } = req.query;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  const budget = await Budget.findOne({ projectId });
  
  if (!budget) {
    return errorResponse(res, 'Budget not found', 404);
  }

  let expenses = budget.expenses;

  // Filter by category
  if (category) {
    expenses = expenses.filter(e => e.category === category);
  }

  // Filter by date range
  if (startDate) {
    const start = new Date(startDate);
    expenses = expenses.filter(e => e.date >= start);
  }

  if (endDate) {
    const end = new Date(endDate);
    expenses = expenses.filter(e => e.date <= end);
  }

  // Sort by date (most recent first)
  expenses.sort((a, b) => b.date - a.date);

  successResponse(res, expenses, 'Expenses retrieved successfully');
});

/**
 * Update expense
 */
exports.updateExpense = catchAsync(async (req, res) => {
  const { projectId, expenseId } = req.params;
  const updateData = req.body;

  const budget = await Budget.findOne({ projectId });
  
  if (!budget) {
    return errorResponse(res, 'Budget not found', 404);
  }

  const expense = budget.expenses.id(expenseId);
  
  if (!expense) {
    return errorResponse(res, 'Expense not found', 404);
  }

  Object.assign(expense, updateData);
  await budget.save();

  successResponse(res, expense, 'Expense updated successfully');
});

/**
 * Delete expense
 */
exports.deleteExpense = catchAsync(async (req, res) => {
  const { projectId, expenseId } = req.params;

  const budget = await Budget.findOne({ projectId });
  
  if (!budget) {
    return errorResponse(res, 'Budget not found', 404);
  }

  budget.expenses.pull(expenseId);
  await budget.save();

  successResponse(res, null, 'Expense deleted successfully');
});

/**
 * Generate expense report
 */
exports.generateReport = catchAsync(async (req, res) => {
  const { projectId, startDate, endDate } = req.query;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  const budget = await Budget.findOne({ projectId });
  
  if (!budget) {
    return errorResponse(res, 'Budget not found', 404);
  }

  let expenses = budget.expenses;

  // Filter by date range if provided
  if (startDate) {
    expenses = expenses.filter(e => e.date >= new Date(startDate));
  }
  if (endDate) {
    expenses = expenses.filter(e => e.date <= new Date(endDate));
  }

  // Calculate breakdown
  const breakdown = {
    materials: 0,
    labor: 0,
    equipment: 0,
    other: 0
  };

  expenses.forEach(expense => {
    breakdown[expense.category] += expense.amount;
  });

  const report = {
    period: {
      start: startDate || budget.createdAt,
      end: endDate || new Date()
    },
    summary: {
      totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
      numberOfExpenses: expenses.length,
      averageExpense: expenses.length > 0 
        ? expenses.reduce((sum, e) => sum + e.amount, 0) / expenses.length 
        : 0
    },
    breakdown,
    topExpenses: expenses
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
      .map(e => ({
        description: e.description,
        amount: e.amount,
        category: e.category,
        date: e.date,
        vendor: e.vendor
      })),
    byMonth: this.groupExpensesByMonth(expenses),
    budgetComparison: {
      allocated: budget.totalBudget,
      spent: budget.totalExpenses,
      remaining: budget.remainingBudget,
      percentageUsed: budget.utilizationPercentage
    }
  };

  successResponse(res, report, 'Expense report generated successfully');
});

/**
 * Get AI-based cost predictions
 */
exports.getCostPrediction = catchAsync(async (req, res) => {
  const { projectId, timeframe = 3 } = req.query;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return errorResponse(res, 'Project not found', 404);
  }

  const materials = await Material.find({ projectId });
  
  // Prepare data for AI prediction
  const costData = {
    materials: materials.map(m => ({
      name: m.name,
      currentPrice: m.unitCost,
      unit: m.unit,
      currency: 'LKR'
    })),
    location: project.location,
    timeframe: parseInt(timeframe)
  };

  const prediction = await geminiService.predictCosts(costData);

  // Save predictions to budget
  const budget = await Budget.findOne({ projectId });
  if (budget) {
    prediction.predictions.forEach(pred => {
      budget.costPredictions.push({
        materialType: pred.materialName,
        currentPrice: pred.currentPrice,
        predictedPrice: pred.predictedPrice,
        confidence: pred.confidence,
        marketTrend: pred.trend
      });
    });
    await budget.save();
  }

  successResponse(res, prediction, 'Cost prediction completed successfully');
});

/**
 * Get AI-based budget optimization suggestions
 */
exports.optimizeBudget = catchAsync(async (req, res) => {
  const { projectId } = req.body;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  const budget = await Budget.findOne({ projectId });
  
  if (!budget) {
    return errorResponse(res, 'Budget not found', 404);
  }

  const project = await Project.findById(projectId);

  // Prepare data for AI optimization
  const budgetData = {
    totalBudget: budget.totalBudget,
    currentAllocations: budget.allocations,
    expenses: budget.totalExpenses,
    projectPhase: project.status
  };

  const optimization = await geminiService.optimizeBudget(budgetData);

  successResponse(res, optimization, 'Budget optimization completed successfully');
});

/**
 * Get budget analytics
 */
exports.getBudgetAnalytics = catchAsync(async (req, res) => {
  const { projectId } = req.query;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  const budget = await Budget.findOne({ projectId });
  
  if (!budget) {
    return errorResponse(res, 'Budget not found', 404);
  }

  const analytics = {
    overview: {
      totalBudget: budget.totalBudget,
      spent: budget.totalExpenses,
      remaining: budget.remainingBudget,
      utilization: budget.utilizationPercentage
    },
    trends: {
      dailyAverage: this.calculateDailyAverage(budget.expenses),
      weeklyTrend: this.calculateWeeklyTrend(budget.expenses),
      monthlyTrend: this.groupExpensesByMonth(budget.expenses)
    },
    forecasts: {
      projectedTotal: this.projectTotalExpenses(budget),
      estimatedOverrun: this.estimateOverrun(budget),
      completionDate: this.estimateCompletionDate(budget)
    },
    recommendations: this.generateRecommendations(budget)
  };

  successResponse(res, analytics, 'Budget analytics retrieved successfully');
});

// Helper methods
exports.groupExpensesByMonth = (expenses) => {
  const grouped = {};
  
  expenses.forEach(expense => {
    const monthKey = `${expense.date.getFullYear()}-${String(expense.date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!grouped[monthKey]) {
      grouped[monthKey] = 0;
    }
    
    grouped[monthKey] += expense.amount;
  });

  return Object.entries(grouped).map(([month, amount]) => ({ month, amount }));
};

exports.calculateDailyAverage = (expenses) => {
  if (expenses.length === 0) return 0;
  
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const oldestDate = expenses.reduce((min, e) => e.date < min ? e.date : min, new Date());
  const days = Math.ceil((Date.now() - oldestDate) / (1000 * 60 * 60 * 24)) || 1;
  
  return total / days;
};

exports.calculateWeeklyTrend = (expenses) => {
  const weeks = {};
  
  expenses.forEach(expense => {
    const weekStart = new Date(expense.date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    
    weeks[weekKey] = (weeks[weekKey] || 0) + expense.amount;
  });

  return Object.entries(weeks).map(([week, amount]) => ({ week, amount }));
};

exports.projectTotalExpenses = (budget) => {
  if (budget.expenses.length === 0) return budget.totalExpenses;
  
  const dailyAvg = this.calculateDailyAverage(budget.expenses);
  const daysRemaining = 90; // Estimate, should be calculated from project end date
  
  return budget.totalExpenses + (dailyAvg * daysRemaining);
};

exports.estimateOverrun = (budget) => {
  const projected = this.projectTotalExpenses(budget);
  return Math.max(0, projected - budget.totalBudget);
};

exports.estimateCompletionDate = (budget) => {
  if (budget.remainingBudget <= 0) return new Date();
  
  const dailyAvg = this.calculateDailyAverage(budget.expenses);
  if (dailyAvg === 0) return null;
  
  const daysUntilBudgetExhausted = budget.remainingBudget / dailyAvg;
  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + daysUntilBudgetExhausted);
  
  return completionDate;
};

exports.generateRecommendations = (budget) => {
  const recommendations = [];
  
  if (budget.utilizationPercentage > 90) {
    recommendations.push({
      priority: 'high',
      message: 'Budget utilization is very high. Consider reviewing remaining expenses.'
    });
  }

  if (budget.isBudgetExceeded()) {
    recommendations.push({
      priority: 'critical',
      message: 'Budget has been exceeded. Immediate action required.'
    });
  }

  const dailyAvg = this.calculateDailyAverage(budget.expenses);
  const projected = this.projectTotalExpenses(budget);
  
  if (projected > budget.totalBudget) {
    recommendations.push({
      priority: 'high',
      message: `Projected expenses (${projected.toFixed(2)}) exceed budget. Consider cost optimization.`
    });
  }

  return recommendations;
};

