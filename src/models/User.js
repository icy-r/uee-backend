const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User name is required'],
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true, // Allows null values while maintaining uniqueness
    trim: true,
    index: true
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[0-9+\-() ]*$/, 'Please provide a valid phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false // Don't return password by default
  },
  role: {
    type: String,
    required: [true, 'User role is required'],
    enum: ['Admin', 'Project Manager', 'Site Engineer', 'Sustainability Officer', 'Worker'],
    default: 'Worker'
  },
  customRoles: [{
    type: String,
    trim: true
  }],
  permissions: {
    // Module-based permissions
    users: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    projects: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    tasks: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    materials: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    budget: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    documents: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    reports: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      export: { type: Boolean, default: false }
    },
    settings: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false }
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  department: {
    type: String,
    trim: true
  },
  position: {
    type: String,
    trim: true
  },
  hireDate: {
    type: Date
  },
  profilePicture: {
    type: String // URL to profile image
  },
  assignedProjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  accountLockedUntil: {
    type: Date
  },
  passwordChangedAt: {
    type: Date
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ isDeleted: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to set passwordChangedAt
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  
  this.passwordChangedAt = Date.now() - 1000; // Subtract 1 sec to ensure token is created after password change
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to set default permissions based on role
userSchema.methods.setDefaultPermissions = function() {
  const rolePermissions = {
    'Admin': {
      users: { view: true, create: true, edit: true, delete: true },
      projects: { view: true, create: true, edit: true, delete: true },
      tasks: { view: true, create: true, edit: true, delete: true },
      materials: { view: true, create: true, edit: true, delete: true },
      budget: { view: true, create: true, edit: true, delete: true },
      documents: { view: true, create: true, edit: true, delete: true },
      reports: { view: true, create: true, export: true },
      settings: { view: true, edit: true }
    },
    'Project Manager': {
      users: { view: true, create: false, edit: false, delete: false },
      projects: { view: true, create: true, edit: true, delete: false },
      tasks: { view: true, create: true, edit: true, delete: true },
      materials: { view: true, create: true, edit: true, delete: false },
      budget: { view: true, create: true, edit: true, delete: false },
      documents: { view: true, create: true, edit: true, delete: true },
      reports: { view: true, create: true, export: true },
      settings: { view: false, edit: false }
    },
    'Site Engineer': {
      users: { view: true, create: false, edit: false, delete: false },
      projects: { view: true, create: false, edit: true, delete: false },
      tasks: { view: true, create: true, edit: true, delete: false },
      materials: { view: true, create: true, edit: true, delete: false },
      budget: { view: true, create: false, edit: false, delete: false },
      documents: { view: true, create: true, edit: false, delete: false },
      reports: { view: true, create: false, export: false },
      settings: { view: false, edit: false }
    },
    'Sustainability Officer': {
      users: { view: true, create: false, edit: false, delete: false },
      projects: { view: true, create: false, edit: true, delete: false },
      tasks: { view: true, create: true, edit: true, delete: false },
      materials: { view: true, create: true, edit: true, delete: false },
      budget: { view: true, create: false, edit: false, delete: false },
      documents: { view: true, create: true, edit: false, delete: false },
      reports: { view: true, create: true, export: true },
      settings: { view: false, edit: false }
    },
    'Worker': {
      users: { view: false, create: false, edit: false, delete: false },
      projects: { view: true, create: false, edit: false, delete: false },
      tasks: { view: true, create: false, edit: true, delete: false },
      materials: { view: true, create: false, edit: false, delete: false },
      budget: { view: false, create: false, edit: false, delete: false },
      documents: { view: true, create: false, edit: false, delete: false },
      reports: { view: false, create: false, export: false },
      settings: { view: false, edit: false }
    }
  };

  this.permissions = rolePermissions[this.role] || rolePermissions['Worker'];
};

// Instance method for soft delete
userSchema.methods.softDelete = function(deletedByUserId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedByUserId;
  this.status = 'inactive';
  return this.save();
};

// Instance method to restore deleted user
userSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = null;
  this.deletedBy = null;
  this.status = 'active';
  return this.save();
};

// Query middleware to exclude deleted users by default
userSchema.pre(/^find/, function(next) {
  // Only exclude deleted users if not explicitly querying for them
  if (!this.getQuery().isDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
