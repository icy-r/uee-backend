# 🚀 Get Started in 5 Minutes

## Step 1: Setup Environment (2 minutes)

```bash
# 1. Copy environment template
copy env.template .env

# 2. Edit .env and add these minimum values:
```

Open `.env` and fill in:

```env
# Required for basic functionality
MONGODB_URI=mongodb://localhost:27017/sustainable-construction
GEMINI_API_KEY=your-gemini-key-here
OPENWEATHER_API_KEY=your-weather-key-here

# n8n is already set up ✅
N8N_WEBHOOK_URL=https://n8n.icy-r.dev/webhook/31a220c7-a676-4434-9f5e-608d25d48ca7

# Optional - skip for now
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

### Get API Keys (Free):
1. **Gemini**: https://makersuite.google.com/app/apikey
2. **OpenWeather**: https://openweathermap.org/api

---

## Step 2: Install & Start (1 minute)

```bash
# Install dependencies
npm install

# Start server
npm run dev
```

You should see:
```
✅ MongoDB Connected: localhost
🚀 Server is running on port 5000
```

---

## Step 3: Test It (1 minute)

```bash
# Test server
curl http://localhost:5000/health

# Test weather (should work immediately)
curl "http://localhost:5000/api/dashboard/weather?location=Colombo,LK"

# Test n8n integration
node test-n8n.js
```

---

## Step 4: Create First Project (1 minute)

```bash
# Connect to MongoDB
mongosh

# Create project
use sustainable-construction

db.projects.insertOne({
  name: "Test Project",
  description: "My first project",
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

Copy the `_id` that's returned!

---

## Step 5: Test API with Your Project ID

Replace `YOUR_PROJECT_ID` with the ID from Step 4:

```bash
# Get project overview
curl "http://localhost:5000/api/dashboard/overview?projectId=YOUR_PROJECT_ID"

# Add a material
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

# Create a task
curl -X POST "http://localhost:5000/api/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "YOUR_PROJECT_ID",
    "title": "Foundation work",
    "description": "Complete foundation",
    "deadline": "2024-12-31",
    "assignedTo": ["worker@example.com"],
    "priority": "high"
  }'
```

---

## ✅ You're Ready!

Your backend is now running with:
- ✅ REST API (40+ endpoints)
- ✅ MongoDB database
- ✅ AI features (Gemini)
- ✅ Weather integration
- ✅ n8n workflows (ready for your setup)

---

## Next Steps

1. **Set up n8n workflow** - See `N8N_INTEGRATION.md`
2. **Review API docs** - See `docs/API_DOCUMENTATION.md`
3. **Integrate with Flutter** - Use `http://localhost:5000/api`

---

## Quick Reference

| What | Where |
|------|-------|
| Server running | http://localhost:5000 |
| Health check | http://localhost:5000/health |
| API base URL | http://localhost:5000/api |
| All endpoints | docs/API_DOCUMENTATION.md |
| API examples | docs/API_EXAMPLES.md |
| Setup help | docs/SETUP_GUIDE.md |
| n8n integration | N8N_INTEGRATION.md |

---

## Troubleshooting

**MongoDB not connecting?**
```bash
# Start MongoDB
# Windows: net start MongoDB
# Mac: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

**Port 5000 in use?**
Change `PORT=5000` to `PORT=3000` in `.env`

**Firebase errors?**
Leave Firebase fields empty - it's optional for MVP!

---

## Support Files

- `env.template` - Environment configuration template
- `test-n8n.js` - Test n8n integration
- `N8N_INTEGRATION.md` - Complete n8n setup guide
- `docs/` - Full documentation folder

---

**🎉 Happy Building!**

For detailed docs, see:
- `QUICK_START.md` - Extended quick start
- `docs/SETUP_GUIDE.md` - Complete setup guide
- `docs/API_DOCUMENTATION.md` - API reference

