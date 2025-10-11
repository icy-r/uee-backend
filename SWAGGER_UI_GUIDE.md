# Swagger UI - API Testing Guide

**Status:** ✅ Enabled and Working  
**Date:** October 11, 2025

## Access Swagger UI

### Local Development
- **URL:** http://localhost:5000/api-docs
- **Root:** http://localhost:5000/ (auto-redirects to API docs)

### Production
- **URL:** https://api.uee.icy-r.dev/api-docs
- **Root:** https://api.uee.icy-r.dev/ (auto-redirects to API docs)

## Features Enabled

✅ **Try It Out** - Test endpoints directly from the UI  
✅ **Persistent Authorization** - Auth tokens stay saved  
✅ **Request Duration** - See how long requests take  
✅ **Filter/Search** - Find endpoints quickly  
✅ **Custom Styling** - Clean interface without default branding

## How to Use

### 1. **Open in Browser**
```bash
# Local
http://localhost:5000/api-docs

# Production
https://api.uee.icy-r.dev/api-docs
```

### 2. **Select Server**
At the top of Swagger UI, select:
- `http://localhost:5000` for local testing
- `https://api.uee.icy-r.dev` for production testing

### 3. **Test an Endpoint**

**Example: Test Document Upload**

1. Find **Documents** section
2. Click on `POST /api/documents/upload`
3. Click **"Try it out"** button
4. Fill in parameters:
   ```
   projectId: 68e762e50c832c2d142ffb21
   category: photo
   description: Test upload from Swagger
   document: [Choose file]
   ```
5. Click **"Execute"**
6. See the response below!

**Example: Test Text Extraction**

1. Find **Documents** section
2. Click on `POST /api/documents/{id}/extract-text`
3. Click **"Try it out"**
4. Enter document ID from previous upload
5. Click **"Execute"**
6. Watch Gemini/Tesseract OCR work! 🚀

### 4. **View Responses**

Swagger shows:
- **Response Code** (200, 201, 400, 500, etc.)
- **Response Body** (JSON data)
- **Response Headers**
- **Request Duration** (how long it took)

### 5. **Download Response**

Click the **"Download"** button to save response as JSON file.

## Available API Sections

### 🏥 Health
- `GET /health` - Check server status

### 📊 Dashboard
- `GET /api/dashboard/overview` - Project overview
- `GET /api/dashboard/analytics` - Analytics data
- `GET /api/dashboard/weather` - Weather info
- `GET /api/dashboard/sustainability-score` - Sustainability metrics

### 📋 Tasks
- `POST /api/tasks` - Create new task
- `GET /api/tasks` - List all tasks
- `GET /api/tasks/{id}` - Get task details
- `PUT /api/tasks/{id}` - Update task
- `PUT /api/tasks/{id}/progress` - Update progress
- `POST /api/tasks/{id}/time-log` - Log time
- `POST /api/tasks/{id}/photos` - Upload photos

### 🧱 Materials
- `POST /api/materials` - Add material
- `GET /api/materials` - List materials
- `GET /api/materials/{id}` - Get material details
- `PUT /api/materials/{id}` - Update material
- `POST /api/materials/{id}/usage` - Log usage
- `POST /api/materials/{id}/waste` - Log waste
- `GET /api/materials/estimation` - AI estimation
- `GET /api/materials/sustainability` - Sustainability metrics

### 💰 Budget
- `POST /api/budget` - Create budget
- `GET /api/budget` - Get budget
- `POST /api/budget/expenses` - Add expense
- `GET /api/budget/expenses` - List expenses
- `PUT /api/budget/{projectId}/expenses/{id}` - Update expense
- `DELETE /api/budget/{projectId}/expenses/{id}` - Delete expense
- `GET /api/budget/report` - Generate report
- `GET /api/budget/cost-prediction` - AI cost prediction
- `POST /api/budget/optimize` - AI budget optimization

### 📄 Documents (Gemini AI)
- `POST /api/documents/upload` - Upload document
- `GET /api/documents` - List documents
- `GET /api/documents/{id}` - Get document
- `PUT /api/documents/{id}` - Update document
- `DELETE /api/documents/{id}` - Delete document
- `POST /api/documents/{id}/extract-text` - **Extract text (Gemini/Tesseract)**
- `POST /api/documents/{id}/generate-tasks` - **Generate tasks (Gemini AI)**
- `POST /api/documents/{id}/process` - **Complete processing (Extract + Generate)**
- `GET /api/documents/{id}/download` - Download document
- `GET /api/documents/statistics` - Document stats

## Tips & Tricks

### 1. **Use Query Parameters**
Many endpoints support filtering:
```
GET /api/tasks?projectId=xxx&status=in_progress&priority=high
```

### 2. **Save Common Values**
Use browser's localStorage to save:
- Project IDs
- Document IDs
- Common parameters

### 3. **Copy as cURL**
Click the **"Copy"** button to get a cURL command you can use in terminal!

### 4. **Test with Real Data**
- Upload actual construction images
- Test text extraction with permits/plans
- Generate real tasks from documents

### 5. **Check Response Times**
Monitor API performance with the built-in duration display.

## Common Test Workflows

### Workflow 1: Complete Document Processing
```
1. POST /api/documents/upload
   → Get document ID

2. POST /api/documents/{id}/process
   → Extract text + Generate tasks

3. GET /api/documents/{id}
   → Verify processing complete

4. GET /api/tasks?projectId=xxx
   → See generated tasks
```

### Workflow 2: Material Management
```
1. POST /api/materials
   → Add material

2. POST /api/materials/{id}/usage
   → Log usage

3. GET /api/materials/sustainability
   → Check sustainability metrics

4. GET /api/dashboard/sustainability-score
   → View overall score
```

### Workflow 3: Budget Tracking
```
1. POST /api/budget
   → Create budget

2. POST /api/budget/expenses
   → Add expenses

3. GET /api/budget/report
   → Generate report

4. POST /api/budget/optimize
   → Get AI optimization suggestions
```

## Troubleshooting

### Issue: "Failed to fetch"
**Fix:** Make sure the server is running
```bash
# Check server status
http GET http://localhost:5000/health
```

### Issue: "CORS error"
**Fix:** Server has CORS enabled by default. If issues persist, check browser console.

### Issue: "404 Not Found"
**Fix:** Ensure you've selected the correct server (localhost vs production)

### Issue: "Validation error"
**Fix:** Check required fields (marked with red asterisk *)

## Development Notes

### Files Modified
- `server.js` - Added Swagger UI middleware
- `swagger.json` - Updated with production URL
- `package.json` - Added swagger-ui-express dependency

### Customizations
- Hidden default Swagger topbar
- Custom site title: "Sustainable Construction API"
- Enabled persistent authorization
- Enabled request duration display
- Enabled filter/search
- Auto-redirect from root to /api-docs

## Next Steps

1. ✅ Open Swagger UI in browser
2. ✅ Test each endpoint section
3. ✅ Try document upload + processing
4. ✅ Test AI features (text extraction, task generation)
5. ✅ Monitor request durations
6. ✅ Use for development and debugging

---

**Happy Testing!** 🚀

Access now: **http://localhost:5000/api-docs** or **https://api.uee.icy-r.dev/api-docs**

