const Project = require('../models/Project');
const catchAsync = require('../utils/catchAsync');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHandler');
const QueryBuilder = require('../utils/queryBuilder');
const queryConfig = require('../config/queryConfig');

/**
 * Create new project
 */
exports.createProject = catchAsync(async (req, res) => {
  const projectData = req.body;

  const project = await Project.create(projectData);

  successResponse(res, project, 'Project created successfully', 201);
});

/**
 * Get all projects with flexible filtering
 */
exports.getProjects = catchAsync(async (req, res) => {
  // Use QueryBuilder for flexible filtering
  const queryBuilder = new QueryBuilder(Project, req.query, queryConfig.projects)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  // Execute query
  const projects = await queryBuilder.build();
  const total = await queryBuilder.countDocuments();

  const paginationMeta = queryBuilder.getPaginationMeta(total);

  paginatedResponse(
    res,
    projects,
    paginationMeta,
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

