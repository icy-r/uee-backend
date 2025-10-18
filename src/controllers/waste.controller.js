const Waste = require('../models/Waste');
const Material = require('../models/Material');
const catchAsync = require('../utils/catchAsync');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Create a new waste record
 * @route POST /api/waste
 */
exports.createWaste = catchAsync(async (req, res) => {
  const {
    projectId,
    materialId,
    quantity,
    unit,
    reason,
    category,
    disposalMethod,
    cost,
    photos,
    date,
    location,
    notes,
    isRecyclable,
    isHazardous
  } = req.body;

  // Verify material exists
  const material = await Material.findById(materialId);
  if (!material) {
    return errorResponse(res, 'Material not found', 404);
  }

  const waste = await Waste.create({
    projectId,
    materialId,
    quantity,
    unit,
    reason,
    category,
    disposalMethod,
    cost: cost || 0,
    photos: photos || [],
    reportedBy: req.user.uid,
    date: date || new Date(),
    location,
    notes,
    isRecyclable: isRecyclable || false,
    isHazardous: isHazardous || false
  });

  await waste.populate('materialId', 'name type');

  successResponse(res, waste, 'Waste record created successfully', 201);
});

/**
 * Get all waste records with filters
 * @route GET /api/waste
 */
exports.getWaste = catchAsync(async (req, res) => {
  const {
    projectId,
    category,
    disposalMethod,
    startDate,
    endDate,
    page = 1,
    limit = 50
  } = req.query;

  const query = {};
  
  if (projectId) query.projectId = projectId;
  if (category) query.category = category;
  if (disposalMethod) query.disposalMethod = disposalMethod;
  
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [waste, total] = await Promise.all([
    Waste.find(query)
      .populate('materialId', 'name type unit')
      .populate('projectId', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Waste.countDocuments(query)
  ]);

  successResponse(res, {
    waste,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    }
  }, 'Waste records retrieved successfully');
});

/**
 * Get waste record by ID
 * @route GET /api/waste/:id
 */
exports.getWasteById = catchAsync(async (req, res) => {
  const waste = await Waste.findById(req.params.id)
    .populate('materialId', 'name type unit costPerUnit')
    .populate('projectId', 'name location');

  if (!waste) {
    return errorResponse(res, 'Waste record not found', 404);
  }

  successResponse(res, waste, 'Waste record retrieved successfully');
});

/**
 * Update waste record
 * @route PUT /api/waste/:id
 */
exports.updateWaste = catchAsync(async (req, res) => {
  const allowedUpdates = [
    'quantity',
    'unit',
    'reason',
    'category',
    'disposalMethod',
    'cost',
    'photos',
    'date',
    'location',
    'notes',
    'isRecyclable',
    'isHazardous'
  ];

  const updates = {};
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  const waste = await Waste.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  ).populate('materialId', 'name type');

  if (!waste) {
    return errorResponse(res, 'Waste record not found', 404);
  }

  successResponse(res, waste, 'Waste record updated successfully');
});

/**
 * Delete waste record
 * @route DELETE /api/waste/:id
 */
exports.deleteWaste = catchAsync(async (req, res) => {
  const waste = await Waste.findByIdAndDelete(req.params.id);

  if (!waste) {
    return errorResponse(res, 'Waste record not found', 404);
  }

  successResponse(res, null, 'Waste record deleted successfully');
});

/**
 * Get waste analytics for a project
 * @route GET /api/waste/analytics
 */
exports.getWasteAnalytics = catchAsync(async (req, res) => {
  const { projectId, startDate, endDate } = req.query;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  const analytics = await Waste.getProjectAnalytics(projectId, startDate, endDate);

  // Get disposal method breakdown
  const disposalBreakdown = await Waste.aggregate([
    {
      $match: {
        projectId: require('mongoose').Types.ObjectId(projectId),
        ...(startDate || endDate ? {
          date: {
            ...(startDate && { $gte: new Date(startDate) }),
            ...(endDate && { $lte: new Date(endDate) })
          }
        } : {})
      }
    },
    {
      $group: {
        _id: '$disposalMethod',
        count: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' }
      }
    }
  ]);

  // Calculate recycling rate
  const recyclableWaste = await Waste.countDocuments({
    projectId,
    isRecyclable: true,
    disposalMethod: { $in: ['recycling', 'reuse'] }
  });

  const totalRecyclable = await Waste.countDocuments({
    projectId,
    isRecyclable: true
  });

  const recyclingRate = totalRecyclable > 0 
    ? ((recyclableWaste / totalRecyclable) * 100).toFixed(2)
    : 0;

  successResponse(res, {
    ...analytics,
    disposalBreakdown,
    recyclingRate: parseFloat(recyclingRate),
    insights: {
      totalRecyclable,
      actuallyRecycled: recyclableWaste,
      missedOpportunities: totalRecyclable - recyclableWaste
    }
  }, 'Waste analytics retrieved successfully');
});

/**
 * Get waste trends over time
 * @route GET /api/waste/trends
 */
exports.getWasteTrends = catchAsync(async (req, res) => {
  const { projectId, groupBy = 'day' } = req.query;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  if (!['day', 'month'].includes(groupBy)) {
    return errorResponse(res, 'groupBy must be "day" or "month"', 400);
  }

  const trends = await Waste.getWasteTrends(projectId, groupBy);

  successResponse(res, {
    trends,
    groupBy
  }, 'Waste trends retrieved successfully');
});

/**
 * Export waste report
 * @route GET /api/waste/export
 */
exports.exportWasteReport = catchAsync(async (req, res) => {
  const { projectId, startDate, endDate, format = 'json' } = req.query;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  const query = { projectId };
  
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const wasteRecords = await Waste.find(query)
    .populate('materialId', 'name type unit')
    .populate('projectId', 'name location')
    .sort({ date: -1 });

  const analytics = await Waste.getProjectAnalytics(projectId, startDate, endDate);

  const report = {
    generatedAt: new Date(),
    projectId,
    dateRange: { startDate, endDate },
    summary: analytics.totals,
    categoryBreakdown: analytics.byCategory,
    records: wasteRecords
  };

  // For MVP, return JSON (PDF generation can be added later)
  if (format === 'json') {
    successResponse(res, report, 'Waste report exported successfully');
  } else {
    errorResponse(res, 'Only JSON format is currently supported', 400);
  }
});

