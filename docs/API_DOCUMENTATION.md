# Sustainable Construction Backend API Documentation

## Base URL
```
http://localhost:5000/api
```

## Table of Contents
1. [Dashboard APIs](#dashboard-apis)
2. [Material Management APIs](#material-management-apis)
3. [Task Management APIs](#task-management-apis)
4. [Finance & Budget APIs](#finance--budget-apis)
5. [Document Management APIs](#document-management-apis)
6. [Error Handling](#error-handling)
7. [Response Format](#response-format)

---

## Dashboard APIs

### Get Project Overview
**Endpoint:** `GET /dashboard/overview`

**Description:** Get comprehensive project overview including status, progress, task statistics, material summary, and budget information.

**Query Parameters:**
- `projectId` (required): Project ID

**Response:**
```json
{
  "status": "success",
  "message": "Project overview retrieved successfully",
  "data": {
    "project": {
      "id": "project_id",
      "name": "Construction Project",
      "status": "in_progress",
      "progressPercentage": 45,
      "sustainabilityScore": 78,
      "startDate": "2024-01-01",
      "expectedEndDate": "2024-12-31",
      "daysElapsed": 280,
      "daysRemaining": 85
    },
    "tasks": {
      "total": 50,
      "notStarted": 10,
      "inProgress": 25,
      "completed": 15,
      "overdue": 3
    },
    "materials": {
      "total": 30,
      "needsReorder": 5,
      "totalValue": 250000
    },
    "budget": {
      "total": 1000000,
      "spent": 450000,
      "remaining": 550000,
      "utilizationPercentage": 45,
      "alertLevel": "low"
    }
  }
}
```

### Get Analytics
**Endpoint:** `GET /dashboard/analytics`

**Description:** Get progress analytics and trends for the last 30 days.

**Query Parameters:**
- `projectId` (required): Project ID

**Response:**
```json
{
  "status": "success",
  "data": {
    "taskCompletionTrend": [
      { "date": "2024-10-01", "count": 3 },
      { "date": "2024-10-02", "count": 5 }
    ],
    "expenseTrend": [
      { "date": "2024-10-01", "amount": 15000 },
      { "date": "2024-10-02", "amount": 22000 }
    ],
    "materialUsageTrend": [
      { "date": "2024-10-01", "quantity": 150 }
    ],
    "sustainabilityTrend": {
      "current": 78,
      "ecoFriendlyPercentage": 65,
      "wasteReductionPercentage": 85
    },
    "productivity": {
      "tasksPerDay": 2.5,
      "avgTaskDuration": 5
    }
  }
}
```

### Get Weather Data
**Endpoint:** `GET /dashboard/weather`

**Description:** Get real-time weather data and forecast for project location.

**Query Parameters:**
- `location` (optional): Location name (e.g., "Colombo,LK")
- `projectId` (optional): Project ID (will use project location)

**Response:**
```json
{
  "status": "success",
  "data": {
    "current": {
      "location": "Colombo",
      "country": "LK",
      "temperature": 28,
      "humidity": 75,
      "weather": {
        "main": "Clouds",
        "description": "scattered clouds"
      },
      "constructionImpact": {
        "level": "low",
        "impacts": ["Good conditions for construction"],
        "workable": true,
        "recommendations": []
      }
    },
    "forecast": [...],
    "workableDays": [...]
  }
}
```

### Get Sustainability Score
**Endpoint:** `GET /dashboard/sustainability-score`

**Description:** Get sustainability score with AI-powered recommendations.

**Query Parameters:**
- `projectId` (required): Project ID

**Response:**
```json
{
  "status": "success",
  "data": {
    "score": 78,
    "breakdown": {
      "ecoFriendlyMaterials": 65,
      "wasteManagement": 85,
      "overallImpact": "good"
    },
    "aiRecommendations": [
      {
        "category": "materials",
        "suggestion": "Consider using recycled steel for remaining work",
        "impact": "high",
        "implementationCost": "medium"
      }
    ],
    "strengths": ["Good waste management", "High eco-friendly material usage"],
    "weaknesses": ["Energy efficiency could be improved"]
  }
}
```

---

## Material Management APIs

### Add Material
**Endpoint:** `POST /materials`

**Request Body:**
```json
{
  "projectId": "project_id",
  "name": "Cement",
  "category": "cement",
  "quantity": 100,
  "unit": "bag",
  "unitCost": 850,
  "supplier": "ABC Suppliers",
  "ecoFriendly": false,
  "description": "Portland cement type I",
  "reorderLevel": 20
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Material added successfully",
  "data": {
    "_id": "material_id",
    "projectId": "project_id",
    "name": "Cement",
    ...
  }
}
```

### Get Materials
**Endpoint:** `GET /materials`

**Query Parameters:**
- `projectId` (required): Project ID
- `category` (optional): Filter by category
- `ecoFriendly` (optional): Filter by eco-friendly status (true/false)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

### Update Material
**Endpoint:** `PUT /materials/:id`

### Delete Material
**Endpoint:** `DELETE /materials/:id`

### Log Material Usage
**Endpoint:** `POST /materials/:id/usage`

**Request Body:**
```json
{
  "quantity": 10,
  "usedFor": "Foundation work - Block A",
  "notes": "Used for concrete mix"
}
```

### Log Material Waste
**Endpoint:** `POST /materials/:id/waste`

**Request Body:**
```json
{
  "quantity": 2,
  "reason": "Damaged during transport",
  "notes": "Bags were torn"
}
```

### Get Material Estimation (AI)
**Endpoint:** `GET /materials/estimation`

**Description:** Get AI-powered material quantity estimation based on project details.

**Query Parameters:**
- `projectId` (required): Project ID
- `projectType` (optional): Override project type
- `projectSize` (optional): Override project size (JSON string)
- `duration` (optional): Project duration in months
- `location` (optional): Override location

**Response:**
```json
{
  "status": "success",
  "data": {
    "materials": [
      {
        "name": "Cement",
        "category": "cement",
        "estimatedQuantity": 250,
        "unit": "bag",
        "confidence": "high",
        "reasoning": "Based on 2000 sqft residential construction"
      },
      {
        "name": "Steel Rebar",
        "category": "steel",
        "estimatedQuantity": 5000,
        "unit": "kg",
        "confidence": "high",
        "reasoning": "Standard reinforcement for residential structure"
      }
    ],
    "notes": "Estimates based on industry standards for residential construction",
    "estimationBasis": "AI-generated based on similar projects"
  }
}
```

### Get Sustainability Metrics
**Endpoint:** `GET /materials/sustainability`

**Query Parameters:**
- `projectId` (required): Project ID

---

## Task Management APIs

### Create Task
**Endpoint:** `POST /tasks`

**Request Body:**
```json
{
  "projectId": "project_id",
  "title": "Install electrical wiring",
  "description": "Complete electrical wiring for first floor",
  "deadline": "2024-11-15",
  "assignedTo": ["worker1@example.com", "worker2@example.com"],
  "priority": "high",
  "status": "not_started"
}
```

### Get Tasks
**Endpoint:** `GET /tasks`

**Query Parameters:**
- `projectId` (required): Project ID
- `status` (optional): Filter by status
- `priority` (optional): Filter by priority
- `assignedTo` (optional): Filter by assigned worker
- `overdue` (optional): Filter overdue tasks (true/false)
- `page` (optional): Page number
- `limit` (optional): Items per page

### Update Task Progress
**Endpoint:** `PUT /tasks/:id/progress`

**Request Body:**
```json
{
  "status": "in_progress",
  "notes": "Started work on electrical panel installation"
}
```

### Upload Task Photos
**Endpoint:** `POST /tasks/:id/photos`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `photos`: File(s) to upload (max 10)
- `caption` (optional): Photo caption

### Log Time
**Endpoint:** `POST /tasks/:id/time-log`

**Request Body:**
```json
{
  "hours": 4.5,
  "description": "Installed main electrical panel and connected circuits",
  "date": "2024-10-08"
}
```

### Get Task Statistics
**Endpoint:** `GET /tasks/statistics`

**Query Parameters:**
- `projectId` (required): Project ID

**Response:**
```json
{
  "status": "success",
  "data": {
    "total": 50,
    "byStatus": {
      "notStarted": 10,
      "inProgress": 25,
      "completed": 15
    },
    "byPriority": {
      "low": 15,
      "medium": 25,
      "high": 10
    },
    "overdue": 3,
    "completedThisWeek": 8,
    "avgCompletionTime": 5,
    "totalHoursLogged": 425,
    "upcomingDeadlines": [...]
  }
}
```

### Get Task Timeline
**Endpoint:** `GET /tasks/timeline`

**Description:** Get task timeline data for Gantt chart visualization.

**Query Parameters:**
- `projectId` (required): Project ID

---

## Finance & Budget APIs

### Create Budget
**Endpoint:** `POST /budget`

**Request Body:**
```json
{
  "projectId": "project_id",
  "totalBudget": 1000000,
  "allocations": {
    "materials": 400000,
    "labor": 350000,
    "equipment": 150000,
    "other": 100000
  },
  "contingencyPercentage": 10
}
```

### Get Budget Overview
**Endpoint:** `GET /budget`

**Query Parameters:**
- `projectId` (required): Project ID

**Response:**
```json
{
  "status": "success",
  "data": {
    "totalBudget": 1000000,
    "totalExpenses": 450000,
    "remainingBudget": 550000,
    "utilizationPercentage": 45,
    "allocations": {...},
    "expensesByCategory": {
      "materials": 250000,
      "labor": 150000,
      "equipment": 40000,
      "other": 10000
    },
    "alertLevel": "low",
    "contingency": {
      "percentage": 10,
      "amount": 100000
    },
    "currency": "LKR"
  }
}
```

### Log Expense
**Endpoint:** `POST /budget/expenses`

**Request Body:**
```json
{
  "projectId": "project_id",
  "category": "materials",
  "amount": 45000,
  "description": "Cement and steel delivery",
  "date": "2024-10-08",
  "invoiceNumber": "INV-2024-001",
  "vendor": "ABC Suppliers"
}
```

### Get Expenses
**Endpoint:** `GET /budget/expenses`

**Query Parameters:**
- `projectId` (required): Project ID
- `category` (optional): Filter by category
- `startDate` (optional): Filter from date
- `endDate` (optional): Filter to date

### Generate Expense Report
**Endpoint:** `GET /budget/report`

**Query Parameters:**
- `projectId` (required): Project ID
- `startDate` (optional): Report start date
- `endDate` (optional): Report end date

### Get Cost Prediction (AI)
**Endpoint:** `GET /budget/cost-prediction`

**Description:** Get AI-powered cost predictions based on market trends.

**Query Parameters:**
- `projectId` (required): Project ID
- `timeframe` (optional): Prediction timeframe in months (default: 3)

**Response:**
```json
{
  "status": "success",
  "data": {
    "predictions": [
      {
        "materialName": "Cement",
        "currentPrice": 850,
        "predictedPrice": 920,
        "priceChange": 70,
        "trend": "increasing",
        "confidence": 75,
        "reasoning": "Seasonal demand increase expected"
      }
    ],
    "marketFactors": ["Seasonal demand", "Supply chain constraints"],
    "recommendations": "Consider bulk purchasing cement before price increase"
  }
}
```

### Optimize Budget (AI)
**Endpoint:** `POST /budget/optimize`

**Description:** Get AI-powered budget optimization suggestions.

**Request Body:**
```json
{
  "projectId": "project_id"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "optimizedAllocations": {
      "materials": 380000,
      "labor": 370000,
      "equipment": 150000,
      "other": 100000
    },
    "savings": 20000,
    "recommendations": [
      {
        "area": "materials",
        "suggestion": "Negotiate bulk discounts with suppliers",
        "potentialSavings": 15000,
        "priority": "high"
      }
    ],
    "riskFactors": ["Market price volatility"],
    "contingencyAdvice": "Maintain 10% contingency for unforeseen expenses"
  }
}
```

### Get Budget Analytics
**Endpoint:** `GET /budget/analytics`

**Query Parameters:**
- `projectId` (required): Project ID

---

## Document Management APIs

### Upload Document
**Endpoint:** `POST /documents/upload`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `document`: File to upload
- `projectId`: Project ID (required)
- `category`: Document category (plan/permit/contract/invoice/report/photo/other)
- `description`: Document description
- `tags`: JSON array of tags

### Get Documents
**Endpoint:** `GET /documents`

**Query Parameters:**
- `projectId` (required): Project ID
- `category` (optional): Filter by category
- `isProcessed` (optional): Filter by processing status (true/false)
- `page` (optional): Page number
- `limit` (optional): Items per page

### Extract Text from Image (Gemini AI)
**Endpoint:** `POST /documents/:id/extract-text`

**Description:** Extract text from image document using Google Gemini Vision AI. Automatically falls back to Google Cloud Vision API if Gemini fails or quota is exceeded.

**AI Models Used:**
- Primary: Google Gemini Vision (`gemini-1.5-flash`)
- Fallback: Google Cloud Vision API (optional)

**Response:**
```json
{
  "status": "success",
  "message": "Text extracted successfully",
  "data": {
    "document": {...},
    "extractedText": "Extracted text content from image...",
    "confidence": 0.9,
    "method": "gemini-vision"
  }
}
```

### Generate Tasks from Document (Gemini AI)
**Endpoint:** `POST /documents/:id/generate-tasks`

**Description:** Generate tasks automatically from document content using Google Gemini AI. The AI analyzes the document content and generates actionable construction tasks with priorities and deadlines.

**AI Model Used:** Google Gemini (`gemini-2.0-flash-exp`)

**Response:**
```json
{
  "status": "success",
  "message": "Successfully generated 5 tasks from document",
  "data": {
    "document": {...},
    "tasks": [
      {
        "title": "Complete foundation excavation",
        "description": "Generated from document: construction_plan.pdf",
        "priority": "high",
        "deadline": "2024-11-15"
      }
    ],
    "summary": {
      "total": 5,
      "created": 5,
      "failed": 0
    }
  }
}
```

### Process Document (Gemini AI)
**Endpoint:** `POST /documents/:id/process`

**Description:** Complete document processing - extract text and generate tasks in one call using Google Gemini AI. This endpoint combines OCR text extraction and AI-powered task generation into a single workflow.

**AI Models Used:**
- Text Extraction: Google Gemini Vision (`gemini-1.5-flash`) with Cloud Vision fallback
- Task Generation: Google Gemini (`gemini-2.0-flash-exp`)

**Response:**
```json
{
  "status": "success",
  "message": "Document processed successfully",
  "data": {
    "document": {...},
    "extractedText": "Full text extracted from document...",
    "tasks": [
      {
        "_id": "task_id",
        "title": "Install electrical wiring",
        "description": "Complete electrical installation based on permit requirements",
        "priority": "high",
        "deadline": "2024-11-15",
        "status": "not_started"
      }
    ],
    "method": "gemini-ai"
  }
}
```

### Download Document
**Endpoint:** `GET /documents/:id/download`

**Description:** Download the original document file.

### Get Document Statistics
**Endpoint:** `GET /documents/statistics`

**Query Parameters:**
- `projectId` (required): Project ID

---

## Error Handling

All error responses follow this format:

```json
{
  "status": "error",
  "message": "Error description",
  "timestamp": "2024-10-08T12:00:00.000Z",
  "errors": [] // Optional, for validation errors
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error

---

## Response Format

### Success Response
```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": {...},
  "timestamp": "2024-10-08T12:00:00.000Z"
}
```

### Paginated Response
```json
{
  "status": "success",
  "message": "Data retrieved successfully",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  },
  "timestamp": "2024-10-08T12:00:00.000Z"
}
```

---

## AI Features

### Material Estimation
Uses Google Gemini AI to estimate required material quantities based on:
- Project type (residential, commercial, industrial, infrastructure)
- Project size
- Duration
- Location

### Cost Prediction
Uses Google Gemini AI to predict future material costs based on:
- Current market prices
- Historical trends
- Location-specific factors
- Timeframe

### Progress Forecasting
Uses Google Gemini AI to predict project completion based on:
- Current progress percentage
- Task completion rate
- Team size
- Weather impact

### Sustainability Scoring
Uses Google Gemini AI to analyze environmental impact and provide recommendations based on:
- Material eco-friendliness
- Waste generation
- Energy usage

### Budget Optimization
Uses Google Gemini AI to suggest optimal budget allocation based on:
- Current spending patterns
- Project phase
- Market conditions

---

## AI Integration (Google Gemini)

### Overview
The backend uses Google Gemini AI for all AI-powered features, providing a unified and efficient AI solution. Previously used n8n workflows have been replaced with direct Gemini API integration (migrated October 11, 2025).

### Text Extraction (OCR)
The backend uses Google Gemini Vision for extracting text from uploaded images (plans, permits, invoices, etc.).

**Primary Method:** Gemini Vision API (`gemini-1.5-flash`)
- Input: Image file path
- Output: Extracted text with confidence score (0-1)
- Free tier: 1500 requests/day

**Fallback Method:** Google Cloud Vision API (optional)
- Activated automatically when Gemini fails or quota exceeded
- Free tier: 1000 text detection calls/month
- Requires additional configuration (GOOGLE_CLOUD_PROJECT_ID, GOOGLE_APPLICATION_CREDENTIALS)

### Task Generation from Documents
Automatically generates actionable construction tasks from document content using Gemini AI.

**AI Model:** Google Gemini (`gemini-2.0-flash-exp`)
- Analyzes document content and context
- Generates up to 5 prioritized, actionable tasks
- Assigns appropriate deadlines and categories
- Free tier: 1500 requests/day

**Workflow:** `/generate-tasks`
- Input: Document text content
- Output: List of generated tasks with titles, descriptions, and priorities

---

## Environment Variables

See `.env.example` for all required environment variables:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/sustainable-construction

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key

# OpenWeather API
OPENWEATHER_API_KEY=your-openweather-api-key
DEFAULT_LOCATION=Colombo,LK

# Google Cloud Vision (Optional Fallback for OCR)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account-key.json

# DEPRECATED: n8n (replaced with Gemini AI - October 11, 2025)
# N8N_WEBHOOK_URL=https://n8n.icy-r.dev/mcp/a38260d2-7457-432e-bde5-254a4cf83f63

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

---

## Authentication (Future Implementation)

The MVP version does not require authentication. However, the structure is in place for future implementation using Firebase Authentication.

To enable authentication in future:
1. Replace `optionalAuth` with `requireAuth` in routes
2. Send Firebase ID token in Authorization header:
   ```
   Authorization: Bearer <firebase-id-token>
   ```

---

## Testing the API

### Health Check
```bash
curl http://localhost:5000/health
```

### Get Project Overview
```bash
curl "http://localhost:5000/api/dashboard/overview?projectId=YOUR_PROJECT_ID"
```

### Create Material
```bash
curl -X POST http://localhost:5000/api/materials \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "YOUR_PROJECT_ID",
    "name": "Cement",
    "category": "cement",
    "quantity": 100,
    "unit": "bag",
    "unitCost": 850
  }'
```

---

## Support

For issues or questions, please refer to the README.md or contact the development team.

