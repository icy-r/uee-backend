const User = require('../models/User');
const Project = require('../models/Project');
const catchAsync = require('../utils/catchAsync');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHandler');
const QueryBuilder = require('../utils/queryBuilder');

/**
 * Get current user's profile based on Firebase UID from token
 */
exports.getCurrentUserProfile = catchAsync(async (req, res) => {
  // Get Firebase UID from authenticated request
  const firebaseUid = req.user?.firebaseUid || req.user?.uid;
  
  if (!firebaseUid) {
    return errorResponse(res, 'User not authenticated', 401);
  }

  // Find user by Firebase UID
  const user = await User.findOne({ firebaseUid }).select('-password');
  
  if (!user) {
    return errorResponse(res, 'User profile not found', 404);
  }

  successResponse(res, user, 'User profile retrieved successfully');
});

/**
 * Update current user's profile
 */
exports.updateCurrentUserProfile = catchAsync(async (req, res) => {
  const firebaseUid = req.user?.firebaseUid || req.user?.uid;
  
  if (!firebaseUid) {
    return errorResponse(res, 'User not authenticated', 401);
  }

  // Find user by Firebase UID
  const user = await User.findOne({ firebaseUid });
  
  if (!user) {
    return errorResponse(res, 'User profile not found', 404);
  }

  // Update allowed fields
  const allowedUpdates = ['name', 'phone', 'bio', 'avatar', 'preferences'];
  const updates = {};
  
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  // Update user
  Object.assign(user, updates);
  await user.save();

  // Remove password from response
  user.password = undefined;

  successResponse(res, user, 'Profile updated successfully');
});

/**
 * Get current user's assigned projects
 */
exports.getCurrentUserProjects = catchAsync(async (req, res) => {
  const firebaseUid = req.user?.firebaseUid || req.user?.uid;
  
  if (!firebaseUid) {
    return errorResponse(res, 'User not authenticated', 401);
  }

  // Find user by Firebase UID
  const user = await User.findOne({ firebaseUid });
  
  if (!user) {
    return errorResponse(res, 'User profile not found', 404);
  }

  // Get projects where user is a team member
  const projects = await Project.find({
    'team.user': user._id,
    status: { $ne: 'archived' }
  }).select('name description status startDate expectedEndDate budget sustainabilityScore');

  successResponse(res, projects, 'User projects retrieved successfully');
});

/**
 * Create new user
 */
exports.createUser = catchAsync(async (req, res) => {
  const { name, email, phone, password, role, department, position, hireDate, firebaseUid, status } = req.body;

  // Check if user already exists by email or firebaseUid
  const existingUser = await User.findOne({
    $or: [
      { email },
      ...(firebaseUid ? [{ firebaseUid }] : [])
    ]
  });
  
  if (existingUser) {
    // If user exists with same firebaseUid, return the existing user
    if (existingUser.firebaseUid === firebaseUid) {
      existingUser.password = undefined;
      return successResponse(res, existingUser, 'User already exists', 200);
    }
    return errorResponse(res, 'User with this email already exists', 400);
  }

  // Create user
  const user = await User.create({
    name,
    email,
    phone,
    password,
    role: role || 'Worker', // Default to Worker if not specified
    department,
    position,
    hireDate,
    firebaseUid,
    status: status || 'active',
    createdBy: req.user?._id // Set from auth middleware if available
  });

  // Set default permissions based on role
  user.setDefaultPermissions();
  await user.save();

  // Remove password from response
  user.password = undefined;

  successResponse(res, user, 'User created successfully', 201);
});

/**
 * Get all users with filtering, sorting, pagination
 */
exports.getUsers = catchAsync(async (req, res) => {
  const queryBuilder = new QueryBuilder(User, req.query, {
    searchFields: ['name', 'email', 'phone', 'department', 'position'],
    filterFields: ['role', 'status', 'department', 'isDeleted'],
    sortFields: ['createdAt', 'name', 'email', 'lastLogin'],
    defaultSort: '-createdAt'
  })
    .search()
    .filter()
    .sort()
    .limitFields()
    .paginate();

  // Execute query with population
  const users = await queryBuilder.build()
    .populate('assignedProjects', 'name status')
    .populate('createdBy', 'name email')
    .select('-password');

  const total = await queryBuilder.countDocuments();
  const paginationMeta = queryBuilder.getPaginationMeta(total);

  paginatedResponse(res, users, paginationMeta, 'Users retrieved successfully');
});

/**
 * Get single user by ID
 */
exports.getUserById = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('assignedProjects', 'name status location')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .select('-password');

  if (!user) {
    return errorResponse(res, 'User not found', 404);
  }

  successResponse(res, user, 'User retrieved successfully');
});

/**
 * Update user
 */
exports.updateUser = catchAsync(async (req, res) => {
  const { password, email, ...updateData } = req.body;

  // Don't allow email or password updates through this endpoint
  if (email) {
    return errorResponse(res, 'Email cannot be updated through this endpoint', 400);
  }
  if (password) {
    return errorResponse(res, 'Password cannot be updated through this endpoint. Use change password endpoint', 400);
  }

  updateData.updatedBy = req.user?._id;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    return errorResponse(res, 'User not found', 404);
  }

  // Update permissions if role changed
  if (updateData.role) {
    user.setDefaultPermissions();
    await user.save();
  }

  successResponse(res, user, 'User updated successfully');
});

