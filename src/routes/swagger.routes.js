const express = require('express');
const router = express.Router();
const swaggerController = require('../controllers/swagger.controller');

/**
 * @route   GET /api/swagger.json
 * @desc    Download the swagger.json specification file
 * @access  Public
 */
router.get('/swagger.json', swaggerController.downloadSwaggerJson);

module.exports = router;
