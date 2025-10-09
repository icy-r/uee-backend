const Material = require('../models/Material');
const Project = require('../models/Project');
const geminiService = require('../services/gemini.service');
const catchAsync = require('../utils/catchAsync');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHandler');

/**
 * Add new material to inventory
 */
exports.createMaterial = catchAsync(async (req, res) => {
  const { projectId, ...materialData } = req.body;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return errorResponse(res, 'Project not found', 404);
  }

  const material = await Material.create({
    projectId,
    ...materialData
  });

  // Update sustainability score
  await project.calculateSustainabilityScore();

  successResponse(res, material, 'Material added successfully', 201);
});

/**
 * Get all materials for a project
 */
exports.getMaterials = catchAsync(async (req, res) => {
  const { projectId, category, ecoFriendly, page = 1, limit = 50 } = req.query;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  const query = { projectId };
  
  if (category) query.category = category;
  if (ecoFriendly !== undefined) query.ecoFriendly = ecoFriendly === 'true';

  const skip = (page - 1) * limit;
  const total = await Material.countDocuments(query);
  
  const materials = await Material.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Add reorder alerts
  const materialsWithAlerts = materials.map(m => ({
    ...m.toJSON(),
    needsReorder: m.needsReorder()
  }));

  paginatedResponse(
    res,
    materialsWithAlerts,
    { page: parseInt(page), limit: parseInt(limit), total },
    'Materials retrieved successfully'
  );
});

/**
 * Get single material by ID
 */
exports.getMaterialById = catchAsync(async (req, res) => {
  const material = await Material.findById(req.params.id);

  if (!material) {
    return errorResponse(res, 'Material not found', 404);
  }

  successResponse(res, material, 'Material retrieved successfully');
});

/**
 * Update material
 */
exports.updateMaterial = catchAsync(async (req, res) => {
  const material = await Material.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!material) {
    return errorResponse(res, 'Material not found', 404);
  }

  // Update sustainability score
  const project = await Project.findById(material.projectId);
  if (project) {
    await project.calculateSustainabilityScore();
  }

  successResponse(res, material, 'Material updated successfully');
});

/**
 * Delete material
 */
exports.deleteMaterial = catchAsync(async (req, res) => {
  const material = await Material.findByIdAndDelete(req.params.id);

  if (!material) {
    return errorResponse(res, 'Material not found', 404);
  }

  successResponse(res, null, 'Material deleted successfully');
});

/**
 * Log material usage
 */
exports.logUsage = catchAsync(async (req, res) => {
  const { quantity, usedFor, notes } = req.body;
  
  const material = await Material.findById(req.params.id);
  if (!material) {
    return errorResponse(res, 'Material not found', 404);
  }

  // Check if sufficient quantity available
  if (material.currentInventory < quantity) {
    return errorResponse(
      res,
      `Insufficient inventory. Available: ${material.currentInventory} ${material.unit}`,
      400
    );
  }

  material.usageLog.push({
    quantity,
    usedFor,
    notes,
    date: new Date()
  });

  await material.save();

  successResponse(res, material, 'Material usage logged successfully');
});

/**
 * Log material waste
 */
exports.logWaste = catchAsync(async (req, res) => {
  const { quantity, reason, notes } = req.body;
  
  const material = await Material.findById(req.params.id);
  if (!material) {
    return errorResponse(res, 'Material not found', 404);
  }

  material.wasteLog.push({
    quantity,
    reason,
    notes,
    date: new Date()
  });

  await material.save();

  // Update sustainability score
  const project = await Project.findById(material.projectId);
  if (project) {
    await project.calculateSustainabilityScore();
  }

  successResponse(res, material, 'Material waste logged successfully');
});

/**
 * Get AI-based material estimation
 */
exports.estimateMaterials = catchAsync(async (req, res) => {
  const { projectId, projectType, projectSize, duration, location } = req.query;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return errorResponse(res, 'Project not found', 404);
  }

  // Prepare data for AI estimation
  const projectData = {
    projectType: projectType || project.projectType,
    projectSize: projectSize ? JSON.parse(projectSize) : project.projectSize,
    duration: duration || Math.ceil((project.expectedEndDate - project.startDate) / (1000 * 60 * 60 * 24 * 30)),
    location: location || project.location
  };

  const estimation = await geminiService.estimateMaterials(projectData);

  successResponse(res, estimation, 'Material estimation completed successfully');
});

