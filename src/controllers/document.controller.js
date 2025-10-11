const Document = require('../models/Document');
const Task = require('../models/Task');
const Project = require('../models/Project');
const geminiService = require('../services/gemini.service');
const cloudVisionService = require('../services/cloudvision.service');
// const n8nService = require('../services/n8n.service'); // DEPRECATED: Replaced with Gemini AI
const catchAsync = require('../utils/catchAsync');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHandler');
const QueryBuilder = require('../utils/queryBuilder');
const queryConfig = require('../config/queryConfig');
const path = require('path');
const fs = require('fs');

/**
 * Helper function to add preview URLs to document object
 */
const addPreviewUrls = (document, req) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const docObj = document.toJSON ? document.toJSON() : document;
  
  return {
    ...docObj,
    staticUrl: `${baseUrl}/uploads/${document.projectId}/${document.filename}`,
    previewUrl: `${baseUrl}/api/documents/${document._id}/preview`
  };
};

/**
 * Upload document
 */
exports.uploadDocument = catchAsync(async (req, res) => {
  const { projectId, category, description, tags } = req.body;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  if (!req.file) {
    return errorResponse(res, 'No file uploaded', 400);
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return errorResponse(res, 'Project not found', 404);
  }

  const document = await Document.create({
    projectId,
    filename: req.file.filename,
    originalName: req.file.originalname,
    fileType: req.file.mimetype,
    fileSize: req.file.size,
    filePath: req.file.path,
    category: category || 'other',
    description,
    tags: tags ? JSON.parse(tags) : [],
    uploadedBy: req.user?.uid || 'anonymous'
  });

  const documentWithUrls = addPreviewUrls(document, req);
  successResponse(res, documentWithUrls, 'Document uploaded successfully', 201);
});

/**
 * Get all documents for a project with flexible filtering
 */
exports.getDocuments = catchAsync(async (req, res) => {
  const { projectId } = req.query;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  // Use QueryBuilder for flexible filtering
  const queryBuilder = new QueryBuilder(Document, req.query, queryConfig.documents)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  // Execute query
  const documents = await queryBuilder.build();
  const total = await queryBuilder.countDocuments();

  const paginationMeta = queryBuilder.getPaginationMeta(total);

  // Add preview URLs to all documents
  const documentsWithUrls = documents.map(doc => addPreviewUrls(doc, req));

  paginatedResponse(
    res,
    documentsWithUrls,
    paginationMeta,
    'Documents retrieved successfully'
  );
});

/**
 * Get single document by ID
 */
exports.getDocumentById = catchAsync(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    return errorResponse(res, 'Document not found', 404);
  }

  const documentWithUrls = addPreviewUrls(document, req);
  successResponse(res, documentWithUrls, 'Document retrieved successfully');
});

/**
 * Update document metadata
 */
exports.updateDocument = catchAsync(async (req, res) => {
  const { category, description, tags } = req.body;

  const document = await Document.findByIdAndUpdate(
    req.params.id,
    { category, description, tags },
    { new: true, runValidators: true }
  );

  if (!document) {
    return errorResponse(res, 'Document not found', 404);
  }

  successResponse(res, document, 'Document updated successfully');
});

/**
 * Delete document
 */
exports.deleteDocument = catchAsync(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    return errorResponse(res, 'Document not found', 404);
  }

  // Delete physical file
  if (fs.existsSync(document.filePath)) {
    fs.unlinkSync(document.filePath);
  }

  await document.deleteOne();

  successResponse(res, null, 'Document deleted successfully');
});

/**
 * Download document
 */
exports.downloadDocument = catchAsync(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    return errorResponse(res, 'Document not found', 404);
  }

  if (!fs.existsSync(document.filePath)) {
    return errorResponse(res, 'File not found on server', 404);
  }

  res.download(document.filePath, document.originalName);
});

/**
 * Preview document
 * Displays images and PDFs inline in browser, downloads others
 */
exports.previewDocument = catchAsync(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    return errorResponse(res, 'Document not found', 404);
  }

  if (!fs.existsSync(document.filePath)) {
    return errorResponse(res, 'File not found on server', 404);
  }

  // Determine content disposition based on file type
  const isImage = document.fileType.startsWith('image/');
  const isPdf = document.fileType === 'application/pdf';
  const disposition = (isImage || isPdf) ? 'inline' : 'attachment';

  // Set appropriate headers
  res.setHeader('Content-Type', document.fileType);
  res.setHeader('Content-Disposition', `${disposition}; filename="${document.originalName}"`);

  // Stream the file
  const fileStream = fs.createReadStream(document.filePath);
  fileStream.pipe(res);
});

