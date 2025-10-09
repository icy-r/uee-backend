# Quick Start Guide

Get the Sustainable Construction Backend up and running in 5 minutes!

## Prerequisites Check

- [ ] Node.js v16+ installed
- [ ] MongoDB installed and running
- [ ] Git installed

## Step 1: Install Dependencies (1 minute)

```bash
npm install
```

## Step 2: Configure Environment (2 minutes)

Create `.env` file in project root:

```bash
# Copy from .env.example if it exists, or create new file
touch .env
```

Add this minimum configuration to `.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB (Local)
MONGODB_URI=mongodb://localhost:27017/sustainable-construction

# Firebase (Get from Firebase Console)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL=your-client-email

# Gemini API (Get from Google AI Studio)
GEMINI_API_KEY=your-gemini-key

# OpenWeather (Get from OpenWeather)
OPENWEATHER_API_KEY=your-weather-key
DEFAULT_LOCATION=Colombo,LK

# n8n (Already configured)
N8N_WEBHOOK_URL=https://n8n.icy-r.dev/mcp/a38260d2-7457-432e-bde5-254a4cf83f63

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

### Quick API Key Setup

1. **Gemini API**: https://makersuite.google.com/app/apikey
2. **OpenWeather**: https://openweathermap.org/api (Free tier)
3. **Firebase**: Firebase Console > Project Settings > Service Accounts

## Step 3: Start Server (30 seconds)

```bash
# Development mode (recommended)
npm run dev

# Or production mode
npm start
```

You should see:
```
✅ MongoDB Connected: localhost
✅ Firebase Admin initialized
🚀 Server is running on port 5000
```

## Step 4: Test It! (1 minute)

### Health Check
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "success",
  "message": "Sustainable Construction API is running"
}
```

### Test Weather API
```bash
curl "http://localhost:5000/api/dashboard/weather?location=Colombo,LK"
```

## Step 5: Create Your First Project

Connect to MongoDB:
```bash
mongosh
```

Create a sample project:
```javascript
use sustainable-construction

db.projects.insertOne({
  name: "My First Project",
  description: "Sample construction project",
  location: "Colombo",
  startDate: new Date("2024-01-01"),
  expectedEndDate: new Date("2024-12-31"),
  status: "in_progress",
  progressPercentage: 0,
  sustainabilityScore: 0,
  teamSize: 10,
  projectType: "residential",
  projectSize: { value: 2000, unit: "sqft" },
  owner: "admin@example.com",
  createdBy: "admin@example.com"
})
```

Copy the generated `_id` - you'll use this as `projectId` in API calls.

## Common Commands

```bash
# Install dependencies
npm install

# Start development server (with auto-reload)
npm run dev

# Start production server
npm start

# View MongoDB data
mongosh
use sustainable-construction
db.projects.find()
```

## Quick Test Requests

Replace `YOUR_PROJECT_ID` with your actual project ID from Step 5.

### Get Project Overview
```bash
curl "http://localhost:5000/api/dashboard/overview?projectId=YOUR_PROJECT_ID"
```

### Add Material
```bash
curl -X POST "http://localhost:5000/api/materials" \
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

### Create Task
```bash
curl -X POST "http://localhost:5000/api/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "YOUR_PROJECT_ID",
    "title": "Foundation work",
    "description": "Complete foundation excavation",
    "deadline": "2024-12-31",
    "assignedTo": ["worker@example.com"],
    "priority": "high"
  }'
```

## Troubleshooting

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
mongosh

# If not running, start it:
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

### Port Already in Use
Change `PORT` in `.env` file to another port (e.g., 3000, 8080)

### Firebase Error
- Verify credentials are correct
- Ensure private key has `\n` characters preserved
- Wrap private key in quotes

### API Key Errors
- Verify keys are active
- Check API quotas
- Wait a few hours if keys are newly created

## Next Steps

1. ✅ Review [API Documentation](docs/API_DOCUMENTATION.md)
2. ✅ Check [API Examples](docs/API_EXAMPLES.md)
3. ✅ Read [Setup Guide](docs/SETUP_GUIDE.md)
4. ✅ Integrate with Flutter app
5. ✅ Test all endpoints with your data

## API Endpoints Summary

**Base URL:** `http://localhost:5000/api`

### Dashboard
- GET `/dashboard/overview` - Project overview
- GET `/dashboard/analytics` - Analytics
- GET `/dashboard/weather` - Weather data
- GET `/dashboard/sustainability-score` - Sustainability

### Materials
- POST `/materials` - Add material
- GET `/materials` - List materials
- POST `/materials/:id/usage` - Log usage
- GET `/materials/estimation` - AI estimation

### Tasks
- POST `/tasks` - Create task
- GET `/tasks` - List tasks
- PUT `/tasks/:id/progress` - Update progress
- POST `/tasks/:id/photos` - Upload photos

### Budget
- POST `/budget` - Create budget
- GET `/budget` - Get budget
- POST `/budget/expenses` - Log expense
- GET `/budget/cost-prediction` - AI predictions

### Documents
- POST `/documents/upload` - Upload file
- GET `/documents` - List documents
- POST `/documents/:id/extract-text` - Extract text
- POST `/documents/:id/generate-tasks` - Generate tasks

## Architecture Overview

```
Frontend (Flutter) 
    ↓ HTTP/REST
Backend (Express + Node.js)
    ↓
MongoDB (Main DB) + Firebase (Auth)
    ↓
AI Services: Gemini API | n8n Workflows | OpenWeather API
```

## Features at a Glance

✅ **4 Main Modules**: Dashboard, Materials, Tasks, Budget, Documents  
✅ **5 AI Features**: Material estimation, cost prediction, progress forecast, sustainability scoring, budget optimization  
✅ **3 External APIs**: Gemini AI, OpenWeather, n8n  
✅ **40+ Endpoints**: Full REST API  
✅ **Complete Documentation**: Setup guides, API docs, examples  

## Support

- 📚 Check [docs/](docs/) folder for detailed guides
- 🐛 Review console logs for error messages
- 🔍 Use [API_EXAMPLES.md](docs/API_EXAMPLES.md) for testing
- 💬 Contact development team for support

---

**You're all set! Start building amazing sustainable construction projects!** 🚀🏗️

