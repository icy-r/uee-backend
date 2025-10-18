const Project = require('../models/Project');
const Task = require('../models/Task');
const Material = require('../models/Material');
const Waste = require('../models/Waste');
const Budget = require('../models/Budget');
const AnalyticsCache = require('../models/AnalyticsCache');
const mongoose = require('mongoose');

/**
 * Get progress analytics for a project (with caching)
 * @param {String} projectId - Project ID
 * @param {Object} options - Date range and filters
 * @returns {Object} Progress analytics data
 */
exports.getProgressAnalytics = async (projectId, options = {}) => {
  const { startDate, endDate, useCache = true } = options;

  // Check cache if enabled
  if (useCache) {
    const cached = await AnalyticsCache.getCached(projectId, 'progress', { startDate, endDate });
    if (cached) {
      console.log(`✅ Using cached progress analytics for project ${projectId}`);
      return cached.data;
    }
  }

  // Build date filter
  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);

  // Get project
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  // Get all tasks
  const taskQuery = { projectId: mongoose.Types.ObjectId(projectId) };
  if (Object.keys(dateFilter).length > 0) {
    taskQuery.createdAt = dateFilter;
  }

  const tasks = await Task.find(taskQuery);

  // Task statistics by status
  const tasksByStatus = await Task.aggregate([
    { $match: taskQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalHours: { $sum: '$estimatedHours' }
      }
    }
  ]);

  // Task statistics by priority
  const tasksByPriority = await Task.aggregate([
    { $match: taskQuery },
    {
      $group: {
        _id: '$priority',
        count: { $sum: 1 }
      }
    }
  ]);

  // Calculate completion rate
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Calculate velocity (tasks completed per week)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentCompletedTasks = await Task.countDocuments({
    projectId,
    status: 'completed',
    updatedAt: { $gte: thirtyDaysAgo }
  });

  const velocity = (recentCompletedTasks / 30) * 7; // Tasks per week

  // Get tasks completed over time (for burndown chart)
  const tasksOverTime = await Task.aggregate([
    {
      $match: {
        projectId: mongoose.Types.ObjectId(projectId),
        status: 'completed'
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  // Calculate estimated completion date
  const remainingTasks = totalTasks - completedTasks;
  const daysToCompletion = velocity > 0 ? (remainingTasks / velocity) * 7 : null;
  
  let estimatedCompletionDate = null;
  if (daysToCompletion) {
    estimatedCompletionDate = new Date();
    estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + Math.ceil(daysToCompletion));
  }

  // Get overdue tasks
  const overdueTasks = await Task.countDocuments({
    projectId,
    status: { $ne: 'completed' },
    deadline: { $lt: new Date() }
  });

  const result = {
    summary: {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      completionRate: parseFloat(completionRate.toFixed(2)),
      overdueTasks,
      velocity: parseFloat(velocity.toFixed(2))
    },
    tasksByStatus,
    tasksByPriority,
    tasksOverTime,
    estimatedCompletionDate,
    daysToCompletion: daysToCompletion ? Math.ceil(daysToCompletion) : null
  };

  // Cache the result
  if (options.useCache !== false) {
    await AnalyticsCache.setCache(projectId, 'progress', result, 15, { startDate, endDate });
  }

  return result;
};

/**
 * Get material analytics for a project
 * @param {String} projectId - Project ID
 * @param {Object} options - Date range and filters
 * @returns {Object} Material analytics data
 */
exports.getMaterialAnalytics = async (projectId, options = {}) => {
  const { startDate, endDate } = options;

  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);

  // Get all materials
  const materialQuery = { projectId: mongoose.Types.ObjectId(projectId) };

  const materials = await Material.find(materialQuery);

  // Calculate total material value
  const totalValue = materials.reduce((sum, m) => {
    return sum + (m.quantity * (m.costPerUnit || 0));
  }, 0);

  // Materials by type
  const materialsByType = await Material.aggregate([
    { $match: materialQuery },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        totalValue: {
          $sum: { $multiply: ['$quantity', '$costPerUnit'] }
        }
      }
    },
    {
      $sort: { totalValue: -1 }
    }
  ]);

  // Get waste data
  const wasteRecords = await Waste.find({ projectId });
  const totalWaste = wasteRecords.reduce((sum, w) => sum + w.quantity, 0);
  const totalMaterialQuantity = materials.reduce((sum, m) => sum + m.quantity, 0);
  const wasteRatio = totalMaterialQuantity > 0 
    ? (totalWaste / totalMaterialQuantity) * 100 
    : 0;

  // Materials usage over time
  const usageOverTime = await Material.aggregate([
    { $match: materialQuery },
    {
      $unwind: { path: '$usageLogs', preserveNullAndEmptyArrays: true }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$usageLogs.date' }
        },
        totalUsed: { $sum: '$usageLogs.quantityUsed' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  // Low stock materials
  const lowStockMaterials = materials.filter(m => {
    const usedQuantity = m.usageLogs?.reduce((sum, log) => sum + log.quantityUsed, 0) || 0;
    const remaining = m.quantity - usedQuantity;
    const threshold = m.quantity * 0.2; // 20% threshold
    return remaining < threshold;
  });

  // Cost breakdown
  const costBreakdown = await Material.aggregate([
    { $match: materialQuery },
    {
      $project: {
        type: 1,
        cost: { $multiply: ['$quantity', '$costPerUnit'] }
      }
    },
    {
      $group: {
        _id: '$type',
        totalCost: { $sum: '$cost' }
      }
    },
    {
      $sort: { totalCost: -1 }
    }
  ]);

  return {
    summary: {
      totalMaterials: materials.length,
      totalValue: parseFloat(totalValue.toFixed(2)),
      totalWaste: parseFloat(totalWaste.toFixed(2)),
      wasteRatio: parseFloat(wasteRatio.toFixed(2)),
      lowStockCount: lowStockMaterials.length
    },
    materialsByType,
    costBreakdown,
    usageOverTime,
    lowStockMaterials: lowStockMaterials.map(m => ({
      _id: m._id,
      name: m.name,
      type: m.type,
      quantity: m.quantity,
      unit: m.unit
    }))
  };
};

/**
 * Get budget analytics for a project
 * @param {String} projectId - Project ID
 * @returns {Object} Budget analytics data
 */
exports.getBudgetAnalytics = async (projectId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  // Get budget records
  const budgets = await Budget.find({ projectId });

  // Calculate totals
  const totalBudget = project.budget || 0;
  const totalAllocated = budgets.reduce((sum, b) => sum + b.allocatedAmount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
  const remaining = totalBudget - totalSpent;
  const utilizationRate = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Budget by category
  const budgetByCategory = await Budget.aggregate([
    { $match: { projectId: mongoose.Types.ObjectId(projectId) } },
    {
      $group: {
        _id: '$category',
        allocated: { $sum: '$allocatedAmount' },
        spent: { $sum: '$spentAmount' },
        remaining: { $sum: { $subtract: ['$allocatedAmount', '$spentAmount'] } }
      }
    },
    {
      $sort: { spent: -1 }
    }
  ]);

  // Spending over time
  const spendingOverTime = await Budget.aggregate([
    { $match: { projectId: mongoose.Types.ObjectId(projectId) } },
    {
      $unwind: { path: '$expenses', preserveNullAndEmptyArrays: true }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$expenses.date' }
        },
        totalSpent: { $sum: '$expenses.amount' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  // Calculate variance
  const variance = totalAllocated - totalSpent;
  const variancePercentage = totalAllocated > 0 
    ? ((variance / totalAllocated) * 100) 
    : 0;

  // Budget health status
  let healthStatus = 'healthy';
  if (utilizationRate > 95) {
    healthStatus = 'critical';
  } else if (utilizationRate > 85) {
    healthStatus = 'warning';
  } else if (utilizationRate > 70) {
    healthStatus = 'caution';
  }

  // Categories over budget
  const categoriesOverBudget = budgetByCategory.filter(
    cat => cat.spent > cat.allocated
  );

  // Forecast based on current burn rate
  const projectDuration = project.endDate 
    ? Math.ceil((new Date(project.endDate) - new Date(project.startDate)) / (1000 * 60 * 60 * 24))
    : 180; // Default 180 days
  
  const elapsedDays = Math.ceil((new Date() - new Date(project.startDate)) / (1000 * 60 * 60 * 24));
  const dailyBurnRate = elapsedDays > 0 ? totalSpent / elapsedDays : 0;
  const remainingDays = Math.max(0, projectDuration - elapsedDays);
  const projectedTotalSpend = totalSpent + (dailyBurnRate * remainingDays);
  const budgetOverrunRisk = projectedTotalSpend > totalBudget;

  return {
    summary: {
      totalBudget,
      totalAllocated,
      totalSpent: parseFloat(totalSpent.toFixed(2)),
      remaining: parseFloat(remaining.toFixed(2)),
      utilizationRate: parseFloat(utilizationRate.toFixed(2)),
      variance: parseFloat(variance.toFixed(2)),
      variancePercentage: parseFloat(variancePercentage.toFixed(2)),
      healthStatus
    },
    budgetByCategory,
    spendingOverTime,
    categoriesOverBudget,
    forecast: {
      dailyBurnRate: parseFloat(dailyBurnRate.toFixed(2)),
      projectedTotalSpend: parseFloat(projectedTotalSpend.toFixed(2)),
      budgetOverrunRisk,
      estimatedOverrun: budgetOverrunRisk 
        ? parseFloat((projectedTotalSpend - totalBudget).toFixed(2))
        : 0
    }
  };
};

/**
 * Get team productivity analytics
 * @param {String} projectId - Project ID
 * @returns {Object} Team analytics data
 */
exports.getTeamAnalytics = async (projectId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  // Tasks by assignee
  const tasksByAssignee = await Task.aggregate([
    { $match: { projectId: mongoose.Types.ObjectId(projectId) } },
    {
      $group: {
        _id: '$assignedTo',
        totalTasks: { $sum: 1 },
        completedTasks: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        inProgressTasks: {
          $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
        },
        pendingTasks: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        totalHours: { $sum: '$estimatedHours' }
      }
    }
  ]);

  // Calculate completion rates for each team member
  const teamPerformance = tasksByAssignee.map(member => ({
    ...member,
    completionRate: member.totalTasks > 0 
      ? parseFloat(((member.completedTasks / member.totalTasks) * 100).toFixed(2))
      : 0
  }));

  // Time logs analysis (if available in tasks)
  const timeLogged = await Task.aggregate([
    { $match: { projectId: mongoose.Types.ObjectId(projectId) } },
    {
      $unwind: { path: '$timeLogs', preserveNullAndEmptyArrays: true }
    },
    {
      $group: {
        _id: '$assignedTo',
        totalHoursLogged: { $sum: '$timeLogs.hours' }
      }
    }
  ]);

  // Team size
  const teamSize = project.teamMembers?.length || tasksByAssignee.length;

  // Average tasks per team member
  const avgTasksPerMember = teamSize > 0 
    ? tasksByAssignee.reduce((sum, m) => sum + m.totalTasks, 0) / teamSize
    : 0;

  return {
    summary: {
      teamSize,
      avgTasksPerMember: parseFloat(avgTasksPerMember.toFixed(2)),
      totalTasksAssigned: tasksByAssignee.reduce((sum, m) => sum + m.totalTasks, 0)
    },
    teamPerformance,
    timeLogged
  };
};

/**
 * Get comprehensive project analytics
 * @param {String} projectId - Project ID
 * @returns {Object} All analytics combined
 */
exports.getComprehensiveAnalytics = async (projectId) => {
  const [progress, materials, budget, team] = await Promise.all([
    this.getProgressAnalytics(projectId),
    this.getMaterialAnalytics(projectId),
    this.getBudgetAnalytics(projectId),
    this.getTeamAnalytics(projectId)
  ]);

  return {
    progress,
    materials,
    budget,
    team,
    generatedAt: new Date()
  };
};

