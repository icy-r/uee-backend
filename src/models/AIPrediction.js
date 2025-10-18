const mongoose = require('mongoose');

const aiPredictionSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required'],
    index: true
  },
  predictionType: {
    type: String,
    required: [true, 'Prediction type is required'],
    enum: [
      'material_estimation',
      'cost_prediction',
      'completion_forecast',
      'budget_optimization',
      'task_generation',
      'ocr_extraction',
      'sustainability_recommendation',
      'risk_assessment'
    ],
    index: true
  },
  inputData: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Input data is required']
  },
  outputData: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Output data is required']
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  modelVersion: {
    type: String,
    default: 'gemini-1.5-flash'
  },
  processingTime: {
    type: Number, // milliseconds
    default: null
  },
  status: {
    type: String,
    enum: ['success', 'partial', 'failed'],
    default: 'success'
  },
  errorMessage: {
    type: String,
    default: null
  },
  createdBy: {
    type: String,
    required: [true, 'Creator ID is required']
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    wasAccurate: Boolean,
    submittedAt: Date,
    submittedBy: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
aiPredictionSchema.index({ projectId: 1, predictionType: 1, createdAt: -1 });
aiPredictionSchema.index({ createdBy: 1, createdAt: -1 });
aiPredictionSchema.index({ status: 1 });

// Virtual for calculating accuracy (based on feedback)
aiPredictionSchema.virtual('accuracy').get(function() {
  if (this.feedback && this.feedback.rating) {
    return (this.feedback.rating / 5) * 100;
  }
  return null;
});

// Instance method to add feedback
aiPredictionSchema.methods.addFeedback = function(feedback) {
  this.feedback = {
    rating: feedback.rating,
    comment: feedback.comment || '',
    wasAccurate: feedback.wasAccurate !== undefined ? feedback.wasAccurate : null,
    submittedAt: new Date(),
    submittedBy: feedback.submittedBy
  };
  return this.save();
};

// Static method to get prediction history
aiPredictionSchema.statics.getPredictionHistory = async function(projectId, predictionType = null, limit = 50) {
  const query = { projectId };
  
  if (predictionType) {
    query.predictionType = predictionType;
  }

  return await this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-inputData') // Exclude large input data for list view
    .lean();
};

// Static method to get prediction statistics
aiPredictionSchema.statics.getPredictionStats = async function(projectId, startDate = null) {
  const match = { projectId: mongoose.Types.ObjectId(projectId) };
  
  if (startDate) {
    match.createdAt = { $gte: new Date(startDate) };
  }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$predictionType',
        count: { $sum: 1 },
        successCount: {
          $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
        },
        avgConfidence: { $avg: '$confidence' },
        avgProcessingTime: { $avg: '$processingTime' },
        avgRating: { $avg: '$feedback.rating' }
      }
    }
  ]);

  const totalStats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalPredictions: { $sum: 1 },
        successfulPredictions: {
          $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
        },
        avgConfidence: { $avg: '$confidence' },
        avgProcessingTime: { $avg: '$processingTime' }
      }
    }
  ]);

  return {
    byType: stats,
    overall: totalStats[0] || {
      totalPredictions: 0,
      successfulPredictions: 0,
      avgConfidence: 0,
      avgProcessingTime: 0
    }
  };
};

// Static method to get recent predictions
aiPredictionSchema.statics.getRecentPredictions = async function(projectId, limit = 10) {
  return await this.find({ projectId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('predictionType status confidence createdAt createdBy')
    .lean();
};

// Pre-save hook to calculate processing time
aiPredictionSchema.pre('save', function(next) {
  if (this.isNew && !this.processingTime) {
    // Processing time should be set by the controller, but default to 0 if not set
    this.processingTime = 0;
  }
  next();
});

const AIPrediction = mongoose.model('AIPrediction', aiPredictionSchema);

module.exports = AIPrediction;

