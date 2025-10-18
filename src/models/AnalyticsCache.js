const mongoose = require('mongoose');

const analyticsCacheSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required'],
    index: true
  },
  reportType: {
    type: String,
    required: [true, 'Report type is required'],
    enum: [
      'progress',
      'materials',
      'budget',
      'team',
      'sustainability',
      'comprehensive'
    ],
    index: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Data is required']
  },
  generatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  parameters: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  dataSize: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index for efficient lookup
analyticsCacheSchema.index({ projectId: 1, reportType: 1, expiresAt: 1 });

// TTL index to automatically remove expired documents
analyticsCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save hook to calculate data size
analyticsCacheSchema.pre('save', function(next) {
  if (this.data) {
    this.dataSize = JSON.stringify(this.data).length;
  }
  next();
});

// Static method to get cached analytics
analyticsCacheSchema.statics.getCached = async function(projectId, reportType, parameters = {}) {
  const cacheKey = this.generateCacheKey(parameters);
  
  const cached = await this.findOne({
    projectId,
    reportType,
    'parameters.cacheKey': cacheKey,
    expiresAt: { $gt: new Date() }
  }).sort({ generatedAt: -1 });

  return cached;
};

// Static method to set cache
analyticsCacheSchema.statics.setCache = async function(projectId, reportType, data, ttlMinutes = 15, parameters = {}) {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);

  const cacheKey = this.generateCacheKey(parameters);
  
  // Remove old cache for same project/reportType/parameters
  await this.deleteMany({
    projectId,
    reportType,
    'parameters.cacheKey': cacheKey
  });

  return await this.create({
    projectId,
    reportType,
    data,
    expiresAt,
    parameters: {
      ...parameters,
      cacheKey
    }
  });
};

// Static method to invalidate cache for a project
analyticsCacheSchema.statics.invalidateProject = async function(projectId, reportType = null) {
  const query = { projectId };
  
  if (reportType) {
    query.reportType = reportType;
  }

  const result = await this.deleteMany(query);
  console.log(`✅ Invalidated ${result.deletedCount} cache entries for project ${projectId}`);
  
  return result;
};

// Static method to generate cache key from parameters
analyticsCacheSchema.statics.generateCacheKey = function(parameters) {
  const sortedKeys = Object.keys(parameters).sort();
  const keyString = sortedKeys.map(key => `${key}:${parameters[key]}`).join('|');
  return keyString || 'default';
};

// Static method to clean expired cache (can be run periodically)
analyticsCacheSchema.statics.cleanExpired = async function() {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
  
  console.log(`✅ Cleaned ${result.deletedCount} expired cache entries`);
  return result;
};

// Static method to get cache statistics
analyticsCacheSchema.statics.getCacheStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$reportType',
        count: { $sum: 1 },
        avgSize: { $avg: '$dataSize' },
        totalSize: { $sum: '$dataSize' }
      }
    }
  ]);

  const totalDocs = await this.countDocuments();
  const expiredDocs = await this.countDocuments({
    expiresAt: { $lt: new Date() }
  });

  return {
    byType: stats,
    total: totalDocs,
    expired: expiredDocs,
    active: totalDocs - expiredDocs
  };
};

const AnalyticsCache = mongoose.model('AnalyticsCache', analyticsCacheSchema);

module.exports = AnalyticsCache;

