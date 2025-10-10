# FlutterFlow Import Guide

This guide will help you import the Swagger/OpenAPI specification into FlutterFlow for your Sustainable Construction Management API.

## 📦 Available Files

You have two Swagger files available for import:
- **swagger.yaml** - YAML format (recommended)
- **swagger.json** - JSON format

Both files contain the exact same API specifications. Choose whichever format you prefer.

## 🚀 How to Import into FlutterFlow

### Step 1: Update the Server URL

Before importing, update the server URL in the Swagger file to point to your actual backend:

1. Open `swagger.yaml` (or `swagger.json`)
2. Find the `servers` section (around line 12-17)
3. Update the production server URL:

```yaml
servers:
  - url: http://localhost:5000
    description: Local development server
  - url: https://your-actual-backend-url.com  # <-- Update this
    description: Production server
```

### Step 2: Import into FlutterFlow

1. **Open your FlutterFlow project**

2. **Navigate to API Calls**
   - Click on the "API Calls" option in the left sidebar
   - Click on the "+" button to add a new API group

3. **Import OpenAPI Specification**
   - Click on "Import OpenAPI" icon
   - Click "Upload File"
   - Select either `swagger.yaml` or `swagger.json` from your backend directory
   - Click "Import"

4. **Verify Import**
   - After successful import, FlutterFlow will display all API endpoints organized by tags:
     - Health
     - Projects
     - Tasks
     - Materials
     - Budget
     - Documents
     - Dashboard

### Step 3: Configure Authentication

The API uses Firebase Authentication. You need to configure the authorization header:

