const mongoose = require('mongoose');

const usageLogSchema = new mongoose.Schema({
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  usedFor: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: String
});

const wasteLogSchema = new mongoose.Schema({
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: String
});

const materialSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Material name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Material category is required'],
    enum: ['cement', 'steel', 'wood', 'bricks', 'sand', 'gravel', 'paint', 'electrical', 'plumbing', 'other']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 0
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: ['kg', 'ton', 'liter', 'gallon', 'piece', 'sqft', 'sqm', 'cubic_meter', 'bag']
  },
  unitCost: {
    type: Number,
    min: 0,
    default: 0
  },
  supplier: {
    type: String,
    trim: true
  },
  ecoFriendly: {
    type: Boolean,
    default: false
  },
  description: String,
  usageLog: [usageLogSchema],
  wasteLog: [wasteLogSchema],
  reorderLevel: {
    type: Number,
    min: 0
  },
  lastRestocked: Date
}, {
  timestamps: true
});

// Calculate total cost
materialSchema.virtual('totalCost').get(function() {
  return this.quantity * this.unitCost;
});

// Calculate total usage
materialSchema.virtual('totalUsage').get(function() {
  return this.usageLog.reduce((sum, log) => sum + log.quantity, 0);
});

// Calculate total waste
materialSchema.virtual('totalWaste').get(function() {
  return this.wasteLog.reduce((sum, log) => sum + log.quantity, 0);
});

// Calculate current inventory
materialSchema.virtual('currentInventory').get(function() {
  return this.quantity - this.totalUsage - this.totalWaste;
});

// Enable virtuals in JSON
materialSchema.set('toJSON', { virtuals: true });
materialSchema.set('toObject', { virtuals: true });

// Check if reorder is needed
materialSchema.methods.needsReorder = function() {
  if (!this.reorderLevel) return false;
  return this.currentInventory <= this.reorderLevel;
};

module.exports = mongoose.model('Material', materialSchema);