/**
 * Get sustainability metrics and recommendations
 */
exports.getSustainabilityMetrics = catchAsync(async (req, res) => {
  const { projectId } = req.query;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  const materials = await Material.find({ projectId });
  
  if (materials.length === 0) {
    return successResponse(res, {
      score: 0,
      message: 'No materials found for analysis'
    });
  }

  const metrics = {
    totalMaterials: materials.length,
    ecoFriendlyCount: materials.filter(m => m.ecoFriendly).length,
    ecoFriendlyPercentage: Math.round(
      (materials.filter(m => m.ecoFriendly).length / materials.length) * 100
    ),
    totalValue: materials.reduce((sum, m) => sum + m.totalCost, 0),
    totalWaste: materials.reduce((sum, m) => sum + m.totalWaste, 0),
    totalUsage: materials.reduce((sum, m) => sum + m.totalUsage, 0),
    wastePercentage: 0,
    categoryBreakdown: this.getCategoryBreakdown(materials),
    topWastefulMaterials: this.getTopWastefulMaterials(materials, 5)
  };

  if (metrics.totalUsage > 0) {
    metrics.wastePercentage = Math.round((metrics.totalWaste / metrics.totalUsage) * 100);
  }

  // Get AI recommendations
  const sustainabilityData = {
    materials: materials.map(m => ({
      name: m.name,
      quantity: m.quantity,
      unit: m.unit,
      ecoFriendly: m.ecoFriendly
    })),
    wasteGenerated: metrics.totalWaste,
    energyUsage: 'moderate',
    currentScore: metrics.ecoFriendlyPercentage
  };

  const aiAnalysis = await geminiService.analyzeSustainability(sustainabilityData);

  const result = {
    metrics,
    recommendations: aiAnalysis.recommendations || [],
    score: aiAnalysis.score || metrics.ecoFriendlyPercentage
  };

  successResponse(res, result, 'Sustainability metrics retrieved successfully');
});

/**
 * Get material inventory status
 */
exports.getInventoryStatus = catchAsync(async (req, res) => {
  const { projectId } = req.query;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  const materials = await Material.find({ projectId });

  const status = {
    totalMaterials: materials.length,
    totalValue: materials.reduce((sum, m) => sum + m.totalCost, 0),
    lowStock: materials.filter(m => m.needsReorder()).map(m => ({
      id: m._id,
      name: m.name,
      currentInventory: m.currentInventory,
      reorderLevel: m.reorderLevel,
      unit: m.unit
    })),
    byCategory: this.getCategoryBreakdown(materials),
    recentActivity: this.getRecentActivity(materials, 7)
  };

  successResponse(res, status, 'Inventory status retrieved successfully');
});

// Helper methods
exports.getCategoryBreakdown = (materials) => {
  const breakdown = {};
  
  materials.forEach(material => {
    if (!breakdown[material.category]) {
      breakdown[material.category] = {
        count: 0,
        totalValue: 0,
        totalQuantity: 0
      };
    }
    
    breakdown[material.category].count++;
    breakdown[material.category].totalValue += material.totalCost;
    breakdown[material.category].totalQuantity += material.quantity;
  });

  return breakdown;
};

exports.getTopWastefulMaterials = (materials, limit) => {
  return materials
    .map(m => ({
      name: m.name,
      category: m.category,
      totalWaste: m.totalWaste,
      wastePercentage: m.totalUsage > 0 ? (m.totalWaste / m.totalUsage) * 100 : 0,
      unit: m.unit
    }))
    .sort((a, b) => b.totalWaste - a.totalWaste)
    .slice(0, limit);
};

exports.getRecentActivity = (materials, days) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const activity = [];

  materials.forEach(material => {
    material.usageLog
      .filter(log => log.date >= cutoffDate)
      .forEach(log => {
        activity.push({
          type: 'usage',
          material: material.name,
          quantity: log.quantity,
          unit: material.unit,
          date: log.date,
          description: log.usedFor
        });
      });

    material.wasteLog
      .filter(log => log.date >= cutoffDate)
      .forEach(log => {
        activity.push({
          type: 'waste',
          material: material.name,
          quantity: log.quantity,
          unit: material.unit,
          date: log.date,
          description: log.reason
        });
      });
  });

  return activity.sort((a, b) => b.date - a.date);
};

