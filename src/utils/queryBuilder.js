/**
 * QueryBuilder - Dynamic MongoDB Query Builder
 * Supports OData-like filtering with multiple operators, sorting, pagination, and field selection
 */

class QueryBuilder {
  constructor(model, queryString, config = {}) {
    this.model = model;
    this.queryString = queryString;
    this.config = config;
    this.mongoQuery = {};
    this.sortOptions = {};
    this.selectFields = '';
    this.page = 1;
    this.limit = config.defaultLimit || 50;
    this.skip = 0;
  }

  /**
   * Parse and build filter conditions
   * Supports operators: eq, ne, gt, gte, lt, lte, contains, startsWith, endsWith, in, nin
   */
  filter() {
    const queryObj = { ...this.queryString };
    const excludeFields = ['page', 'limit', 'sort', 'select', 'fields'];
    
    // Remove pagination and other special fields
    excludeFields.forEach(field => delete queryObj[field]);

    // Parse query parameters
    Object.keys(queryObj).forEach(key => {
      const value = queryObj[key];
      
      // Check if field is allowed
      if (this.config.allowedFields && !this.config.allowedFields.includes(key.split('[')[0])) {
        return; // Skip non-whitelisted fields
      }

      // Handle operator syntax: field[operator]=value
      const operatorMatch = key.match(/^(.+)\[(.+)\]$/);
      
      if (operatorMatch) {
        const field = operatorMatch[1];
        const operator = operatorMatch[2];
        
        // Validate operator
        if (this.config.allowedOperators && !this.config.allowedOperators.includes(operator)) {
          return; // Skip invalid operators
        }

        this.applyOperator(field, operator, value);
      } else {
        // Simple equality
        this.mongoQuery[key] = this.parseValue(value);
      }
    });

    return this;
  }

  /**
   * Apply operator to field
   */
  applyOperator(field, operator, value) {
    switch (operator) {
      case 'eq':
        this.mongoQuery[field] = this.parseValue(value);
        break;
      
      case 'ne':
        this.mongoQuery[field] = { $ne: this.parseValue(value) };
        break;
      
      case 'gt':
        this.mongoQuery[field] = { $gt: this.parseValue(value) };
        break;
      
      case 'gte':
        this.mongoQuery[field] = { $gte: this.parseValue(value) };
        break;
      
      case 'lt':
        this.mongoQuery[field] = { $lt: this.parseValue(value) };
        break;
      
      case 'lte':
        this.mongoQuery[field] = { $lte: this.parseValue(value) };
        break;
      
      case 'contains':
        this.mongoQuery[field] = { $regex: new RegExp(this.escapeRegex(value), 'i') };
        break;
      
      case 'startsWith':
        this.mongoQuery[field] = { $regex: new RegExp(`^${this.escapeRegex(value)}`, 'i') };
        break;
      
      case 'endsWith':
        this.mongoQuery[field] = { $regex: new RegExp(`${this.escapeRegex(value)}$`, 'i') };
        break;
      
      case 'in':
        const inValues = value.split(',').map(v => this.parseValue(v.trim()));
        this.mongoQuery[field] = { $in: inValues };
        break;
      
      case 'nin':
        const ninValues = value.split(',').map(v => this.parseValue(v.trim()));
        this.mongoQuery[field] = { $nin: ninValues };
        break;
      
      default:
        // Unknown operator, skip
        break;
    }
  }

  /**
   * Parse value to appropriate type
   */
  parseValue(value) {
    // Boolean
    if (value === 'true') return true;
    if (value === 'false') return false;
    
    // Number
    if (!isNaN(value) && value !== '' && value !== null) {
      return Number(value);
    }
    
    // Date (ISO format)
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // String (default)
    return value;
  }

  /**
   * Escape special regex characters
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Parse and apply sorting
   * Format: sort=field1:asc,field2:desc
   */
  sort() {
    if (this.queryString.sort) {
      const sortFields = this.queryString.sort.split(',');
      
      sortFields.forEach(field => {
        const [fieldName, order] = field.split(':');
        
        // Check if field is allowed
        if (this.config.allowedFields && !this.config.allowedFields.includes(fieldName.trim())) {
          return; // Skip non-whitelisted fields
        }
        
        this.sortOptions[fieldName.trim()] = order === 'desc' ? -1 : 1;
      });
    } else if (this.config.defaultSort) {
      // Apply default sort if no sort specified
      this.sortOptions = this.config.defaultSort;
    }

    return this;
  }

  /**
   * Parse field selection
   * Format: select=field1,field2,field3 or fields=field1,field2,field3
   */
  limitFields() {
    const selectParam = this.queryString.select || this.queryString.fields;
    
    if (selectParam) {
      const fields = selectParam.split(',').map(f => f.trim());
      
      // Validate fields
      if (this.config.allowedFields) {
        const validFields = fields.filter(f => this.config.allowedFields.includes(f));
        this.selectFields = validFields.join(' ');
      } else {
        this.selectFields = fields.join(' ');
      }
    }

    return this;
  }

  /**
   * Parse pagination parameters
   */
  paginate() {
    const page = parseInt(this.queryString.page) || 1;
    const limit = parseInt(this.queryString.limit) || this.config.defaultLimit || 50;
    
    // Apply max limit if configured
    const maxLimit = this.config.maxLimit || 100;
    this.limit = Math.min(limit, maxLimit);
    
    this.page = Math.max(1, page);
    this.skip = (this.page - 1) * this.limit;

    return this;
  }

  /**
   * Build and return the query
   */
  build() {
    let query = this.model.find(this.mongoQuery);

    // Apply sorting
    if (Object.keys(this.sortOptions).length > 0) {
      query = query.sort(this.sortOptions);
    }

    // Apply field selection
    if (this.selectFields) {
      query = query.select(this.selectFields);
    }

    // Apply pagination
    query = query.skip(this.skip).limit(this.limit);

    return query;
  }

  /**
   * Get count query for pagination metadata
   */
  async countDocuments() {
    return await this.model.countDocuments(this.mongoQuery);
  }

  /**
   * Get the mongo query object (for debugging or custom usage)
   */
  getQuery() {
    return this.mongoQuery;
  }

  /**
   * Get pagination metadata
   */
  getPaginationMeta(total) {
    return {
      page: this.page,
      limit: this.limit,
      total,
      totalPages: Math.ceil(total / this.limit),
      hasNextPage: this.page < Math.ceil(total / this.limit),
      hasPrevPage: this.page > 1
    };
  }
}

module.exports = QueryBuilder;

