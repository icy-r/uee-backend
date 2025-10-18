const Task = require('../models/Task');
const Material = require('../models/Material');
const Waste = require('../models/Waste');
const Budget = require('../models/Budget');
const catchAsync = require('../utils/catchAsync');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Process batch sync operations from offline device
 * @route POST /api/sync/batch
 */
exports.processBatchSync = catchAsync(async (req, res) => {
  const { operations } = req.body;

  if (!operations || !Array.isArray(operations)) {
    return errorResponse(res, 'Operations array is required', 400);
  }

  const results = {
    successful: [],
    failed: [],
    conflicts: []
  };

  // Process each operation
  for (const operation of operations) {
    try {
      const result = await processOperation(operation, req.user.uid);
      
      if (result.conflict) {
        results.conflicts.push({
          operation,
          conflict: result.conflict
        });
      } else {
        results.successful.push({
          operationId: operation.id,
          type: operation.type,
          model: operation.model,
          result: result.data
        });
      }
    } catch (error) {
      results.failed.push({
        operation,
        error: error.message
      });
    }
  }

  successResponse(res, {
    results,
    summary: {
      total: operations.length,
      successful: results.successful.length,
      failed: results.failed.length,
      conflicts: results.conflicts.length
    }
  }, 'Batch sync completed');
});

/**
 * Get sync status for a project
 * @route GET /api/sync/status
 */
exports.getSyncStatus = catchAsync(async (req, res) => {
  const { projectId, lastSyncTimestamp } = req.query;

  if (!projectId) {
    return errorResponse(res, 'Project ID is required', 400);
  }

  const syncTime = lastSyncTimestamp ? new Date(lastSyncTimestamp) : new Date(0);

  // Get changes since last sync
  const [tasks, materials, wastes, budgets] = await Promise.all([
    Task.find({
      projectId,
      updatedAt: { $gt: syncTime }
    }).select('_id title status updatedAt'),
    
    Material.find({
      projectId,
      updatedAt: { $gt: syncTime }
    }).select('_id name quantity updatedAt'),
    
    Waste.find({
      projectId,
      date: { $gt: syncTime }
    }).select('_id quantity category updatedAt'),
    
    Budget.find({
      projectId,
      updatedAt: { $gt: syncTime }
    }).select('_id category spentAmount updatedAt')
  ]);

  const changesSinceSync = {
    tasks: tasks.length,
    materials: materials.length,
    wastes: wastes.length,
    budgets: budgets.length,
    total: tasks.length + materials.length + wastes.length + budgets.length
  };

  successResponse(res, {
    projectId,
    lastSyncTimestamp: syncTime,
    currentTimestamp: new Date(),
    changesSinceSync,
    changes: {
      tasks: tasks.map(t => ({ id: t._id, title: t.title, updatedAt: t.updatedAt })),
      materials: materials.map(m => ({ id: m._id, name: m.name, updatedAt: m.updatedAt })),
      wastes: wastes.map(w => ({ id: w._id, category: w.category, updatedAt: w.updatedAt })),
      budgets: budgets.map(b => ({ id: b._id, category: b.category, updatedAt: b.updatedAt }))
    },
    needsSync: changesSinceSync.total > 0
  }, 'Sync status retrieved successfully');
});

/**
 * Process individual operation
 */
const processOperation = async (operation, userId) => {
  const { id, type, model, data, timestamp, localId } = operation;

  let ModelClass;
  switch (model) {
    case 'Task':
      ModelClass = Task;
      break;
    case 'Material':
      ModelClass = Material;
      break;
    case 'Waste':
      ModelClass = Waste;
      break;
    case 'Budget':
      ModelClass = Budget;
      break;
    default:
      throw new Error(`Unsupported model: ${model}`);
  }

  switch (type) {
    case 'create':
      return await handleCreate(ModelClass, data, localId);
    
    case 'update':
      return await handleUpdate(ModelClass, id, data, timestamp);
    
    case 'delete':
      return await handleDelete(ModelClass, id, timestamp);
    
    default:
      throw new Error(`Unsupported operation type: ${type}`);
  }
};

/**
 * Handle create operation
 */
const handleCreate = async (Model, data, localId) => {
  const document = await Model.create(data);
  
  return {
    data: {
      _id: document._id,
      localId,
      createdAt: document.createdAt
    }
  };
};

/**
 * Handle update operation
 */
const handleUpdate = async (Model, id, data, timestamp) => {
  const existing = await Model.findById(id);
  
  if (!existing) {
    throw new Error(`Document not found: ${id}`);
  }

  // Check for conflicts (server version newer than client operation)
  if (existing.updatedAt > new Date(timestamp)) {
    return {
      conflict: {
        type: 'version_conflict',
        serverVersion: existing,
        clientTimestamp: timestamp,
        message: 'Server has a newer version. Manual merge required.'
      }
    };
  }

  // Update document
  const updated = await Model.findByIdAndUpdate(
    id,
    data,
    { new: true, runValidators: true }
  );

  return {
    data: {
      _id: updated._id,
      updatedAt: updated.updatedAt
    }
  };
};

/**
 * Handle delete operation
 */
const handleDelete = async (Model, id, timestamp) => {
  const existing = await Model.findById(id);
  
  if (!existing) {
    // Already deleted, return success
    return {
      data: {
        _id: id,
        deleted: true
      }
    };
  }

  // Check for conflicts
  if (existing.updatedAt > new Date(timestamp)) {
    return {
      conflict: {
        type: 'delete_conflict',
        serverVersion: existing,
        clientTimestamp: timestamp,
        message: 'Server version was updated after delete operation. Manual review required.'
      }
    };
  }

  await Model.findByIdAndDelete(id);

  return {
    data: {
      _id: id,
      deleted: true
    }
  };
};

/**
 * Resolve sync conflict (manual resolution)
 * @route POST /api/sync/resolve-conflict
 */
exports.resolveConflict = catchAsync(async (req, res) => {
  const { conflictId, resolution, data } = req.body;

  if (!conflictId || !resolution) {
    return errorResponse(res, 'Conflict ID and resolution are required', 400);
  }

  // Resolution options: 'use_server', 'use_client', 'merge'
  let result;
  
  switch (resolution) {
    case 'use_server':
      // Keep server version, discard client changes
      result = { action: 'kept_server_version' };
      break;
    
    case 'use_client':
      // Overwrite server with client data
      result = await applyClientData(data);
      break;
    
    case 'merge':
      // Merge both versions (requires manual merge data)
      result = await applyMergedData(data);
      break;
    
    default:
      return errorResponse(res, 'Invalid resolution type', 400);
  }

  successResponse(res, result, 'Conflict resolved successfully');
});

const applyClientData = async (data) => {
  // Implementation for applying client data
  return { action: 'applied_client_version', data };
};

const applyMergedData = async (data) => {
  // Implementation for applying merged data
  return { action: 'applied_merged_version', data };
};

