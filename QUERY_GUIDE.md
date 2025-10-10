# OData-like Query System Guide

## Overview

The backend now supports flexible, OData-inspired query filtering that allows you to filter, sort, paginate, and select fields dynamically on any API endpoint that returns lists of data.

## Supported Endpoints

- `GET /api/materials` - Material inventory
- `GET /api/tasks` - Tasks
- `GET /api/projects` - Projects
- `GET /api/documents` - Documents
- `GET /api/budget/{budgetId}/expenses` - Budget expenses (future implementation)

## Query Operators

### Comparison Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` (default) | Equals | `category=cement` or `category[eq]=cement` |
| `ne` | Not equals | `status[ne]=completed` |
| `gt` | Greater than | `quantity[gt]=100` |
| `gte` | Greater than or equals | `quantity[gte]=50` |
| `lt` | Less than | `deadline[lt]=2025-12-31` |
| `lte` | Less than or equals | `unitCost[lte]=1000` |

### String Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `contains` | Contains substring (case-insensitive) | `name[contains]=steel` |
| `startsWith` | Starts with (case-insensitive) | `name[startsWith]=cement` |
| `endsWith` | Ends with (case-insensitive) | `name[endsWith]=grade` |

### Array Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `in` | Value in list (comma-separated) | `category[in]=cement,steel,wood` |
| `nin` | Value not in list | `status[nin]=cancelled,completed` |

## Query Parameters

### Filtering

Filter by any field in the model using operators:

```bash
# Simple equality (default operator)
GET /api/materials?projectId=123&category=cement

# Greater than
GET /api/materials?projectId=123&quantity[gt]=100

# Multiple filters (AND logic)
GET /api/materials?projectId=123&category=cement&quantity[gte]=50&ecoFriendly=true

# String contains
GET /api/materials?projectId=123&name[contains]=steel

# In operator (OR logic for single field)
GET /api/materials?projectId=123&category[in]=cement,steel,wood
```

### Sorting

Sort by one or multiple fields:

```bash
# Single field ascending
GET /api/materials?projectId=123&sort=name:asc

# Single field descending
GET /api/materials?projectId=123&sort=quantity:desc

# Multiple fields
GET /api/materials?projectId=123&sort=category:asc,quantity:desc
```

### Field Selection

Select specific fields to return (reduces payload size):

```bash
# Select specific fields
GET /api/materials?projectId=123&select=name,quantity,unit,category

# Alternative syntax
GET /api/materials?projectId=123&fields=name,quantity,unit
```

### Pagination

Control page size and pagination:

```bash
# Default pagination (page 1, limit 50)
GET /api/materials?projectId=123

# Custom page and limit
GET /api/materials?projectId=123&page=2&limit=20

# Maximum limit is enforced (usually 100)
GET /api/materials?projectId=123&limit=200  # Will be capped at 100
```

## Complete Examples

### Materials API

```bash
# Get all cement materials with quantity > 100, sorted by price
GET /api/materials?projectId=123&category=cement&quantity[gt]=100&sort=unitCost:asc

# Get eco-friendly materials
GET /api/materials?projectId=123&ecoFriendly=true

# Get materials with names containing "steel"
GET /api/materials?projectId=123&name[contains]=steel

# Get materials in multiple categories
GET /api/materials?projectId=123&category[in]=cement,steel,wood

# Complex query with multiple filters, sorting, and pagination
GET /api/materials?projectId=123&category[in]=cement,steel&quantity[gte]=50&ecoFriendly=true&sort=quantity:desc,name:asc&page=1&limit=20

# Get only specific fields
GET /api/materials?projectId=123&select=name,quantity,unit&sort=name:asc
```

### Tasks API

