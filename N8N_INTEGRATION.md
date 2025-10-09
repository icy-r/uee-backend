# n8n Integration Guide

## Webhook URL
Your n8n webhook is already configured:
```
https://n8n.icy-r.dev/webhook/31a220c7-a676-4434-9f5e-608d25d48ca7
```

## How the Backend Sends Requests

The backend sends POST requests to your n8n webhook with this structure:

### 1. Extract Text from Image

**Request:**
```json
{
  "action": "extract-text",
  "data": {
    "image": "base64_encoded_image_or_url",
    "filename": "document.jpg",
    "documentId": "mongodb_document_id"
  }
}
```

**Expected Response:**
```json
{
  "text": "Extracted text content here...",
  "confidence": 0.95
}
```

Or:
```json
{
  "extractedText": "Extracted text content here...",
  "confidence": 0.95
}
```

Or nested:
```json
{
  "data": {
    "text": "Extracted text content here..."
  }
}
```

---

### 2. Generate Tasks from Document

**Request:**
```json
{
  "action": "generate-tasks",
  "data": {
    "content": "Document text content...",
    "documentType": "plan",
    "projectId": "project_mongodb_id",
    "documentId": "document_mongodb_id",
    "maxTasks": 5
  }
}
```

**Expected Response:**
```json
{
  "tasks": [
    {
      "title": "Task title",
      "description": "Task description",
      "priority": "high",
      "deadline": "2024-12-31",
      "estimatedHours": 8,
      "category": "construction"
    }
  ]
}
```

Or nested:
```json
{
  "data": {
    "tasks": [...]
  }
}
```

**Note:** Backend will automatically limit to 5 tasks max

---

### 3. Process Complete Document (Extract + Generate)

**Request:**
```json
{
  "action": "process-document",
  "data": {
    "image": "base64_or_url",
    "filename": "construction_plan.pdf",
    "isImage": true,
    "content": "existing_text_if_any",
    "type": "plan",
    "projectId": "project_id",
    "documentId": "document_id",
    "maxTasks": 5
  }
}
```

**Expected Response:**
```json
{
  "text": "Extracted text...",
  "tasks": [
    {
      "title": "Task 1",
      "description": "Description",
      "priority": "medium"
    }
  ]
}
```

---

### 4. Health Check

**Request:**
```json
{
  "action": "health-check"
}
```

**Expected Response:**
```json
{
  "status": "healthy"
}
```

---

## n8n Workflow Setup

### Quick Setup in n8n:

1. **Add Webhook Node** (already done - your URL)
   - Method: POST
   - Path: (your webhook path)

2. **Add Switch Node** to handle different actions:
   ```
   Switch based on: {{ $json.action }}
   ```

3. **Create branches:**
   - **extract-text** → OCR/Vision processing
   - **generate-tasks** → AI task generation
   - **process-document** → Combined processing
   - **health-check** → Return success

4. **Response Format:**
   - Always return JSON
   - Backend handles multiple response formats (flexible)

### Minimal n8n Workflow Example:

```
Webhook → Switch (action) → Branch Logic → Respond to Webhook

Branches:
├── extract-text → [Your OCR logic] → Return {text: "..."}
├── generate-tasks → [Your AI logic] → Return {tasks: [...]}
├── process-document → [Combined logic] → Return {text: "...", tasks: [...]}
└── health-check → Return {status: "healthy"}
```

---

## Simplified for MVP

### What's Implemented:
✅ Maximum 5 tasks per document (limited for speed)
✅ Flexible response parsing (multiple formats supported)
✅ Error handling (won't crash if n8n fails)
✅ 30-60 second timeouts
✅ Simple POST to single webhook URL

### What You Can Skip for MVP:
- Complex task scheduling
- Advanced OCR tuning
- Multiple document types
- Real-time processing status
- Webhook authentication (can add later)

---

## Testing the Integration

### 1. Test from Backend:

```bash
# Start your backend
npm run dev

# Test document upload and processing
curl -X POST "http://localhost:5000/api/documents/DOCUMENT_ID/process"
```

### 2. Test n8n Directly:

```bash
curl -X POST "https://n8n.icy-r.dev/webhook/31a220c7-a676-4434-9f5e-608d25d48ca7" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "health-check"
  }'
```

### 3. Test Text Extraction:

```bash
curl -X POST "https://n8n.icy-r.dev/webhook/31a220c7-a676-4434-9f5e-608d25d48ca7" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "extract-text",
    "data": {
      "image": "data:image/png;base64,...",
      "filename": "test.png"
    }
  }'
```

---

## Error Handling

The backend gracefully handles:
- n8n timeout (30-60 seconds)
- n8n errors (returns empty results)
- Invalid responses (flexible parsing)
- Network issues (doesn't crash)

**On error, the backend returns:**
```json
{
  "success": false,
  "error": "error message",
  "extractedText": "",
  "tasks": []
}
```

---

## Quick Tips

1. **Start Simple:** Just return mock data in n8n first
   ```json
   {
     "text": "Sample extracted text",
     "tasks": [{"title": "Sample task"}]
   }
   ```

2. **Add Real Processing Later:** Replace mock with actual OCR/AI

3. **Use n8n's Execute Workflow Node:** For complex processing

4. **Log Everything:** Add logging nodes in n8n for debugging

5. **Test Each Action:** Use n8n's test webhook feature

---

## MVP Priority

For MVP, you can implement in this order:

1. ✅ **Health check** (easiest - just return success)
2. ⚠️ **Extract text** (if you have OCR - optional)
3. ⚠️ **Generate tasks** (if you have AI - optional)
4. 🔜 **Process document** (combine above - can skip for MVP)

**Quick MVP:** Just return mock data for now, implement real processing later!

---

## Support

Backend is configured and ready. Once you set up your n8n workflow to handle these actions, the integration will work automatically!