/**
 * Extract text from image document using Gemini Vision AI
 * Falls back to Cloud Vision API if Gemini fails
 */
exports.extractText = catchAsync(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    return errorResponse(res, 'Document not found', 404);
  }

  if (!document.isImage) {
    return errorResponse(res, 'Text extraction is only available for images', 400);
  }

  // Update processing status
  document.processingStatus = 'processing';
  await document.save();

  try {
    // Try Gemini Vision first
    let result = await geminiService.extractTextFromImage({
      filePath: document.filePath,
      filename: document.filename,
      documentId: document._id
    });

    // Fallback to Cloud Vision if Gemini fails
    if (!result.success && result.fallbackNeeded && cloudVisionService.isAvailable()) {
      console.log('⚠️  Gemini extraction failed, trying Cloud Vision fallback...');
      result = await cloudVisionService.extractTextFromImage({
        filePath: document.filePath,
        filename: document.filename,
        documentId: document._id
      });
    }

    if (result.success) {
      document.extractedText = {
        content: result.extractedText,
        confidence: result.confidence,
        method: result.method,
        extractedAt: new Date()
      };
      document.isProcessed = true;
      document.processingStatus = 'completed';
    } else {
      document.processingStatus = 'failed';
      document.processingError = result.error;
    }

    await document.save();

    successResponse(
      res,
      {
        document,
        extractedText: result.extractedText,
        confidence: result.confidence,
        method: result.method
      },
      result.success ? 'Text extracted successfully' : 'Text extraction failed'
    );
  } catch (error) {
    document.processingStatus = 'failed';
    document.processingError = error.message;
    await document.save();

    throw error;
  }
});

/**
 * Generate tasks from document using Gemini AI
 */
exports.generateTasks = catchAsync(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    return errorResponse(res, 'Document not found', 404);
  }

  // If no text extracted yet, extract it first
  let content = document.extractedText?.content;

  if (!content && document.isImage) {
    // Try Gemini Vision first
    let extractResult = await geminiService.extractTextFromImage({
      filePath: document.filePath,
      filename: document.filename,
      documentId: document._id
    });

    // Fallback to Cloud Vision if needed
    if (!extractResult.success && extractResult.fallbackNeeded && cloudVisionService.isAvailable()) {
      console.log('⚠️  Gemini extraction failed, trying Cloud Vision fallback...');
      extractResult = await cloudVisionService.extractTextFromImage({
        filePath: document.filePath,
        filename: document.filename,
        documentId: document._id
      });
    }

    if (extractResult.success) {
      content = extractResult.extractedText;
      document.extractedText = {
        content: extractResult.extractedText,
        confidence: extractResult.confidence,
        method: extractResult.method,
        extractedAt: new Date()
      };
    }
  }

  if (!content) {
    return errorResponse(res, 'No content available for task generation', 400);
  }

  // Generate tasks using Gemini AI
  const result = await geminiService.generateTasksFromText(
    content,
    document.category,
    document.projectId
  );

  if (!result.success || result.tasks.length === 0) {
    return successResponse(
      res,
      { document, tasks: [] },
      'No tasks could be generated from this document'
    );
  }

  // Create tasks in database
  const createdTasks = [];
  
  for (const taskData of result.tasks) {
    try {
      const task = await Task.create({
        projectId: document.projectId,
        title: taskData.title,
        description: taskData.description || `Generated from document: ${document.originalName}`,
        priority: taskData.priority || 'medium',
        deadline: taskData.deadline,
        assignedTo: [],
        assignedBy: 'system',
        status: 'not_started'
      });

      createdTasks.push(task);

      // Add to document's generated tasks
      document.generatedTasks.push({
        taskId: task._id,
        taskTitle: task.title,
        status: 'created'
      });
    } catch (error) {
      console.error('Error creating task:', error);
      document.generatedTasks.push({
        taskTitle: taskData.title,
        status: 'failed'
      });
    }
  }

  document.isProcessed = true;
  await document.save();

  // Update project progress
  const project = await Project.findById(document.projectId);
  if (project) {
    await project.calculateProgress();
  }

  successResponse(
    res,
    {
      document,
      tasks: createdTasks,
      summary: {
        total: result.tasks.length,
        created: createdTasks.length,
        failed: result.tasks.length - createdTasks.length
      }
    },
    `Successfully generated ${createdTasks.length} tasks from document`
  );
});