```bash
# Get overdue tasks
GET /api/tasks?projectId=123&deadline[lt]=2025-10-10

# Get high priority tasks in progress
GET /api/tasks?projectId=123&priority=high&status=in_progress

# Get tasks assigned to specific workers
GET /api/tasks?projectId=123&assignedTo[in]=worker1@email.com,worker2@email.com

# Get tasks with deadline in next 7 days
GET /api/tasks?projectId=123&deadline[gte]=2025-10-10&deadline[lte]=2025-10-17

# Get completed tasks, sorted by completion date
GET /api/tasks?projectId=123&status=completed&sort=completedAt:desc

# Get tasks with title containing "foundation"
GET /api/tasks?projectId=123&title[contains]=foundation
```

### Projects API

```bash
# Get active projects
GET /api/projects?status=in_progress

# Get projects with sustainability score > 70
GET /api/projects?sustainabilityScore[gt]=70

# Get projects by type
GET /api/projects?projectType[in]=residential,commercial

# Get projects starting after a date
GET /api/projects?startDate[gte]=2025-01-01

# Get projects by location containing "New York"
GET /api/projects?location[contains]=New York

# Complex query
GET /api/projects?status=in_progress&progressPercentage[gte]=50&sort=progressPercentage:desc
```

### Documents API

```bash
# Get documents by category
GET /api/documents?projectId=123&category=plan

# Get processed documents
GET /api/documents?projectId=123&isProcessed=true

# Get documents uploaded this month
GET /api/documents?projectId=123&createdAt[gte]=2025-10-01

# Get image documents
GET /api/documents?projectId=123&fileType[contains]=image

# Get documents with specific tags
GET /api/documents?projectId=123&tags[contains]=important

# Get documents by size (larger than 1MB)
GET /api/documents?projectId=123&fileSize[gt]=1048576
```

## Response Format

All responses maintain the same format:

```json
{
  "success": true,
  "message": "Materials retrieved successfully",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

## Security Features

### Field Whitelisting

Only fields defined in the configuration can be queried. Attempting to query non-whitelisted fields will silently ignore those filters.

**Allowed fields per model:**

**Materials:**
- projectId, name, category, quantity, unit, unitCost, supplier, ecoFriendly, reorderLevel, createdAt, updatedAt

**Tasks:**
- projectId, title, description, status, priority, deadline, assignedTo, assignedBy, completedAt, createdAt, updatedAt

**Projects:**
- name, description, location, startDate, expectedEndDate, actualEndDate, status, progressPercentage, sustainabilityScore, teamSize, projectType, owner, createdBy, createdAt, updatedAt

**Documents:**
- projectId, filename, originalName, fileType, fileSize, category, description, tags, uploadedBy, isProcessed, processingStatus, createdAt, updatedAt

### Operator Validation

Only supported operators are allowed. Invalid operators are silently ignored.

### Input Sanitization

All input values are sanitized to prevent NoSQL injection attacks.

### Rate Limiting

Consider implementing rate limiting on complex queries to prevent abuse.

## Data Types

The system automatically converts query values to appropriate types:

- **Boolean:** `true`, `false` → boolean
- **Number:** `123`, `45.67` → number
- **Date:** `2025-10-10`, `2025-10-10T12:00:00Z` → Date object
- **String:** everything else → string

## Limitations

1. **AND Logic Only:** Multiple filters on different fields use AND logic. For OR logic on different fields, make separate requests.

2. **Single OR per Field:** The `in` operator provides OR logic for a single field only.

3. **Max Limit:** Pagination limit is capped (usually at 100 items per page).

4. **Nested Fields:** Currently doesn't support deep nested field filtering (e.g., `usageLog.quantity`).

5. **Aggregations:** No built-in support for aggregations like sum, avg, etc. Use dedicated endpoints for statistics.

## Best Practices

### 1. Always Include Required Fields

```bash
# Good: includes projectId
GET /api/materials?projectId=123&category=cement

# Bad: missing projectId (will return error)
GET /api/materials?category=cement
```

### 2. Use Appropriate Operators

```bash
# Good: use gt for numeric comparisons
GET /api/materials?quantity[gt]=100

