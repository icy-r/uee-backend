const mongoose = require('mongoose');

const extractedTextSchema = new mongoose.Schema({
  content: String,
  extractedAt: {
    type: Date,
    default: Date.now
  },
  confidence: Number,
  method: {
    type: String,
    enum: ['n8n', 'manual', 'gemini-vision', 'tesseract-ocr', 'cloud-vision', 'gemini-ai', 'cloud-vision + gemini-ai']
  }
});

const generatedTaskSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  taskTitle: String,
  generatedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'created', 'failed'],
    default: 'pending'
  }
});

const documentSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  filename: {
    type: String,
    required: [true, 'Filename is required']
  },
  originalName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['plan', 'permit', 'contract', 'invoice', 'report', 'photo', 'other'],
    default: 'other'
  },
  description: String,
  uploadedBy: {
    type: String,
    required: true
  },
  extractedText: extractedTextSchema,
  generatedTasks: [generatedTaskSchema],
  tags: [String],
  isProcessed: {
    type: Boolean,
    default: false
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  processingError: String
}, {
  timestamps: true
});

// Check if document is an image
documentSchema.virtual('isImage').get(function() {
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return imageTypes.includes(this.fileType);
});

// Check if document is a PDF
documentSchema.virtual('isPdf').get(function() {
  return this.fileType === 'application/pdf';
});

// Enable virtuals in JSON
documentSchema.set('toJSON', { virtuals: true });
documentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Document', documentSchema);

