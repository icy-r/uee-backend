const Project = require('../models/Project');
const catchAsync = require('../utils/catchAsync');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHandler');

/**
 * Create new project
 */
exports.createProject = catchAsync(async (req, res) => {
  const projectData = req.body;

  const project = await Project.create(projectData);

  successResponse(res, project, 'Project created successfully', 201);
});

/**
 * Get all projects
 */
exports.getProjects = catchAsync(async (req, res) => {
  const { page = 1, limit = 50, status, projectType } = req.query;

  const query = {};
  
  if (status) query.status = status;
  if (projectType) query.projectType = projectType;

  const skip = (page - 1) * limit;
  const total = await Project.countDocuments(query);
  
  const projects = await Project.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  paginatedResponse(
    res,
    projects,
    { page: parseInt(page), limit: parseInt(limit), total },
    'Projects retrieved successfully'
  );
});

/**
 * Get single project by ID
 */
exports.getProjectById = catchAsync(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return errorResponse(res, 'Project not found', 404);
  }

  successResponse(res, project, 'Project retrieved successfully');
});

/**
 * Update project
 */
exports.updateProject = catchAsync(async (req, res) => {
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!project) {
    return errorResponse(res, 'Project not found', 404);
  }

  successResponse(res, project, 'Project updated successfully');
});

/**
 * Delete project
 */
exports.deleteProject = catchAsync(async (req, res) => {
  const project = await Project.findByIdAndDelete(req.params.id);

  if (!project) {
    return errorResponse(res, 'Project not found', 404);
  }

  successResponse(res, null, 'Project deleted successfully');
});

/**
 * Calculate and update project progress
 */
exports.updateProgress = catchAsync(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return errorResponse(res, 'Project not found', 404);
  }

  await project.calculateProgress();

  successResponse(res, project, 'Project progress updated successfully');
});

/**
 * Calculate and update sustainability score
 */
exports.updateSustainabilityScore = catchAsync(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return errorResponse(res, 'Project not found', 404);
  }

  await project.calculateSustainabilityScore();

  successResponse(res, project, 'Sustainability score updated successfully');
});

