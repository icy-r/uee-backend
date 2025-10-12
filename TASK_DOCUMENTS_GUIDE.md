# Task and Document Relationship Guide

## Overview

This guide explains how Tasks and Documents are related in your API and how to query all documents/images related to a specific task.

## Data Model Relationships

### 1. Task → Photos (Embedded)
Tasks have photos **embedded directly** in the task document:

```javascript
// Task Model
{
  _id: "task123",
  projectId: "project456",
  title: "Install solar panels",
  photos: [
    {
      url: "/uploads/project456/photo1.jpg",
      filename: "photo1.jpg",
      caption: "Before installation",
      uploadedAt: "2024-10-12T10:00:00Z",
      uploadedBy: "worker1"
    }
  ]
}
```

### 2. Document → Task (Reference)
Documents can **generate tasks** and store references to them:

```javascript
// Document Model
{
  _id: "doc789",
  projectId: "project456",
  filename: "building-plans.pdf",
  generatedTasks: [
    {
      taskId: "task123",  // References the task
      taskTitle: "Install solar panels",
      status: "created"
    }
  ]
}
```

### 3. Both Share Project ID
Both models have `projectId` field, allowing you to find all documents in the same project.

## New Endpoint: Get Task Documents

### Endpoint
```
GET /api/tasks/:id/documents
```

### What It Returns

```json
{
  "status": "success",
  "data": {
    // Photos directly attached to this task
    "taskPhotos": [
      {
        "url": "/uploads/project456/photo1.jpg",
        "filename": "photo1.jpg",
        "caption": "Before installation",
        "uploadedAt": "2024-10-12T10:00:00Z",
        "uploadedBy": "worker1"
      }
    ],
    
    // Documents that generated this specific task
    "relatedDocuments": [
      {
        "_id": "doc789",
        "filename": "building-plans.pdf",
        "originalName": "Building Plans 2024.pdf",
        "fileType": "application/pdf",
        "category": "plan",
        "filePath": "project456/building-plans.pdf",
        "generatedTasks": [
          {
            "taskId": "task123",
            "taskTitle": "Install solar panels",
            "status": "created"
          }
        ]
      }
    ],
    
    // All documents from the same project (optional, limited to 20)
    "projectDocuments": [
      // Array of all documents in the project
    ],
    
    // Summary counts
    "summary": {
      "taskPhotos": 1,
      "relatedDocuments": 1,
      "projectDocuments": 15
    }
  },
  "message": "Task documents retrieved successfully"
}
```

### Example Usage

#### JavaScript/Fetch
```javascript
const taskId = "670a1234567890abcdef1234";

fetch(`http://localhost:5000/api/tasks/${taskId}/documents`)
  .then(res => res.json())
  .then(data => {
    console.log('Task photos:', data.data.taskPhotos);
    console.log('Related documents:', data.data.relatedDocuments);
    console.log('Project documents:', data.data.projectDocuments);
  });
```

#### cURL
```bash
curl http://localhost:5000/api/tasks/670a1234567890abcdef1234/documents
```

#### FlutterFlow API Call
1. Create API call with endpoint: `/api/tasks/[taskId]/documents`
2. Method: GET
3. Replace `[taskId]` with variable from task details page
4. Parse response:
   - `data.taskPhotos` - Photos attached to task
   - `data.relatedDocuments` - Documents that generated this task
   - `data.projectDocuments` - All project documents

## Use Cases

### 1. Task Details Page - Show All Related Media

```javascript
// In your task details page
async function loadTaskWithDocuments(taskId) {
  // Get task details
  const task = await fetch(`/api/tasks/${taskId}`).then(r => r.json());
  
  // Get all related documents/photos
  const docs = await fetch(`/api/tasks/${taskId}/documents`).then(r => r.json());
  
  return {
    task: task.data,
    photos: docs.data.taskPhotos,
    relatedDocs: docs.data.relatedDocuments,
    projectDocs: docs.data.projectDocuments
  };
}
```

### 2. Display Document That Generated This Task

```javascript
// Show which document created this task
const relatedDocs = response.data.relatedDocuments;
if (relatedDocs.length > 0) {
  console.log(`This task was generated from: ${relatedDocs[0].originalName}`);
}
```

### 3. Show Task Progress Photos

```javascript
// Display all photos uploaded to this task
const photos = response.data.taskPhotos;
photos.forEach(photo => {
  displayImage(photo.url, photo.caption);
});
```

## Alternative Queries

### Query Documents by Task ID Directly
If you only need documents that generated a specific task:

```
GET /api/documents?generatedTasks.taskId=670a1234567890abcdef1234
```

### Query Documents by Project ID
If you need all documents in a project:

```
GET /api/documents?projectId=670b5678901234efab567890
```

### Get Task with Photos Only
If you only need the task's embedded photos:

```
GET /api/tasks/:id
```

The response includes `photos` array.

## Data Flow Diagram

```
┌─────────────────────┐
│   Task Details      │
│   Page              │
└──────────┬──────────┘
           │
           │ GET /api/tasks/:id/documents
           │
           ▼
