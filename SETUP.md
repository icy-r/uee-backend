# Backend Setup Guide

Quick start guide for setting up the Sustainable Construction Management API backend.

## Prerequisites

- Node.js 14+ installed
- MongoDB installed and running
- Firebase project with service account
- Git installed

## Step 1: Clone and Install

```bash
# Navigate to backend directory
cd /home/icy/github/uee-backend

# Install dependencies
npm install
```

## Step 2: Environment Configuration

The `.env` file has been pre-configured with the Firebase service account. Verify the configuration:

```bash
# Check .env file exists
cat .env

# Verify Firebase service account file
ls -la ueescratch-ppsgae-firebase-adminsdk-fbsvc-0f65f15e04.json
```

**Key configurations in `.env`:**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/sustainable-construction
GOOGLE_APPLICATION_CREDENTIALS=./ueescratch-ppsgae-firebase-adminsdk-fbsvc-0f65f15e04.json
FIREBASE_PROJECT_ID=ueescratch-ppsgae
```

### Optional API Keys

Add these to `.env` if you need the features:

1. **Gemini API** (for AI features):
   - Get from: https://makersuite.google.com/app/apikey
   - Add: `GEMINI_API_KEY=your_key_here`

2. **OpenWeather API** (for weather data):
   - Get from: https://openweathermap.org/api
   - Add: `OPENWEATHER_API_KEY=your_key_here`

3. **DigitalOcean Spaces** (for file storage):
   - Get from: DigitalOcean Dashboard
   - Update SPACES_KEY and SPACES_SECRET

## Step 3: Start MongoDB

### Option A: Local MongoDB
```bash
# Start MongoDB daemon
mongod --dbpath /path/to/data/db

# Or if installed via package manager
sudo systemctl start mongodb
```

### Option B: Docker MongoDB
```bash
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:latest
```

### Verify MongoDB is running
```bash
mongosh --eval "db.adminCommand('ping')"
```

## Step 4: Verify Firebase Configuration

Test Firebase Admin SDK initialization:

```bash
node -e "
  require('dotenv').config();
  const admin = require('firebase-admin');
  const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✓ Firebase Admin SDK initialized successfully');
  console.log('Project ID:', admin.app().options.projectId);
"
```

**Expected output:**
```
✓ Firebase Admin SDK initialized successfully
Project ID: ueescratch-ppsgae
```

## Step 5: Run Migration (Optional)

If you have existing users in Firebase, migrate them to MongoDB:

### Test Migration (Dry Run)
```bash
node migrations/sync-firebase-users.js --dry-run
```

### Run Actual Migration
```bash
node migrations/sync-firebase-users.js
```

### Verify Migration
```bash
node migrations/test-migration.js verify
```

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed migration instructions.

## Step 6: Start the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Using PM2 (recommended for production)
```bash
npm install -g pm2
pm2 start server.js --name uee-backend
pm2 logs uee-backend
```

## Step 7: Verify Server is Running

### Check health endpoint
```bash
curl http://localhost:5000/health
```

**Expected response:**
```json
{
  "status": "success",
  "data": {
    "status": "OK",
    "timestamp": "2024-10-19T...",
    "uptime": "...",
    "mongodb": "connected",
    "firebase": "initialized"
  }
}
```

### Test API endpoints
```bash
# Get all projects
curl http://localhost:5000/api/projects

# Get user profile (requires auth token)
curl -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  http://localhost:5000/api/users/profile
```

## Step 8: Connect Flutter App

The Flutter app is already configured to use `localhost:5000`:

```dart
// lib/backend/api_requests/api_calls.dart
static String getBaseUrl() => 'http://localhost:5000';
```

### Test from Flutter
1. Start the backend server
2. Run the Flutter app: `flutter run`
3. Try logging in or accessing profile features

## Troubleshooting

### Issue: "Cannot find module 'firebase-admin'"
```bash
npm install firebase-admin
```

### Issue: "ECONNREFUSED - MongoDB connection failed"
```bash
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ping')"

# Start MongoDB
mongod --dbpath /path/to/data/db
```

### Issue: "Firebase credentials not found"
```bash
# Verify file path in .env
cat .env | grep GOOGLE_APPLICATION_CREDENTIALS

# Check file exists
ls -la ueescratch-ppsgae-firebase-adminsdk-fbsvc-0f65f15e04.json
```

### Issue: "Port 5000 already in use"
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=5001
```

### Issue: "Error: listen EADDRINUSE: address already in use"
```bash
# Check what's using the port
sudo netstat -tulpn | grep :5000

# Kill the process or use a different port
```

## Development Workflow

### Running in Development
```bash
# Terminal 1: Start MongoDB
mongod --dbpath ./data/db

# Terminal 2: Start backend with auto-reload
cd /home/icy/github/uee-backend
npm run dev

# Terminal 3: Run Flutter app
cd /home/icy/github/ueescratch-ppsgae
flutter run
```

### Testing API Endpoints
```bash
# Install REST client (optional)
npm install -g @dothttp/cli

# Or use curl, Postman, or Thunder Client (VS Code extension)
```

### View Logs
```bash
# Real-time logs
tail -f logs/app.log

# MongoDB logs
tail -f /var/log/mongodb/mongod.log

# PM2 logs (if using PM2)
pm2 logs uee-backend
```

## Project Structure

```
uee-backend/
├── server.js                          # Main entry point
├── .env                               # Environment variables
├── ueescratch-ppsgae-firebase-*.json  # Firebase service account
├── src/
│   ├── config/                        # Configuration files
│   ├── controllers/                   # Route controllers
│   ├── middleware/                    # Express middleware
│   ├── models/                        # MongoDB models
│   ├── routes/                        # API routes
│   ├── services/                      # Business logic
│   └── utils/                         # Helper functions
├── migrations/                        # Database migrations
│   ├── sync-firebase-users.js         # Firebase to MongoDB sync
│   ├── test-migration.js              # Migration testing
│   └── README.md                      # Migration docs
└── docs/                              # API documentation
```

## Next Steps

1. **Test API Endpoints**: Use Postman or curl to test endpoints
2. **Configure AI Services**: Add Gemini API key for AI features
3. **Setup File Storage**: Configure DigitalOcean Spaces
4. **Enable Weather API**: Add OpenWeather API key
5. **Deploy to Production**: See deployment guide

## Production Deployment

For production deployment, see:
- [DEPLOYMENT.md](./docs/DEPLOYMENT.md) - Deployment guide
- [API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md) - Full API docs
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Database migration

## Support

For issues or questions:
- Backend logs: `tail -f logs/app.log`
- MongoDB logs: `tail -f /var/log/mongodb/mongod.log`
- Firebase docs: https://firebase.google.com/docs/admin/setup
- API docs: http://localhost:5000/api-docs

## Quick Reference

```bash
# Start everything
npm run dev                              # Start backend
mongod --dbpath ./data/db               # Start MongoDB (separate terminal)

# Common commands
npm start                                # Start server
npm test                                 # Run tests
npm run lint                             # Check code style

# Database
mongosh sustainable-construction         # MongoDB shell
mongodump --db sustainable-construction  # Backup database

# Migration
node migrations/sync-firebase-users.js --dry-run  # Test migration
node migrations/sync-firebase-users.js            # Run migration

# PM2 (production)
pm2 start server.js --name uee-backend   # Start with PM2
pm2 logs uee-backend                     # View logs
pm2 restart uee-backend                  # Restart
pm2 stop uee-backend                     # Stop
```

---

**Setup Date**: October 19, 2024  
**Version**: 1.0.0  
**Status**: ✅ Ready for Development

