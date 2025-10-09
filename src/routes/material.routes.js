const express = require('express');
const router = express.Router();
const materialController = require('../controllers/material.controller');
const { optionalAuth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// Apply optional authentication to all material routes
router.use(optionalAuth);

/**
 * @route   POST /api/materials
 * @desc    Add new material to inventory
 * @access  Public (MVP)
 */
router.post('/', validate(schemas.createMaterial), materialController.createMaterial);

/**
 * @route   GET /api/materials
 * @desc    Get all materials for a project
 * @query   projectId, category, ecoFriendly, page, limit
 * @access  Public (MVP)
 */
router.get('/', materialController.getMaterials);

/**
 * @route   GET /api/materials/estimation
 * @desc    Get AI-based material estimation
 * @query   projectId, projectType, projectSize, duration, location
 * @access  Public (MVP)
 */
router.get('/estimation', materialController.estimateMaterials);

/**
 * @route   GET /api/materials/sustainability
 * @desc    Get sustainability metrics and recommendations
 * @query   projectId
 * @access  Public (MVP)
 */
router.get('/sustainability', materialController.getSustainabilityMetrics);

/**
 * @route   GET /api/materials/inventory-status
 * @desc    Get material inventory status
 * @query   projectId
 * @access  Public (MVP)
 */
router.get('/inventory-status', materialController.getInventoryStatus);

/**
 * @route   GET /api/materials/:id
 * @desc    Get single material by ID
 * @access  Public (MVP)
 */
router.get('/:id', materialController.getMaterialById);

/**
 * @route   PUT /api/materials/:id
 * @desc    Update material
 * @access  Public (MVP)
 */
router.put('/:id', validate(schemas.updateMaterial), materialController.updateMaterial);

/**
 * @route   DELETE /api/materials/:id
 * @desc    Delete material
 * @access  Public (MVP)
 */
router.delete('/:id', materialController.deleteMaterial);

/**
 * @route   POST /api/materials/:id/usage
 * @desc    Log material usage
 * @access  Public (MVP)
 */
router.post('/:id/usage', validate(schemas.logUsage), materialController.logUsage);

/**
 * @route   POST /api/materials/:id/waste
 * @desc    Log material waste
 * @access  Public (MVP)
 */
router.post('/:id/waste', validate(schemas.logWaste), materialController.logWaste);

module.exports = router;