1. **At the API Group Level:**
   - Select the imported API group
   - Go to "API Group Settings"
   - Add a header:
     - **Header Name**: `Authorization`
     - **Header Value**: `Bearer [user_token]` (use FlutterFlow's auth token variable)

2. **Make the API Group Private (Recommended):**
   - Enable "Private API" option in the group settings
   - This will route requests through a cloud function, keeping your API secure

### Step 4: Test API Calls

1. Select any API endpoint (e.g., "Get all projects")
2. Configure any required parameters:
   - For most endpoints, you'll need `projectId` as a query parameter
   - FlutterFlow will show all required and optional parameters
3. Click "Test API Call" to verify it works
4. Check the response to ensure data is being returned correctly

## 🔑 API Authentication

All API endpoints (except `/health`) require Firebase authentication:

- **Security Scheme**: Bearer Token (JWT)
- **Header Name**: Authorization
- **Header Value**: `Bearer {firebase_token}`

In FlutterFlow, use the built-in authentication token variable:
```
Bearer <user_auth_token>
```

## 📋 Key API Endpoints

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/{id}` - Get project details
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Tasks
- `GET /api/tasks` - Get all tasks (requires `projectId`)
- `POST /api/tasks` - Create new task
- `GET /api/tasks/statistics` - Get task statistics
- `GET /api/tasks/timeline` - Get task timeline/gantt data
- `POST /api/tasks/{id}/photos` - Upload task photos (multipart/form-data)

### Materials
- `GET /api/materials` - Get all materials (requires `projectId`)
- `POST /api/materials` - Add new material
- `GET /api/materials/estimation` - Get AI-based material estimation
- `GET /api/materials/sustainability` - Get sustainability metrics
- `POST /api/materials/{id}/usage` - Log material usage
- `POST /api/materials/{id}/waste` - Log material waste

### Budget
- `GET /api/budget` - Get budget overview (requires `projectId`)
- `POST /api/budget` - Create project budget
- `GET /api/budget/expenses` - Get all expenses
- `POST /api/budget/expenses` - Log new expense
- `GET /api/budget/cost-prediction` - Get AI cost predictions
- `POST /api/budget/optimize` - Get AI optimization suggestions

### Documents
- `GET /api/documents` - Get all documents (requires `projectId`)
- `POST /api/documents/upload` - Upload document (multipart/form-data)
- `GET /api/documents/{id}/download` - Download document
- `POST /api/documents/{id}/extract-text` - Extract text using AI
- `POST /api/documents/{id}/generate-tasks` - Generate tasks from document
- `POST /api/documents/{id}/process` - Process document (extract + generate)

### Dashboard
- `GET /api/dashboard/overview` - Get project overview
- `GET /api/dashboard/analytics` - Get analytics and trends
- `GET /api/dashboard/weather` - Get weather data
- `GET /api/dashboard/sustainability-score` - Get sustainability score

## 🎯 Common Query Parameters

Most endpoints support these query parameters:

- **projectId** (required for most endpoints): Filter by project
- **page** (optional): Page number for pagination (default: 1)
- **limit** (optional): Items per page (default: 10)
- **status** (optional): Filter by status
- **category** (optional): Filter by category

## 📝 Request Body Examples

### Create Project
```json
{
  "name": "Green Building Complex",
  "description": "Eco-friendly residential complex",
  "location": "Colombo, Sri Lanka",
  "startDate": "2024-01-01T00:00:00Z",
  "expectedEndDate": "2024-12-31T00:00:00Z",
  "projectType": "residential",
  "projectSize": {
    "value": 5000,
    "unit": "sqft"
  },
  "owner": "John Doe",
  "createdBy": "user@example.com",
  "teamSize": 10
}
```

### Create Task
```json
{
  "projectId": "507f1f77bcf86cd799439011",
  "title": "Install solar panels",
  "description": "Install 20 solar panels on the roof",
  "priority": "high",
  "deadline": "2024-06-30T00:00:00Z",
  "assignedTo": ["worker1@example.com"],
  "assignedBy": "manager@example.com"
}
```

### Log Expense
```json
{
  "projectId": "507f1f77bcf86cd799439011",
  "category": "materials",
  "amount": 50000,
  "description": "Purchase of steel bars",
  "vendor": "Green Materials Ltd",
  "paymentStatus": "pending"
}
```

## 🔄 File Upload Endpoints

Some endpoints accept file uploads (multipart/form-data):

1. **Upload Task Photos** (`POST /api/tasks/{id}/photos`)
   - Field name: `photos`
   - Max files: 10
   - Supported formats: Images

2. **Upload Document** (`POST /api/documents/upload`)
   - Field name: `document`
   - Required fields: `projectId`, `uploadedBy`
   - Optional: `category`, `description`, `tags`

## ⚠️ Important Notes

1. **Always include Firebase Auth Token**: All API calls (except health check) require authentication
2. **Handle Pagination**: Most list endpoints return paginated results
3. **Error Handling**: All errors follow the same format:
   ```json
   {
     "status": "error",
     "message": "Error description",
     "error": "Detailed error info"
   }
   ```
4. **Response Format**: All successful responses follow this format:
   ```json
   {
     "status": "success",
     "data": { /* response data */ }
   }
   ```

## 🛠️ Troubleshooting

### Import Issues

**Problem**: Import fails or shows errors
- **Solution**: Ensure you're using OpenAPI 3.0+ compatible version
- Verify the YAML/JSON file is valid
- Check that all required fields are present

**Problem**: API calls return 401 Unauthorized
- **Solution**: Verify Firebase token is being sent correctly
- Check token expiration
- Ensure Authorization header format is `Bearer {token}`

**Problem**: API calls return 404 Not Found
- **Solution**: Verify server URL is correct
- Check that the endpoint path is correct
- Ensure backend server is running

### Re-importing Updated Swagger File

If you need to update the API specification:

1. **Manual Update (Recommended)**:
   - Update individual API calls in FlutterFlow
   - This prevents breaking existing references in your app

2. **Full Re-import**:
   - Delete the old API group
   - Import the new Swagger file
   - Re-configure all API calls in your app
   - ⚠️ This will break existing API references

## 📚 Additional Resources

- [FlutterFlow API Documentation](https://docs.flutterflow.io/resources/backend-logic/create-test-api)
- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- Backend API Documentation: See `docs/API_DOCUMENTATION.md`
- API Examples: See `docs/API_EXAMPLES.md`

## 🎉 Next Steps

After importing:

1. **Test all critical endpoints** in FlutterFlow
2. **Set up authentication flow** with Firebase
3. **Create API call actions** in your app pages
4. **Handle loading states and errors** appropriately
5. **Test with real data** from your backend

---

**Need Help?**
- Check the backend documentation in the `docs/` folder
- Review API examples in `docs/API_EXAMPLES.md`
- Test endpoints using the health check: `GET /health`