# Less efficient: using contains for numbers
GET /api/materials?quantity[contains]=100
```

### 3. Limit Fields for Performance

```bash
# Good: only select needed fields
GET /api/materials?projectId=123&select=name,quantity,unit

# Less efficient: returning all fields
GET /api/materials?projectId=123
```

### 4. Use Pagination for Large Datasets

```bash
# Good: paginate large results
GET /api/materials?projectId=123&page=1&limit=50

# Bad: trying to fetch all data at once
GET /api/materials?projectId=123&limit=10000
```

### 5. Combine Filters for Specificity

```bash
# Good: specific query reduces result set
GET /api/tasks?projectId=123&status=in_progress&priority=high&deadline[lt]=2025-12-31

# Less efficient: broad query returns too much data
GET /api/tasks?projectId=123
```

## Error Handling

### Missing Required Fields

```json
{
  "success": false,
  "message": "Project ID is required",
  "error": "Validation Error"
}
```

### Invalid Operator (silently ignored)

Invalid operators are ignored, and the query proceeds with valid filters.

### Invalid Field (silently ignored)

Non-whitelisted fields are ignored, and the query proceeds with valid fields.

## Integration with FlutterFlow

### Creating API Calls in FlutterFlow

1. **Base URL:** Set your backend URL (e.g., `https://your-domain.com` or `http://localhost:5000`)

2. **Create API Group:** "ConstructionAPI" or similar

3. **Add API Call:**
   - Method: GET
   - Path: `/api/materials`
   - Query Parameters: Define as variables
   
4. **Dynamic Query Building:**

```dart
// Example: Build query params dynamically
Map<String, String> queryParams = {
  'projectId': projectId,
  'category': selectedCategory,
  'sort': 'name:asc',
  'page': currentPage.toString(),
  'limit': '20'
};

if (minQuantity != null) {
  queryParams['quantity[gte]'] = minQuantity.toString();
}

if (searchTerm.isNotEmpty) {
  queryParams['name[contains]'] = searchTerm;
}
```

### Example FlutterFlow API Configuration

```
API Call Name: GetMaterials
Method: GET
URL: {{baseURL}}/api/materials
Query Parameters:
  - projectId (required)
  - category (optional)
  - quantity[gte] (optional)
  - ecoFriendly (optional)
  - name[contains] (optional)
  - sort (optional)
  - page (optional, default: 1)
  - limit (optional, default: 50)
```

## Migration from Old API

The new query system is **backward compatible**. Old queries still work:

```bash
# Old style (still works)
GET /api/materials?projectId=123&category=cement&ecoFriendly=true

# New style (with operators)
GET /api/materials?projectId=123&category[eq]=cement&ecoFriendly[eq]=true
```

No changes needed to existing API calls, but you can gradually adopt the new operators for more advanced filtering.

## Troubleshooting

### Query Not Filtering Correctly

1. Check if field name is correct (case-sensitive)
2. Verify field is in the allowed list
3. Ensure operator is supported
4. Check data type (string vs number vs boolean)

### No Results Returned

1. Verify filters aren't too restrictive
2. Check if data exists in database
3. Test without filters first
4. Check pagination (might be on wrong page)

### Performance Issues

1. Reduce page limit
2. Use field selection to limit returned data
3. Add indexes to frequently queried fields in MongoDB
4. Avoid complex regex queries on large datasets

## Future Enhancements

- [ ] OR logic across different fields
- [ ] Nested field filtering
- [ ] Full-text search
- [ ] Geospatial queries
- [ ] Aggregation pipeline support
- [ ] Query result caching
- [ ] GraphQL-style query language

## Support

For questions or issues:
1. Check this guide
2. Review API documentation in `/docs`
3. Test queries using tools like Postman or curl
4. Check backend logs for errors

---

**Last Updated:** October 10, 2025
**Version:** 1.0.0

