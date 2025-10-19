# Quick Start Guide

## 🚀 Start Backend Server

```bash
npm start
```

The server will run on: **http://localhost:5000**

## 📊 Database Status

**MongoDB Connection**: `mongodb://localhost:27017/sustainable-construction`

### Check MongoDB
```bash
# View all users
node -e "const mongoose = require('mongoose'); const User = require('./src/models/User'); mongoose.connect('mongodb://localhost:27017/sustainable-construction').then(async () => { const users = await User.find({}, 'name email role'); console.log(users); process.exit(0); });"

# Count users
node -e "const mongoose = require('mongoose'); const User = require('./src/models/User'); mongoose.connect('mongodb://localhost:27017/sustainable-construction').then(async () => { console.log('Users:', await User.countDocuments()); process.exit(0); });"
```

## 🔄 Re-run Migration

```bash
# Dry run (test without changes)
node migrations/sync-firebase-users.js --dry-run

# Actual migration
node migrations/sync-firebase-users.js

# Force update existing users
node migrations/sync-firebase-users.js --force
```

## 🧪 Test API

```bash
# Health check
curl http://localhost:5000/health

# Get users (requires auth token)
curl -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" http://localhost:5000/api/users

# Get current profile
curl -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" http://localhost:5000/api/users/profile
```

## 📱 Flutter App

Update base URL in: `lib/backend/api_requests/api_calls.dart`
```dart
static String getBaseUrl() => 'http://localhost:5000';
```

## 🔧 Environment

Key variables in `.env`:
- `PORT=5000`
- `MONGODB_URI=mongodb://localhost:27017/sustainable-construction`
- `GOOGLE_APPLICATION_CREDENTIALS=./ueescratch-ppsgae-firebase-adminsdk-fbsvc-0f65f15e04.json`

## ⚠️ Troubleshooting

### MongoDB not running
```bash
# Check status
systemctl status mongod
# Or check processes
pgrep -f mongod

# Start MongoDB
sudo systemctl start mongod
```

### Port already in use
```bash
# Find process using port 5000
lsof -i :5000
# Kill process
kill -9 <PID>
```

### Firebase auth fails
- Check `.env` has correct `GOOGLE_APPLICATION_CREDENTIALS`
- Verify service account JSON file exists
- Ensure Firebase project matches