/**
 * Soft delete user (deactivate)
 */
exports.deleteUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return errorResponse(res, 'User not found', 404);
  }

  await user.softDelete(req.user?._id);

  successResponse(res, null, 'User deactivated successfully');
});

/**
 * Restore deleted user (reactivate)
 */
exports.restoreUser = catchAsync(async (req, res) => {
  // Query with isDeleted flag to find deleted users
  const user = await User.findOne({ _id: req.params.id, isDeleted: true });

  if (!user) {
    return errorResponse(res, 'Deleted user not found', 404);
  }

  await user.restore();

  successResponse(res, user, 'User reactivated successfully');
});

/**
 * Update user permissions
 */
exports.updatePermissions = catchAsync(async (req, res) => {
  const { permissions } = req.body;

  if (!permissions || typeof permissions !== 'object') {
    return errorResponse(res, 'Valid permissions object is required', 400);
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { permissions, updatedBy: req.user?._id },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    return errorResponse(res, 'User not found', 404);
  }

  successResponse(res, user, 'User permissions updated successfully');
});

/**
 * Assign user to projects
 */
exports.assignProjects = catchAsync(async (req, res) => {
  const { projectIds } = req.body;

  if (!Array.isArray(projectIds)) {
    return errorResponse(res, 'Project IDs must be an array', 400);
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { assignedProjects: projectIds, updatedBy: req.user?._id },
    { new: true, runValidators: true }
  )
    .populate('assignedProjects', 'name status location')
    .select('-password');

  if (!user) {
    return errorResponse(res, 'User not found', 404);
  }

  successResponse(res, user, 'Projects assigned successfully');
});

/**
 * Get user activity logs
 */
exports.getUserActivity = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return errorResponse(res, 'User not found', 404);
  }

  // This will be implemented when ActivityLog model is created
  // For now, return basic user info
  const activityData = {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    lastLogin: user.lastLogin,
    loginAttempts: user.loginAttempts,
    accountStatus: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };

  successResponse(res, activityData, 'User activity retrieved successfully');
});

/**
 * Bulk import users from CSV
 */
exports.bulkImport = catchAsync(async (req, res) => {
  const { users } = req.body;

  if (!Array.isArray(users) || users.length === 0) {
    return errorResponse(res, 'Users array is required', 400);
  }

  const results = {
    success: [],
    failed: []
  };

  for (const userData of users) {
    try {
      // Check if user exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        results.failed.push({
          email: userData.email,
          reason: 'User already exists'
        });
        continue;
      }

      // Create user
      const user = await User.create({
        ...userData,
        createdBy: req.user?._id
      });

      // Set default permissions
      user.setDefaultPermissions();
      await user.save();

      results.success.push({
        email: user.email,
        name: user.name,
        role: user.role
      });
    } catch (error) {
      results.failed.push({
        email: userData.email,
        reason: error.message
      });
    }
  }

  successResponse(res, results, `Bulk import completed. ${results.success.length} users created, ${results.failed.length} failed`);
});

/**
 * Change user password
 */
exports.changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return errorResponse(res, 'Current password and new password are required', 400);
  }

  // Get user with password field
  const user = await User.findById(req.params.id).select('+password');

  if (!user) {
    return errorResponse(res, 'User not found', 404);
  }

  // Verify current password
  const isPasswordCorrect = await user.comparePassword(currentPassword);
  if (!isPasswordCorrect) {
    return errorResponse(res, 'Current password is incorrect', 401);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  successResponse(res, null, 'Password changed successfully');
});

/**
 * Get user statistics
 */
exports.getUserStats = catchAsync(async (req, res) => {
  const stats = await User.aggregate([
    {
      $facet: {
        totalUsers: [
          { $match: { isDeleted: false } },
          { $count: 'count' }
        ],
        activeUsers: [
          { $match: { status: 'active', isDeleted: false } },
          { $count: 'count' }
        ],
        inactiveUsers: [
          { $match: { status: 'inactive', isDeleted: false } },
          { $count: 'count' }
        ],
        byRole: [
          { $match: { isDeleted: false } },
          { $group: { _id: '$role', count: { $sum: 1 } } }
        ],
        byDepartment: [
          { $match: { isDeleted: false, department: { $exists: true, $ne: null } } },
          { $group: { _id: '$department', count: { $sum: 1 } } }
        ],
        recentUsers: [
          { $match: { isDeleted: false } },
          { $sort: { createdAt: -1 } },
          { $limit: 5 },
          { $project: { name: 1, email: 1, role: 1, createdAt: 1 } }
        ]
      }
    }
  ]);

  const formattedStats = {
    total: stats[0].totalUsers[0]?.count || 0,
    active: stats[0].activeUsers[0]?.count || 0,
    inactive: stats[0].inactiveUsers[0]?.count || 0,
    byRole: stats[0].byRole,
    byDepartment: stats[0].byDepartment,
    recentUsers: stats[0].recentUsers
  };

  successResponse(res, formattedStats, 'User statistics retrieved successfully');
});
