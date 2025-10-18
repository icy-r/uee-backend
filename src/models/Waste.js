const mongoose = require('mongoose');

const wasteSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required'],
    index: true
  },
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: [true, 'Material ID is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: ['kg', 'tons', 'liters', 'cubic meters', 'pieces', 'bags', 'boxes']
  },
  reason: {
    type: String,
    required: [true, 'Reason for waste is required'],
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Waste category is required'],
    enum: [
      'excess_material',
      'damaged_material',
      'expired_material',
      'offcuts',
      'packaging',
      'demolition',
      'contaminated',
      'other'
    ]
  },
  disposalMethod: {
    type: String,
    required: [true, 'Disposal method is required'],
    enum: [
      'recycling',
      'landfill',
      'reuse',
      'donation',
      'hazardous_waste_facility',
      'composting',
      'incineration'
    ]
  },
  cost: {
    type: Number,
    default: 0,
    min: [0, 'Cost cannot be negative']
  },
  photos: [{
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reportedBy: {
    type: String,
    required: [true, 'Reporter ID is required']
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  location: {
    type: String,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  isRecyclable: {
    type: Boolean,
    default: false
  },
  isHazardous: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
wasteSchema.index({ projectId: 1, date: -1 });
wasteSchema.index({ projectId: 1, category: 1 });
wasteSchema.index({ materialId: 1 });

// Virtual for calculating environmental impact score (lower is better)
wasteSchema.virtual('environmentalImpact').get(function() {
  let score = 0;
  
  // Disposal method scoring (0-10, higher = worse)
  const disposalScores = {
    'reuse': 0,
    'recycling': 2,
    'donation': 1,
    'composting': 2,
    'incineration': 7,
    'landfill': 8,
    'hazardous_waste_facility': 9
  };
  
  score += disposalScores[this.disposalMethod] || 5;
  
  // Add penalty for hazardous waste
  if (this.isHazardous) {
    score += 5;
  }
  
  // Reduce score if recyclable but not recycled
  if (this.isRecyclable && this.disposalMethod !== 'recycling' && this.disposalMethod !== 'reuse') {
    score += 3;
  }
  
  return score;
});

// Instance method to calculate cost impact
wasteSchema.methods.getCostImpact = function() {
  return {
    directCost: this.cost,
    materialValue: this.quantity * (this.materialId?.costPerUnit || 0),
    totalImpact: this.cost + (this.quantity * (this.materialId?.costPerUnit || 0))
  };
};

// Static method to get waste analytics for a project
wasteSchema.statics.getProjectAnalytics = async function(projectId, startDate, endDate) {
  const match = { projectId: mongoose.Types.ObjectId(projectId) };
  
  if (startDate || endDate) {
    match.date = {};
    if (startDate) match.date.$gte = new Date(startDate);
    if (endDate) match.date.$lte = new Date(endDate);
  }
  
  const analytics = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$category',
        totalQuantity: { $sum: '$quantity' },
        totalCost: { $sum: '$cost' },
        count: { $sum: 1 },
        avgQuantity: { $avg: '$quantity' }
      }
    },
    {
      $sort: { totalCost: -1 }
    }
  ]);
  
  const totalStats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalWaste: { $sum: '$quantity' },
        totalCost: { $sum: '$cost' },
        totalRecords: { $sum: 1 },
        recyclableCount: {
          $sum: { $cond: ['$isRecyclable', 1, 0] }
        },
        hazardousCount: {
          $sum: { $cond: ['$isHazardous', 1, 0] }
        }
      }
    }
  ]);
  
  return {
    byCategory: analytics,
    totals: totalStats[0] || {
      totalWaste: 0,
      totalCost: 0,
      totalRecords: 0,
      recyclableCount: 0,
      hazardousCount: 0
    }
  };
};

// Static method to get waste trends over time
wasteSchema.statics.getWasteTrends = async function(projectId, groupBy = 'day') {
  const dateFormat = groupBy === 'month' 
    ? { $dateToString: { format: '%Y-%m', date: '$date' } }
    : { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
  
  return await this.aggregate([
    { 
      $match: { 
        projectId: mongoose.Types.ObjectId(projectId) 
      } 
    },
    {
      $group: {
        _id: dateFormat,
        totalQuantity: { $sum: '$quantity' },
        totalCost: { $sum: '$cost' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

const Waste = mongoose.model('Waste', wasteSchema);

module.exports = Waste;

