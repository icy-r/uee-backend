const express = require('express');
const router = express.Router();
const logsController = require('../controllers/logs.controller');

// Log viewer UI
router.get('/', logsController.getLogViewer);

// Get logs as JSON
router.get('/api', logsController.getLogs);

// Clear logs
router.post('/clear', logsController.clearLogs);

module.exports = router;
