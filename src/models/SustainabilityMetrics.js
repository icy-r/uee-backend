const mongoose = require('mongoose');

const sustainabilityMetricsSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required'],
    index: true
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  // Overall sustainability score (0-100)
  overallScore: {
    type: Number,
    required: [true, 'Overall score is required'],
    min: 0,
    max: 100
  },
  // Component scores (0-100 each)
  scores: {
    materialScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0
    },
    wasteScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0
    },
    energyScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0
    }
  },
  // Carbon footprint in kg CO2e
  carbonFootprint: {
    total: {
      type: Number,
      required: true,
      default: 0
    },
    breakdown: {
      materials: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      waste: { type: Number, default: 0 },
      energy: { type: Number, default: 0 }
    }
  },
  // Detailed metrics
  metrics: {
    ecoFriendlyMaterialsPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    wasteReductionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    recyclingRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    energyEfficiencyRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 10
    },
    waterUsageEfficiency: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  // AI-generated recommendations
  recommendations: [{
    category: {
      type: String,
      enum: ['materials', 'waste', 'energy', 'water', 'transport', 'general'],
      required: true
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    potentialImpact: {
      type: String,
      enum: ['significant', 'moderate', 'minor']
    },
    estimatedCostSaving: {
      type: Number,
      default: 0
    },
    estimatedCO2Reduction: {
      type: Number,
      default: 0
    },
    implementationDifficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Industry benchmark comparison
  benchmark: {
    industryAverage: {
      type: Number,
      min: 0,
      max: 100
    },
    rank: {
      type: String,
      enum: ['excellent', 'good', 'average', 'below_average', 'poor']
    },
    percentile: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  calculatedAt: {
    type: Date,
    default: Date.now
  },
  calculatedBy: {
    type: String,
    enum: ['system', 'manual', 'ai'],
    default: 'system'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for efficient querying
sustainabilityMetricsSchema.index({ projectId: 1, date: -1 });

// Virtual for getting score trend indicator
sustainabilityMetricsSchema.virtual('trend').get(function() {
  // This would be calculated by comparing to previous score
  // For now, return neutral
  return 'stable';
});

// Virtual for grade level (A-F)
sustainabilityMetricsSchema.virtual('grade').get(function() {
  if (this.overallScore >= 90) return 'A';
  if (this.overallScore >= 80) return 'B';
  if (this.overallScore >= 70) return 'C';
  if (this.overallScore >= 60) return 'D';
  return 'F';
});

// Instance method to add a recommendation
sustainabilityMetricsSchema.methods.addRecommendation = function(recommendation) {
  this.recommendations.push({
    ...recommendation,
    createdAt: new Date()
  });
  return this.save();
};

// Instance method to update score
sustainabilityMetricsSchema.methods.updateScore = function(scores) {
  // Update component scores
  if (scores.materialScore !== undefined) {
    this.scores.materialScore = scores.materialScore;
  }
  if (scores.wasteScore !== undefined) {
    this.scores.wasteScore = scores.wasteScore;
  }
  if (scores.energyScore !== undefined) {
    this.scores.energyScore = scores.energyScore;
  }

  // Calculate overall score (weighted average)
  // 40% materials, 30% waste, 30% energy
  this.overallScore = Math.round(
    (this.scores.materialScore * 0.4) +
    (this.scores.wasteScore * 0.3) +
    (this.scores.energyScore * 0.3)
  );

  this.calculatedAt = new Date();
  
  return this.save();
};

// Static method to get latest metrics for a project
sustainabilityMetricsSchema.statics.getLatestForProject = async function(projectId) {
  return await this.findOne({ projectId })
    .sort({ date: -1 })
    .populate('projectId', 'name location');
};

// Static method to get metrics history
sustainabilityMetricsSchema.statics.getHistory = async function(projectId, limit = 30) {
  return await this.find({ projectId })
    .sort({ date: -1 })
    .limit(limit)
    .select('date overallScore scores carbonFootprint');
};

// Static method to calculate trend
sustainabilityMetricsSchema.statics.calculateTrend = async function(projectId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const metrics = await this.find({
    projectId,
    date: { $gte: startDate }
  })
  .sort({ date: 1 })
  .select('date overallScore');

  if (metrics.length < 2) {
    return { trend: 'insufficient_data', change: 0 };
  }

  const firstScore = metrics[0].overallScore;
  const lastScore = metrics[metrics.length - 1].overallScore;
  const change = lastScore - firstScore;
  const percentChange = ((change / firstScore) * 100).toFixed(2);

  let trend = 'stable';
  if (change > 5) trend = 'improving';
  else if (change < -5) trend = 'declining';

  return {
    trend,
    change: parseFloat(change.toFixed(2)),
    percentChange: parseFloat(percentChange),
    dataPoints: metrics.length
  };
};

const SustainabilityMetrics = mongoose.model('SustainabilityMetrics', sustainabilityMetricsSchema);

module.exports = SustainabilityMetrics;

