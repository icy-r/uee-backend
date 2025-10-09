const Document = require('../models/Document');
const Task = require('../models/Task');
const Project = require('../models/Project');
const n8nService = require('../services/n8n.service');
const catchAsync = require('../utils/catchAsync');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHandler');
const path = require('path');
const fs = require('fs');

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

  successResponse(res, document, 'Document uploaded successfully', 201);
});

/**
 * Get all documents for a project
 */
exports.getDocuments = catchAsync(async (req, res) => {
  const { projectId, category, isProcessed, page = 1, limit = 50 } = req.query;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  const query = { projectId };
  
  if (category) query.category = category;
  if (isProcessed !== undefined) query.isProcessed = isProcessed === 'true';

  const skip = (page - 1) * limit;
  const total = await Document.countDocuments(query);
  
  const documents = await Document.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  paginatedResponse(
    res,
    documents,
    { page: parseInt(page), limit: parseInt(limit), total },
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

  successResponse(res, document, 'Document retrieved successfully');
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
 * Extract text from image document using n8n
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
    // Read file and convert to base64
    const fileBuffer = fs.readFileSync(document.filePath);
    const base64Image = fileBuffer.toString('base64');

    // Call n8n service for text extraction
    const result = await n8nService.extractTextFromImage({
      base64: base64Image,
      filename: document.filename,
      documentId: document._id
    });

    if (result.success) {
      document.extractedText = {
        content: result.extractedText,
        confidence: result.confidence,
        method: 'n8n',
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
        confidence: result.confidence
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
 * Generate tasks from document using n8n
 */
exports.generateTasks = catchAsync(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    return errorResponse(res, 'Document not found', 404);
  }

  // If no text extracted yet, extract it first
  let content = document.extractedText?.content;

  if (!content && document.isImage) {
    const fileBuffer = fs.readFileSync(document.filePath);
    const base64Image = fileBuffer.toString('base64');

    const extractResult = await n8nService.extractTextFromImage({
      base64: base64Image,
      filename: document.filename,
      documentId: document._id
    });

    if (extractResult.success) {
      content = extractResult.extractedText;
      document.extractedText = {
        content: extractResult.extractedText,
        confidence: extractResult.confidence,
        method: 'n8n',
        extractedAt: new Date()
      };
    }
  }

  if (!content) {
    return errorResponse(res, 'No content available for task generation', 400);
  }

  // Generate tasks using n8n
  const result = await n8nService.generateTasksFromDocument({
    content,
    type: document.category,
    projectId: document.projectId,
    documentId: document._id
  });

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
 * Process document (extract text and generate tasks)
 */
exports.processDocument = catchAsync(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    return errorResponse(res, 'Document not found', 404);
  }

  document.processingStatus = 'processing';
  await document.save();

  try {
    // Read file
    const fileBuffer = fs.readFileSync(document.filePath);
    const base64Image = document.isImage ? fileBuffer.toString('base64') : null;

    // Process document using n8n
    const result = await n8nService.processDocument({
      url: base64Image ? `data:${document.fileType};base64,${base64Image}` : null,
      filename: document.filename,
      isImage: document.isImage,
      type: document.category,
      projectId: document.projectId,
      documentId: document._id
    });

    // Update extracted text
    if (result.extractedText) {
      document.extractedText = {
        content: result.extractedText,
        confidence: 0.85,
        method: 'n8n',
        extractedAt: new Date()
      };
    }

    // Create tasks
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
        tasks: createdTasks
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

