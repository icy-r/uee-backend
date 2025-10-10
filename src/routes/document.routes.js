const express = require('express');
const router = express.Router();
const documentController = require('../controllers/document.controller');
const { optionalAuth } = require('../middleware/auth');
const { queryParsers } = require('../middleware/queryParser');
const upload = require('../utils/fileUpload');

// Apply optional authentication to all document routes
router.use(optionalAuth);

/**
 * @route   POST /api/documents/upload
 * @desc    Upload document
 * @access  Public (MVP)
 */
router.post('/upload', upload.single('document'), documentController.uploadDocument);

/**
 * @route   GET /api/documents
 * @desc    Get all documents for a project with flexible filtering
 * @query   projectId, any field with operators [eq, ne, gt, gte, lt, lte, contains, in, nin], sort, select, page, limit
 * @access  Public (MVP)
 */
router.get('/', queryParsers.documents, documentController.getDocuments);

/**
 * @route   GET /api/documents/statistics
 * @desc    Get document statistics
 * @query   projectId
 * @access  Public (MVP)
 */
router.get('/statistics', documentController.getDocumentStatistics);

/**
 * @route   GET /api/documents/:id
 * @desc    Get single document by ID
 * @access  Public (MVP)
 */
router.get('/:id', documentController.getDocumentById);

/**
 * @route   PUT /api/documents/:id
 * @desc    Update document metadata
 * @access  Public (MVP)
 */
router.put('/:id', documentController.updateDocument);

/**
 * @route   DELETE /api/documents/:id
 * @desc    Delete document
 * @access  Public (MVP)
 */
router.delete('/:id', documentController.deleteDocument);

/**
 * @route   GET /api/documents/:id/download
 * @desc    Download document
 * @access  Public (MVP)
 */
router.get('/:id/download', documentController.downloadDocument);

/**
 * @route   POST /api/documents/:id/extract-text
 * @desc    Extract text from image using n8n
 * @access  Public (MVP)
 */
router.post('/:id/extract-text', documentController.extractText);

/**
 * @route   POST /api/documents/:id/generate-tasks
 * @desc    Generate tasks from document using n8n
 * @access  Public (MVP)
 */
router.post('/:id/generate-tasks', documentController.generateTasks);

/**
 * @route   POST /api/documents/:id/process
 * @desc    Process document (extract text and generate tasks)
 * @access  Public (MVP)
 */
router.post('/:id/process', documentController.processDocument);

module.exports = router;

