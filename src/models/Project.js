const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    minlength: 3,
    maxlength: 200
  },
  description: {
    type: String,
    required: [true, 'Project description is required']
  },
  location: {
    type: String,
    required: [true, 'Project location is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  expectedEndDate: {
    type: Date,
    required: [true, 'Expected end date is required']
  },
  actualEndDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'],
    default: 'planning'
  },
  progressPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  sustainabilityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  teamSize: {
    type: Number,
    default: 0
  },
  projectType: {
    type: String,
    required: true,
    enum: ['residential', 'commercial', 'industrial', 'infrastructure']
  },
  projectSize: {
    value: Number,
    unit: {
      type: String,
      enum: ['sqft', 'sqm', 'acres']
    }
  },
  owner: {
    type: String,
    required: true
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Calculate sustainability score based on materials and waste
projectSchema.methods.calculateSustainabilityScore = async function() {
  const Material = mongoose.model('Material');
  const materials = await Material.find({ projectId: this._id });
  
  if (materials.length === 0) {
    return 0;
  }

  let ecoFriendlyCount = 0;
  let totalWaste = 0;
  let totalUsage = 0;

  materials.forEach(material => {
    if (material.ecoFriendly) ecoFriendlyCount++;
    totalWaste += material.wasteLog.reduce((sum, log) => sum + log.quantity, 0);
    totalUsage += material.usageLog.reduce((sum, log) => sum + log.quantity, 0);
  });

  const ecoFriendlyPercentage = (ecoFriendlyCount / materials.length) * 100;
  const wastePercentage = totalUsage > 0 ? (totalWaste / totalUsage) * 100 : 0;
  
  // Score calculation: 60% eco-friendly materials + 40% waste reduction
  const score = (ecoFriendlyPercentage * 0.6) + ((100 - wastePercentage) * 0.4);
  
  this.sustainabilityScore = Math.round(Math.max(0, Math.min(100, score)));
  await this.save();
  
  return this.sustainabilityScore;
};

// Calculate progress percentage based on tasks
projectSchema.methods.calculateProgress = async function() {
  const Task = mongoose.model('Task');
  const tasks = await Task.find({ projectId: this._id });
  
  if (tasks.length === 0) {
    return 0;
  }

  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const progress = (completedTasks / tasks.length) * 100;
  
  this.progressPercentage = Math.round(progress);
  await this.save();
  
  return this.progressPercentage;
};

module.exports = mongoose.model('Project', projectSchema);

