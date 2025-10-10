/**
 * Query Parser Middleware
 * Validates and sanitizes query parameters before processing
 * Provides security through field whitelisting and input validation
 */

const queryConfig = require('../config/queryConfig');

/**
 * Create query parser middleware for a specific model
 * @param {string} modelName - Name of the model (must match key in queryConfig)
 * @returns {Function} Express middleware function
 */
const createQueryParser = (modelName) => {
  return (req, res, next) => {
    const config = queryConfig[modelName];
    
    if (!config) {
      // If no config found, allow the request to proceed without validation
      return next();
    }

    // Validate and sanitize query parameters
    const sanitizedQuery = {};
    const originalQuery = { ...req.query };

    Object.keys(originalQuery).forEach(key => {
      // Skip pagination and special fields
      if (['page', 'limit', 'sort', 'select', 'fields'].includes(key)) {
        sanitizedQuery[key] = originalQuery[key];
        return;
      }

      // Extract field name (handle operator syntax)
      const fieldMatch = key.match(/^(.+)\[(.+)\]$/);
      const fieldName = fieldMatch ? fieldMatch[1] : key;
      const operator = fieldMatch ? fieldMatch[2] : null;

      // Check if field is allowed
      if (config.allowedFields && !config.allowedFields.includes(fieldName)) {
        // Silently skip non-whitelisted fields
        return;
      }

      // Check if operator is allowed
      if (operator && config.allowedOperators && !config.allowedOperators.includes(operator)) {
        // Silently skip invalid operators
        return;
      }

      // Add to sanitized query
      sanitizedQuery[key] = sanitizeValue(originalQuery[key]);
    });

    // Replace req.query with sanitized version
    req.query = sanitizedQuery;
    
    // Attach config for use in controllers
    req.queryConfig = config;

    next();
  };
};

/**
 * Sanitize input value to prevent injection
 * @param {any} value - Input value to sanitize
 * @returns {any} Sanitized value
 */
const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    // Remove potentially dangerous characters for MongoDB
    // Allow alphanumeric, spaces, and common punctuation
    return value.replace(/[${}]/g, '');
  }
  return value;
};

/**
 * Pre-configured query parsers for each model
 */
const queryParsers = {
  materials: createQueryParser('materials'),
  tasks: createQueryParser('tasks'),
  projects: createQueryParser('projects'),
  documents: createQueryParser('documents'),
  budgets: createQueryParser('budgets'),
  expenses: createQueryParser('expenses')
};

module.exports = {
  createQueryParser,
  queryParsers,
  sanitizeValue
};