┌─────────────────────┐
│   API Endpoint      │
│   getTaskDocuments  │
└──────────┬──────────┘
           │
           ├─── Query 1: Get task (for projectId and photos)
           │    └─> task.photos[]
           │
           ├─── Query 2: Find documents that generated this task
           │    └─> Document.find({ 'generatedTasks.taskId': taskId })
           │
           ├─── Query 3: Get all project documents (optional)
           │    └─> Document.find({ projectId })
           │
           ▼
┌─────────────────────┐
│   Response:         │
│   - taskPhotos      │
│   - relatedDocuments│
│   - projectDocuments│
│   - summary         │
└─────────────────────┘
```

## FlutterFlow Implementation

### Step 1: Create API Call
1. Go to API Calls in FlutterFlow
2. Create new call: `GetTaskDocuments`
3. URL: `${baseUrl}/api/tasks/[taskId]/documents`
4. Method: GET
5. Add variable: `taskId` (String)

### Step 2: Use in Task Details Page
1. On page load, call `GetTaskDocuments` with current task ID
2. Parse response JSON:
   ```
   data.taskPhotos -> List
   data.relatedDocuments -> List
   data.projectDocuments -> List
   data.summary -> Object
   ```

### Step 3: Display in UI
```
ListView.builder(
  itemCount: taskPhotos.length,
  itemBuilder: (context, index) {
    return Image.network(taskPhotos[index].url);
  }
)
```

## Database Schema Reference

### Task Model
```javascript
{
  projectId: ObjectId,      // References Project
  title: String,
  photos: [{               // Embedded photos
    url: String,
    filename: String,
    caption: String,
    uploadedAt: Date,
    uploadedBy: String
  }],
  // ... other fields
}
```

### Document Model
```javascript
{
  projectId: ObjectId,      // References Project
  filename: String,
  filePath: String,
  generatedTasks: [{        // References Tasks
    taskId: ObjectId,       // References Task
    taskTitle: String,
    status: String
  }],
  // ... other fields
}
```

## Performance Notes

- The endpoint limits `projectDocuments` to 20 items to avoid large responses
- If you need more project documents, use the documents endpoint with pagination:
  ```
  GET /api/documents?projectId=xxx&page=1&limit=50
  ```

## Security

- Currently uses optional authentication (MVP phase)
- In production, add proper authentication to ensure users can only access:
  - Tasks they're assigned to
  - Documents from projects they're members of

## Testing

### Test the Endpoint
```bash
# 1. Create a task
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "670b5678901234efab567890",
    "title": "Test Task",
    "description": "Test",
    "deadline": "2024-12-31",
    "assignedTo": ["user1"],
    "assignedBy": "admin"
  }'

# 2. Upload photos to the task
curl -X POST http://localhost:5000/api/tasks/TASK_ID/photos \
  -F "photos=@photo1.jpg" \
  -F "caption=Test photo"

# 3. Get all documents for the task
curl http://localhost:5000/api/tasks/TASK_ID/documents
```

## Support

For questions or issues:
- Check the API documentation: `/api-docs`
- Test in log viewer: `/logs`
- Review query guide: `QUERY_GUIDE.md`