/**
 * Process document (extract text and generate tasks) using Gemini AI
 * Falls back to Cloud Vision API if Gemini fails
 */
exports.processDocument = catchAsync(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    return errorResponse(res, 'Document not found', 404);
  }

  document.processingStatus = 'processing';
  await document.save();

  try {
    // Process document using Gemini AI
    let result = await geminiService.processDocument({
      filePath: document.filePath,
      filename: document.filename,
      isImage: document.isImage,
      content: document.extractedText?.content,
      type: document.category,
      projectId: document.projectId,
      documentId: document._id
    });

    // If Gemini extraction failed and fallback is needed, try Cloud Vision
    if (result.fallbackNeeded && cloudVisionService.isAvailable()) {
      console.log('⚠️  Gemini extraction failed, trying Cloud Vision fallback...');
      
      const extractResult = await cloudVisionService.extractTextFromImage({
        filePath: document.filePath,
        filename: document.filename,
        documentId: document._id
      });

      if (extractResult.success) {
        // Re-process with extracted text from Cloud Vision
        const taskResult = await geminiService.generateTasksFromText(
          extractResult.extractedText,
          document.category,
          document.projectId
        );

        result = {
          success: true,
          extractedText: extractResult.extractedText,
          tasks: taskResult.success ? taskResult.tasks : [],
          method: 'cloud-vision + gemini-ai'
        };
      }
    }

    // Update extracted text
    if (result.extractedText) {
      document.extractedText = {
        content: result.extractedText,
        confidence: 0.9,
        method: result.method || 'gemini-ai',
        extractedAt: new Date()
      };
    }

    // Create tasks
    const createdTasks = [];
    
    for (const taskData of result.tasks || []) {
      try {
        const task = await Task.create({
          projectId: document.projectId,
          title: taskData.title,
          description: taskData.description || `Generated from document: ${document.originalName}`,
          priority: taskData.priority || 'medium',
          deadline: taskData.deadline,
          assignedTo: [],
          assignedBy: 'system',
          status: 'not_started'
        });

        createdTasks.push(task);

        document.generatedTasks.push({
          taskId: task._id,
          taskTitle: task.title,
          status: 'created'
        });
      } catch (error) {
        console.error('Error creating task:', error);
      }
    }

    document.isProcessed = true;
    document.processingStatus = 'completed';
    await document.save();

    successResponse(
      res,
      {
        document,
        extractedText: result.extractedText,
        tasks: createdTasks,
        method: result.method
      },
      'Document processed successfully'
    );
  } catch (error) {
    document.processingStatus = 'failed';
    document.processingError = error.message;
    await document.save();

    throw error;
  }
});

/**
 * Get document statistics
 */
exports.getDocumentStatistics = catchAsync(async (req, res) => {
  const { projectId } = req.query;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  const documents = await Document.find({ projectId });

  const statistics = {
    total: documents.length,
    byCategory: this.groupByCategory(documents),
    byType: this.groupByType(documents),
    processed: documents.filter(d => d.isProcessed).length,
    pending: documents.filter(d => !d.isProcessed).length,
    totalSize: documents.reduce((sum, d) => sum + d.fileSize, 0),
    tasksGenerated: documents.reduce((sum, d) => sum + d.generatedTasks.length, 0),
    recentUploads: documents
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map(d => ({
        id: d._id,
        name: d.originalName,
        category: d.category,
        uploadedAt: d.createdAt
      }))
  };

  successResponse(res, statistics, 'Document statistics retrieved successfully');
});

// Helper methods
exports.groupByCategory = (documents) => {
  const grouped = {};
  
  documents.forEach(doc => {
    grouped[doc.category] = (grouped[doc.category] || 0) + 1;
  });

  return grouped;
};

exports.groupByType = (documents) => {
  const grouped = {};
  
  documents.forEach(doc => {
    const type = doc.fileType.split('/')[0]; // e.g., 'image', 'application'
    grouped[type] = (grouped[type] || 0) + 1;
  });

  return grouped;
};

