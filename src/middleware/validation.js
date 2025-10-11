const Joi = require('joi');

/**
 * Generic validation middleware
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors
      });
    }

    req.body = value;
    next();
  };
};

/**
 * Validation schemas
 */
const schemas = {
  // Material schemas
  createMaterial: Joi.object({
    projectId: Joi.string().required(),
    name: Joi.string().required().min(2).max(100),
    category: Joi.string().required(),
    quantity: Joi.number().required().min(0),
    unit: Joi.string().required(),
    unitCost: Joi.number().min(0),
    supplier: Joi.string(),
    ecoFriendly: Joi.boolean().default(false),
    description: Joi.string()
  }),

  updateMaterial: Joi.object({
    projectId: Joi.string().required(),
    name: Joi.string().min(2).max(100),
    category: Joi.string(),
    quantity: Joi.number().min(0),
    unit: Joi.string(),
    unitCost: Joi.number().min(0),
    supplier: Joi.string(),
    ecoFriendly: Joi.boolean(),
    description: Joi.string()
  }),

  logUsage: Joi.object({
    projectId: Joi.string().required(),
    quantity: Joi.number().required().min(0),
    usedFor: Joi.string().required(),
    notes: Joi.string()
  }),

  logWaste: Joi.object({
    projectId: Joi.string().required(),
    quantity: Joi.number().required().min(0),
    reason: Joi.string().required(),
    notes: Joi.string()
  }),

  // Task schemas
  createTask: Joi.object({
    projectId: Joi.string().required(),
    title: Joi.string().required().min(3).max(200),
    description: Joi.string().required(),
    deadline: Joi.date().required(),
    assignedTo: Joi.array().items(Joi.string()),
    priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
    status: Joi.string().valid('not_started', 'in_progress', 'completed').default('not_started')
  }),

  updateTask: Joi.object({
    projectId: Joi.string().required(),
    title: Joi.string().min(3).max(200),
    description: Joi.string(),
    deadline: Joi.date(),
    assignedTo: Joi.array().items(Joi.string()),
    priority: Joi.string().valid('low', 'medium', 'high'),
    status: Joi.string().valid('not_started', 'in_progress', 'completed')
  }),

  updateTaskProgress: Joi.object({
    projectId: Joi.string().required(),
    status: Joi.string().valid('not_started', 'in_progress', 'completed').required(),
    notes: Joi.string()
  }),

  logTime: Joi.object({
    projectId: Joi.string().required(),
    hours: Joi.number().required().min(0).max(24),
    date: Joi.date().default(Date.now),
    description: Joi.string().required()
  }),

  // Budget schemas
  createBudget: Joi.object({
    projectId: Joi.string().required(),
    totalBudget: Joi.number().required().min(0),
    allocations: Joi.object({
      materials: Joi.number().min(0),
      labor: Joi.number().min(0),
      equipment: Joi.number().min(0),
      other: Joi.number().min(0)
    })
  }),

  logExpense: Joi.object({
    projectId: Joi.string().required(),
    category: Joi.string().required().valid('materials', 'labor', 'equipment', 'other'),
    amount: Joi.number().required().min(0),
    description: Joi.string().required(),
    date: Joi.date().default(Date.now),
    invoiceNumber: Joi.string(),
    vendor: Joi.string()
  })
};

module.exports = { validate, schemas };

