const geminiService = require('../services/gemini.service');
const AIPrediction = require('../models/AIPrediction');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Document = require('../models/Document');
const catchAsync = require('../utils/catchAsync');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Estimate materials for a project
 * @route POST /api/ai/estimate-materials
 */
exports.estimateMaterials = catchAsync(async (req, res) => {
  const startTime = Date.now();
  const { projectId, projectType, projectSize, duration, location } = req.body;

  if (!projectType || !projectSize || !duration || !location) {
    return errorResponse(res, 'Missing required fields: projectType, projectSize, duration, location', 400);
  }

  const inputData = { projectType, projectSize, duration, location };
  
  try {
    const result = await geminiService.estimateMaterials(inputData);
    const processingTime = Date.now() - startTime;

    // Save prediction to database
    const prediction = await AIPrediction.create({
      projectId: projectId || null,
      predictionType: 'material_estimation',
      inputData,
      outputData: result,
      confidence: 75, // Default confidence for material estimation
      processingTime,
      status: 'success',
      createdBy: req.user.uid
    });

    successResponse(res, {
      ...result,
      predictionId: prediction._id,
      processingTime
    }, 'Materials estimated successfully', 200);
  } catch (error) {
    // Save failed prediction
    await AIPrediction.create({
      projectId: projectId || null,
      predictionType: 'material_estimation',
      inputData,
      outputData: {},
      status: 'failed',
      errorMessage: error.message,
      createdBy: req.user.uid
    });

    throw error;
  }
});

/**
 * Predict material costs
 * @route POST /api/ai/predict-costs
 */
exports.predictCosts = catchAsync(async (req, res) => {
  const startTime = Date.now();
  const { projectId, materials, location, timeframe } = req.body;

  if (!materials || !Array.isArray(materials) || materials.length === 0) {
    return errorResponse(res, 'Materials array is required', 400);
  }

  if (!location || !timeframe) {
    return errorResponse(res, 'Location and timeframe are required', 400);
  }

  const inputData = { materials, location, timeframe };

  try {
    const result = await geminiService.predictCosts(inputData);
    const processingTime = Date.now() - startTime;

    // Calculate average confidence from predictions
    const avgConfidence = result.predictions?.length > 0
      ? result.predictions.reduce((sum, p) => sum + (p.confidence || 50), 0) / result.predictions.length
      : 50;

    // Save prediction
    const prediction = await AIPrediction.create({
      projectId: projectId || null,
      predictionType: 'cost_prediction',
      inputData,
      outputData: result,
      confidence: avgConfidence,
      processingTime,
      status: 'success',
      createdBy: req.user.uid
    });

    successResponse(res, {
      ...result,
      predictionId: prediction._id,
      processingTime
    }, 'Costs predicted successfully', 200);
  } catch (error) {
    await AIPrediction.create({
      projectId: projectId || null,
      predictionType: 'cost_prediction',
      inputData,
      outputData: {},
      status: 'failed',
      errorMessage: error.message,
      createdBy: req.user.uid
    });

    throw error;
  }
});

/**
 * Predict project completion
 * @route POST /api/ai/predict-completion
 */
exports.predictCompletion = catchAsync(async (req, res) => {
  const startTime = Date.now();
  const { projectId } = req.body;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  // Fetch project data
  const project = await Project.findById(projectId);
  if (!project) {
    return errorResponse(res, 'Project not found', 404);
  }

  // Get task statistics
  const tasks = await Task.find({ projectId });
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const currentProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const inputData = {
    currentProgress,
    tasksCompleted: completedTasks,
    totalTasks,
    teamSize: project.teamMembers?.length || 1,
    weatherImpact: 'moderate',
    startDate: project.startDate,
    expectedEndDate: project.endDate
  };

  try {
    const result = await geminiService.predictProgress(inputData);
    const processingTime = Date.now() - startTime;

    const prediction = await AIPrediction.create({
      projectId,
      predictionType: 'completion_forecast',
      inputData,
      outputData: result,
      confidence: result.confidence || 60,
      processingTime,
      status: 'success',
      createdBy: req.user.uid
    });

    successResponse(res, {
      ...result,
      predictionId: prediction._id,
      currentProgress,
      processingTime
    }, 'Completion date predicted successfully', 200);
  } catch (error) {
    await AIPrediction.create({
      projectId,
      predictionType: 'completion_forecast',
      inputData,
      outputData: {},
      status: 'failed',
      errorMessage: error.message,
      createdBy: req.user.uid
    });

    throw error;
  }
});

/**
 * Extract tasks from document
 * @route POST /api/ai/extract-tasks
 */
