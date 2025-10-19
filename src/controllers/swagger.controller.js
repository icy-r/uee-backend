const path = require('path');

/**
 * Download swagger.json file
 * @route   GET /api/swagger.json
 * @desc    Download the swagger.json specification file
 * @access  Public
 */
exports.downloadSwaggerJson = (req, res) => {
  const swaggerPath = path.join(__dirname, '../../swagger.json');
  
  // Set headers for file download
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="swagger.json"');
  
  // Send file
  res.sendFile(swaggerPath, (err) => {
    if (err && !res.headersSent) {
      console.error('Error sending swagger.json:', err);
      res.status(500).json({
        status: 'error',
        message: 'Failed to download swagger.json'
      });
    }
  });
};
