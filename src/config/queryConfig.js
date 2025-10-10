/**
 * Query Configuration
 * Defines allowed fields, operators, and defaults for each model
 * This provides security by whitelisting queryable fields
 */

module.exports = {
  materials: {
    allowedFields: [
      'projectId',
      'name',
      'category',
      'quantity',
      'unit',
      'unitCost',
      'supplier',
      'ecoFriendly',
      'reorderLevel',
      'createdAt',
      'updatedAt'
    ],
    allowedOperators: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'startsWith', 'endsWith', 'in', 'nin'],
    defaultSort: { createdAt: -1 },
    defaultLimit: 50,
    maxLimit: 100
  },

  tasks: {
    allowedFields: [
      'projectId',
      'title',
      'description',
      'status',
      'priority',
      'deadline',
      'assignedTo',
      'assignedBy',
      'completedAt',
      'createdAt',
      'updatedAt'
    ],
    allowedOperators: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'startsWith', 'endsWith', 'in', 'nin'],
    defaultSort: { createdAt: -1 },
    defaultLimit: 50,
    maxLimit: 100
  },

  projects: {
    allowedFields: [
      'name',
      'description',
      'location',
      'startDate',
      'expectedEndDate',
      'actualEndDate',
      'status',
      'progressPercentage',
      'sustainabilityScore',
      'teamSize',
      'projectType',
      'owner',
      'createdBy',
      'createdAt',
      'updatedAt'
    ],
    allowedOperators: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'startsWith', 'endsWith', 'in', 'nin'],
    defaultSort: { createdAt: -1 },
    defaultLimit: 50,
    maxLimit: 100
  },

  documents: {
    allowedFields: [
      'projectId',
      'filename',
      'originalName',
      'fileType',
      'fileSize',
      'category',
      'description',
      'tags',
      'uploadedBy',
      'isProcessed',
      'processingStatus',
      'createdAt',
      'updatedAt'
    ],
    allowedOperators: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'startsWith', 'endsWith', 'in', 'nin'],
    defaultSort: { createdAt: -1 },
    defaultLimit: 50,
    maxLimit: 100
  },

  budgets: {
    allowedFields: [
      'projectId',
      'totalBudget',
      'contingencyPercentage',
      'currency',
      'createdAt',
      'updatedAt'
    ],
    allowedOperators: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin'],
    defaultSort: { createdAt: -1 },
    defaultLimit: 50,
    maxLimit: 100
  },

  // For nested budget expenses
  expenses: {
    allowedFields: [
      'category',
      'amount',
      'description',
      'date',
      'invoiceNumber',
      'vendor',
      'paymentStatus',
      'paymentDate',
      'addedBy'
    ],
    allowedOperators: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'startsWith', 'endsWith', 'in', 'nin'],
    defaultSort: { date: -1 },
    defaultLimit: 50,
    maxLimit: 200
  }
};