exports.extractTasksFromDocument = catchAsync(async (req, res) => {
  const startTime = Date.now();
  const { documentId } = req.body;

  if (!documentId) {
    return errorResponse(res, 'Document ID is required', 400);
  }

  // Fetch document
  const document = await Document.findById(documentId);
  if (!document) {
    return errorResponse(res, 'Document not found', 404);
  }

  const inputData = {
    documentId,
    filename: document.filename,
    type: document.type
  };

  try {
    // Process document (extract text and generate tasks)
    const result = await geminiService.processDocument({
      filePath: document.filePath,
      filename: document.filename,
      isImage: ['image/jpeg', 'image/png', 'image/jpg'].includes(document.mimeType),
      content: document.extractedText || '',
      type: document.type,
      projectId: document.projectId,
      documentId: document._id
    });

    const processingTime = Date.now() - startTime;

    // Update document with extracted text if available
    if (result.extractedText && !document.extractedText) {
      document.extractedText = result.extractedText;
      await document.save();
    }

    const prediction = await AIPrediction.create({
      projectId: document.projectId,
      predictionType: 'task_generation',
      inputData,
      outputData: result,
      confidence: result.success ? 80 : 20,
      processingTime,
      status: result.success ? 'success' : 'failed',
      createdBy: req.user.uid
    });

    successResponse(res, {
      ...result,
      predictionId: prediction._id,
      processingTime
    }, 'Tasks extracted successfully', 200);
  } catch (error) {
    await AIPrediction.create({
      projectId: document.projectId,
      predictionType: 'task_generation',
      inputData,
      outputData: {},
      status: 'failed',
      errorMessage: error.message,
      createdBy: req.user.uid
    });

    throw error;
  }
});

/**
 * Optimize budget allocation
 * @route POST /api/ai/optimize-budget
 */
exports.optimizeBudget = catchAsync(async (req, res) => {
  const startTime = Date.now();
  const { projectId, totalBudget, currentAllocations, expenses, projectPhase } = req.body;

  if (!projectId || !totalBudget || !currentAllocations) {
    return errorResponse(res, 'Missing required fields: projectId, totalBudget, currentAllocations', 400);
  }

  const inputData = {
    totalBudget,
    currentAllocations,
    expenses: expenses || 0,
    projectPhase: projectPhase || 'in_progress'
  };

  try {
    const result = await geminiService.optimizeBudget(inputData);
    const processingTime = Date.now() - startTime;

    const prediction = await AIPrediction.create({
      projectId,
      predictionType: 'budget_optimization',
      inputData,
      outputData: result,
      confidence: 70,
      processingTime,
      status: 'success',
      createdBy: req.user.uid
    });

    successResponse(res, {
      ...result,
      predictionId: prediction._id,
      processingTime
    }, 'Budget optimized successfully', 200);
  } catch (error) {
    await AIPrediction.create({
      projectId,
      predictionType: 'budget_optimization',
      inputData,
      outputData: {},
      status: 'failed',
      errorMessage: error.message,
      createdBy: req.user.uid
    });

    throw error;
  }
});

/**
 * Generic OCR extraction
 * @route POST /api/ai/ocr
 */
exports.performOCR = catchAsync(async (req, res) => {
  const startTime = Date.now();
  const { documentId } = req.body;

  if (!documentId) {
    return errorResponse(res, 'Document ID is required', 400);
  }

  const document = await Document.findById(documentId);
  if (!document) {
    return errorResponse(res, 'Document not found', 404);
  }

  const inputData = {
    documentId,
    filename: document.filename
  };

  try {
    const result = await geminiService.extractTextFromImage({
      filePath: document.filePath,
      filename: document.filename,
      documentId: document._id
    });

    const processingTime = Date.now() - startTime;

    // Update document with extracted text
    if (result.success && result.extractedText) {
      document.extractedText = result.extractedText;
      await document.save();
    }

    const prediction = await AIPrediction.create({
      projectId: document.projectId,
      predictionType: 'ocr_extraction',
      inputData,
      outputData: result,
      confidence: result.confidence ? result.confidence * 100 : 0,
      processingTime,
      status: result.success ? 'success' : 'failed',
      createdBy: req.user.uid
    });

    successResponse(res, {
      ...result,
      predictionId: prediction._id,
      processingTime
    }, 'OCR completed successfully', 200);
  } catch (error) {
    await AIPrediction.create({
      projectId: document.projectId,
      predictionType: 'ocr_extraction',
      inputData,
      outputData: {},
      status: 'failed',
      errorMessage: error.message,
      createdBy: req.user.uid
    });

    throw error;
  }
});

/**
 * Get AI prediction history
 * @route GET /api/ai/predictions
 */
exports.getPredictionHistory = catchAsync(async (req, res) => {
  const { projectId, predictionType, limit = 50 } = req.query;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  const history = await AIPrediction.getPredictionHistory(
    projectId,
    predictionType || null,
    parseInt(limit)
  );

  successResponse(res, {
    predictions: history,
    count: history.length
  }, 'Prediction history retrieved successfully');
});

/**
 * Get AI prediction statistics
 * @route GET /api/ai/stats
 */
exports.getPredictionStats = catchAsync(async (req, res) => {
  const { projectId, startDate } = req.query;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  const stats = await AIPrediction.getPredictionStats(projectId, startDate || null);

  successResponse(res, stats, 'Prediction statistics retrieved successfully');
});

/**
 * Submit feedback on AI prediction
 * @route POST /api/ai/feedback
 */
exports.submitPredictionFeedback = catchAsync(async (req, res) => {
  const { predictionId, rating, comment, wasAccurate } = req.body;

  if (!predictionId || !rating) {
    return errorResponse(res, 'Prediction ID and rating are required', 400);
  }

  const prediction = await AIPrediction.findById(predictionId);
  if (!prediction) {
    return errorResponse(res, 'Prediction not found', 404);
  }

  await prediction.addFeedback({
    rating,
    comment,
    wasAccurate,
    submittedBy: req.user.uid
  });

  successResponse(res, prediction, 'Feedback submitted successfully');
});

