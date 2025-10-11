# API Examples and Test Requests

This document provides ready-to-use examples for testing all API endpoints.

## Prerequisites

Replace `YOUR_PROJECT_ID` with an actual project ID from your MongoDB database.

## Table of Contents
1. [Dashboard Examples](#dashboard-examples)
2. [Material Management Examples](#material-management-examples)
3. [Task Management Examples](#task-management-examples)
4. [Budget Management Examples](#budget-management-examples)
5. [Document Management Examples](#document-management-examples)

---

## Dashboard Examples

### 1. Get Project Overview

```bash
curl -X GET "http://localhost:5000/api/dashboard/overview?projectId=YOUR_PROJECT_ID"
```

### 2. Get Analytics

```bash
curl -X GET "http://localhost:5000/api/dashboard/analytics?projectId=YOUR_PROJECT_ID"
```

### 3. Get Weather Data

```bash
# Using location
curl -X GET "http://localhost:5000/api/dashboard/weather?location=Colombo,LK"

# Using project ID
curl -X GET "http://localhost:5000/api/dashboard/weather?projectId=YOUR_PROJECT_ID"
```

### 4. Get Sustainability Score

```bash
curl -X GET "http://localhost:5000/api/dashboard/sustainability-score?projectId=68e762e50c832c2d142ffb21"
```

---

## Material Management Examples

### 1. Add Material

```bash
curl -X POST "http://localhost:5000/api/materials" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "YOUR_PROJECT_ID",
    "name": "Portland Cement",
    "category": "cement",
    "quantity": 150,
    "unit": "bag",
    "unitCost": 850,
    "supplier": "ABC Construction Supplies",
    "ecoFriendly": false,
    "description": "Type I Portland Cement for general construction",
    "reorderLevel": 30
  }'
```

### 2. Get All Materials

```bash
curl -X GET "http://localhost:5000/api/materials?projectId=YOUR_PROJECT_ID"
```

### 3. Filter Eco-Friendly Materials

```bash
curl -X GET "http://localhost:5000/api/materials?projectId=YOUR_PROJECT_ID&ecoFriendly=true"
```

### 4. Get Material by ID

```bash
curl -X GET "http://localhost:5000/api/materials/MATERIAL_ID"
```

### 5. Update Material

```bash
curl -X PUT "http://localhost:5000/api/materials/MATERIAL_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 200,
    "unitCost": 900
  }'
```

### 6. Log Material Usage

```bash
curl -X POST "http://localhost:5000/api/materials/MATERIAL_ID/usage" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 20,
    "usedFor": "Foundation work for Block A",
    "notes": "Used in concrete mix for foundation"
  }'
```

### 7. Log Material Waste

```bash
curl -X POST "http://localhost:5000/api/materials/MATERIAL_ID/waste" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 3,
    "reason": "Damaged during transport",
    "notes": "Bags were torn and cement hardened"
  }'
```

### 8. Get AI Material Estimation

```bash
curl -X GET "http://localhost:5000/api/materials/estimation?projectId=YOUR_PROJECT_ID"
```

### 9. Get Sustainability Metrics

```bash
curl -X GET "http://localhost:5000/api/materials/sustainability?projectId=YOUR_PROJECT_ID"
```

### 10. Get Inventory Status

```bash
curl -X GET "http://localhost:5000/api/materials/inventory-status?projectId=YOUR_PROJECT_ID"
```

---

## Task Management Examples

### 1. Create Task

```bash
curl -X POST "http://localhost:5000/api/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "YOUR_PROJECT_ID",
    "title": "Install electrical wiring - First Floor",
    "description": "Complete electrical wiring installation for all rooms on the first floor including switch boxes and outlets",
    "deadline": "2024-11-30",
    "assignedTo": ["worker1@example.com", "worker2@example.com"],
    "assignedBy": "supervisor@example.com",
    "priority": "high",
    "status": "not_started"
  }'
```

### 2. Get All Tasks

```bash
curl -X GET "http://localhost:5000/api/tasks?projectId=YOUR_PROJECT_ID"
```

### 3. Filter Tasks by Status

```bash
curl -X GET "http://localhost:5000/api/tasks?projectId=YOUR_PROJECT_ID&status=in_progress"
```

### 4. Get Overdue Tasks

```bash
curl -X GET "http://localhost:5000/api/tasks?projectId=YOUR_PROJECT_ID&overdue=true"
```

### 5. Get Task by ID

```bash
curl -X GET "http://localhost:5000/api/tasks/TASK_ID"
```

### 6. Update Task

```bash
curl -X PUT "http://localhost:5000/api/tasks/TASK_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Install electrical wiring - First Floor (Updated)",
    "priority": "medium"
  }'
```

### 7. Update Task Progress

```bash
curl -X PUT "http://localhost:5000/api/tasks/TASK_ID/progress" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "notes": "Started work on main electrical panel installation"
  }'
```

### 8. Upload Task Photos

```bash
curl -X POST "http://localhost:5000/api/tasks/TASK_ID/photos" \
  -F "photos=@/path/to/photo1.jpg" \
  -F "photos=@/path/to/photo2.jpg" \
  -F "caption=Work progress on electrical installation"
```

### 9. Log Time

```bash
curl -X POST "http://localhost:5000/api/tasks/TASK_ID/time-log" \
  -H "Content-Type: application/json" \
  -d '{
    "hours": 6.5,
    "description": "Installed main panel, ran conduits, and connected first 10 circuits",
    "date": "2024-10-08"
  }'
```

### 10. Get Task Statistics

```bash
curl -X GET "http://localhost:5000/api/tasks/statistics?projectId=YOUR_PROJECT_ID"
```

### 11. Get Task Timeline

```bash
curl -X GET "http://localhost:5000/api/tasks/timeline?projectId=YOUR_PROJECT_ID"
```

---

## Budget Management Examples

### 1. Create Budget

```bash
curl -X POST "http://localhost:5000/api/budget" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "YOUR_PROJECT_ID",
    "totalBudget": 1500000,
    "allocations": {
      "materials": 600000,
      "labor": 500000,
      "equipment": 250000,
      "other": 150000
    },
    "contingencyPercentage": 10
  }'
```

### 2. Get Budget Overview

```bash
curl -X GET "http://localhost:5000/api/budget?projectId=YOUR_PROJECT_ID"
```

### 3. Log Expense

```bash
curl -X POST "http://localhost:5000/api/budget/expenses" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "YOUR_PROJECT_ID",
    "category": "materials",
    "amount": 45000,
    "description": "Cement and steel rebar delivery - October batch",
    "date": "2024-10-08",
    "invoiceNumber": "INV-2024-1001",
    "vendor": "ABC Construction Supplies"
  }'
```

### 4. Get All Expenses

```bash
curl -X GET "http://localhost:5000/api/budget/expenses?projectId=YOUR_PROJECT_ID"
```

### 5. Filter Expenses by Category

```bash
curl -X GET "http://localhost:5000/api/budget/expenses?projectId=YOUR_PROJECT_ID&category=materials"
```

### 6. Filter Expenses by Date Range

```bash
curl -X GET "http://localhost:5000/api/budget/expenses?projectId=YOUR_PROJECT_ID&startDate=2024-10-01&endDate=2024-10-31"
```

### 7. Update Expense

```bash
curl -X PUT "http://localhost:5000/api/budget/YOUR_PROJECT_ID/expenses/EXPENSE_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 47000,
    "description": "Cement and steel rebar delivery - October batch (Updated amount)"
  }'
```

### 8. Delete Expense

```bash
curl -X DELETE "http://localhost:5000/api/budget/YOUR_PROJECT_ID/expenses/EXPENSE_ID"
```

### 9. Generate Expense Report

```bash
curl -X GET "http://localhost:5000/api/budget/report?projectId=YOUR_PROJECT_ID"

# With date range
curl -X GET "http://localhost:5000/api/budget/report?projectId=YOUR_PROJECT_ID&startDate=2024-01-01&endDate=2024-10-31"
```

### 10. Get AI Cost Prediction

```bash
curl -X GET "http://localhost:5000/api/budget/cost-prediction?projectId=YOUR_PROJECT_ID&timeframe=6"
```

### 11. Get AI Budget Optimization

```bash
curl -X POST "http://localhost:5000/api/budget/optimize" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "YOUR_PROJECT_ID"
  }'
```

### 12. Get Budget Analytics

```bash
curl -X GET "http://localhost:5000/api/budget/analytics?projectId=YOUR_PROJECT_ID"
```

---

## Document Management Examples

### 1. Upload Document

```bash
curl -X POST "http://localhost:5000/api/documents/upload" \
  -F "document=@/path/to/construction_plan.pdf" \
  -F "projectId=YOUR_PROJECT_ID" \
  -F "category=plan" \
  -F "description=Main construction plan for the project" \
  -F 'tags=["blueprint", "approved", "phase1"]'
```

### 2. Upload Image Document

```bash
curl -X POST "http://localhost:5000/api/documents/upload" \
  -F "document=@/path/to/permit.jpg" \
  -F "projectId=YOUR_PROJECT_ID" \
  -F "category=permit" \
  -F "description=Building permit from local authority"
```

### 3. Get All Documents

```bash
curl -X GET "http://localhost:5000/api/documents?projectId=YOUR_PROJECT_ID"
```

### 4. Filter Documents by Category

```bash
curl -X GET "http://localhost:5000/api/documents?projectId=YOUR_PROJECT_ID&category=plan"
```

### 5. Get Processed Documents

```bash
curl -X GET "http://localhost:5000/api/documents?projectId=YOUR_PROJECT_ID&isProcessed=true"
```

### 6. Get Document by ID

```bash
curl -X GET "http://localhost:5000/api/documents/DOCUMENT_ID"
```

### 7. Update Document

```bash
curl -X PUT "http://localhost:5000/api/documents/DOCUMENT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "permit",
    "description": "Updated building permit with amendments",
    "tags": ["permit", "approved", "amended"]
  }'
```

### 8. Download Document

```bash
curl -X GET "http://localhost:5000/api/documents/DOCUMENT_ID/download" \
  --output downloaded_document.pdf
```

### 9. Extract Text from Image (Gemini AI)

```bash
# Uses Google Gemini Vision for OCR
# Falls back to Cloud Vision API if Gemini fails
curl -X POST "http://localhost:5000/api/documents/DOCUMENT_ID/extract-text"
```

### 10. Generate Tasks from Document (Gemini AI)

```bash
# Uses Google Gemini AI to analyze document and generate tasks
curl -X POST "http://localhost:5000/api/documents/DOCUMENT_ID/generate-tasks"
```

### 11. Process Document (Extract + Generate Tasks)

```bash
# Complete workflow: Extract text with Gemini Vision, then generate tasks
curl -X POST "http://localhost:5000/api/documents/DOCUMENT_ID/process"
```

### 12. Get Document Statistics

```bash
curl -X GET "http://localhost:5000/api/documents/statistics?projectId=YOUR_PROJECT_ID"
```

### 13. Delete Document

```bash
curl -X DELETE "http://localhost:5000/api/documents/DOCUMENT_ID"
```

---

## Complete Workflow Examples

### Example 1: Setting Up a New Project

```bash
# 1. Create budget
curl -X POST "http://localhost:5000/api/budget" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "YOUR_PROJECT_ID",
    "totalBudget": 2000000,
    "allocations": {
      "materials": 800000,
      "labor": 700000,
      "equipment": 300000,
      "other": 200000
    }
  }'

# 2. Add initial materials
curl -X POST "http://localhost:5000/api/materials" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "YOUR_PROJECT_ID",
    "name": "Cement",
    "category": "cement",
    "quantity": 200,
    "unit": "bag",
    "unitCost": 850
  }'

# 3. Create first task
curl -X POST "http://localhost:5000/api/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "YOUR_PROJECT_ID",
    "title": "Site preparation and excavation",
    "description": "Clear site and excavate for foundation",
    "deadline": "2024-11-15",
    "assignedTo": ["worker@example.com"],
    "priority": "high"
  }'

# 4. Check dashboard
curl -X GET "http://localhost:5000/api/dashboard/overview?projectId=YOUR_PROJECT_ID"
```

### Example 2: Daily Progress Update

```bash
# 1. Update task progress
curl -X PUT "http://localhost:5000/api/tasks/TASK_ID/progress" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "notes": "Completed 60% of foundation work"
  }'

# 2. Log time
curl -X POST "http://localhost:5000/api/tasks/TASK_ID/time-log" \
  -H "Content-Type: application/json" \
  -d '{
    "hours": 8,
    "description": "Foundation excavation and rebar placement"
  }'

# 3. Upload progress photos
curl -X POST "http://localhost:5000/api/tasks/TASK_ID/photos" \
  -F "photos=@progress_photo.jpg" \
  -F "caption=Foundation progress - 60% complete"

# 4. Log material usage
curl -X POST "http://localhost:5000/api/materials/MATERIAL_ID/usage" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 25,
    "usedFor": "Foundation concrete"
  }'
```

### Example 3: Weekly Report Generation

```bash
# 1. Get task statistics
curl -X GET "http://localhost:5000/api/tasks/statistics?projectId=YOUR_PROJECT_ID"

# 2. Get budget report
curl -X GET "http://localhost:5000/api/budget/report?projectId=YOUR_PROJECT_ID"

# 3. Get sustainability score
curl -X GET "http://localhost:5000/api/dashboard/sustainability-score?projectId=YOUR_PROJECT_ID"

# 4. Get analytics
curl -X GET "http://localhost:5000/api/dashboard/analytics?projectId=YOUR_PROJECT_ID"
```

---

## Using with Postman

### 1. Create a New Collection

1. Open Postman
2. Click "New" > "Collection"
3. Name it "Sustainable Construction API"

### 2. Set Collection Variables

Add these variables to your collection:
- `baseUrl`: `http://localhost:5000`
- `projectId`: Your actual project ID

### 3. Import Requests

For each endpoint, create a new request and use variables:
```
{{baseUrl}}/api/dashboard/overview?projectId={{projectId}}
```

### 4. Organize by Folders

Create folders for:
- Dashboard
- Materials
- Tasks
- Budget
- Documents

---

## Testing Tips

### 1. Check Server Status First

```bash
curl http://localhost:5000/health
```

### 2. Use Pretty Print with jq

```bash
curl -s "http://localhost:5000/api/dashboard/overview?projectId=YOUR_PROJECT_ID" | jq
```

### 3. Save Response to File

```bash
curl "http://localhost:5000/api/dashboard/overview?projectId=YOUR_PROJECT_ID" > response.json
```

### 4. Test Error Handling

```bash
# Missing required parameter
curl -X POST "http://localhost:5000/api/materials" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 5. Test Pagination

```bash
curl "http://localhost:5000/api/materials?projectId=YOUR_PROJECT_ID&page=1&limit=10"
```

---

## Common Issues and Solutions

### 1. "Project ID is required" Error

**Solution**: Always include `projectId` in query parameters or request body.

### 2. "Project not found" Error

**Solution**: Verify the project exists in MongoDB:
```bash
mongosh
use sustainable-construction
db.projects.find()
```

### 3. File Upload Fails

**Solution**: Check file size and format. Use `-F` flag for multipart/form-data:
```bash
curl -X POST "http://localhost:5000/api/documents/upload" \
  -F "document=@file.pdf" \
  -F "projectId=YOUR_PROJECT_ID"
```

### 4. AI Features Not Working

**Solution**: 
- Verify your Gemini API key is valid and has quota remaining (1500 requests/day free tier)
- Check that GEMINI_API_KEY is set in your environment variables
- For Cloud Vision fallback: Ensure GOOGLE_CLOUD_PROJECT_ID and GOOGLE_APPLICATION_CREDENTIALS are configured
- Check server logs for detailed error messages

---

## Next Steps

1. Review the [API Documentation](./API_DOCUMENTATION.md) for detailed information
2. Check the [Setup Guide](./SETUP_GUIDE.md) for configuration help
3. Start integrating with your Flutter mobile app
4. Test all endpoints with your actual project data

---

**Happy Testing!** 🧪

