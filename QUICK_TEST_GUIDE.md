# Quick Test Guide - MVP API

## Backend Status
✅ **Backend Running**: http://localhost:5000  
✅ **Swagger UI**: http://localhost:5000/api-docs  
✅ **Authentication**: Optional (MVP Mode)

## Quick Tests

### 1. Test Without Authentication

```bash
# Get all users (works without auth)
curl http://localhost:5000/api/users

# Get user by ID (works without auth)
curl http://localhost:5000/api/users/68f4849e2abb8cbbccc6d6b7

# Get user stats (works without auth)
curl http://localhost:5000/api/users/stats
```

### 2. Test With Authentication

First, get your Firebase token from the Flutter app or Firebase Console.

```bash
# Set your token
TOKEN="your-firebase-id-token-here"

# Get current user profile
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/users/profile

# Sync Firebase user to MongoDB
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/sync/me

# Update current user profile
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name", "phone": "+1234567890"}' \
  http://localhost:5000/api/users/profile

# Get current user's projects
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/users/projects
```

### 3. Test All Major Endpoints

```bash
# Projects
curl http://localhost:5000/api/projects

# Tasks
curl http://localhost:5000/api/tasks

# Materials
curl http://localhost:5000/api/materials

# Budget
curl http://localhost:5000/api/budget

# Documents
curl http://localhost:5000/api/documents

# Dashboard
curl http://localhost:5000/api/dashboard

# Sync Stats
curl http://localhost:5000/api/sync/stats
```

## Expected Responses

### Success Response (with data):
```json
{
  "status": "success",
  "message": "Users retrieved successfully",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 6,
    "totalPages": 1
  },
  "timestamp": "2025-10-19T06:39:28.626Z"
}
```

### Success Response (no data):
```json
{
  "status": "success",
  "message": "No users found",
  "data": [],
  "timestamp": "2025-10-19T06:39:28.626Z"
}
```

### Error Response (helpful):
```json
{
  "status": "error",
  "message": "Authentication required. Please provide a valid Firebase token in Authorization header",
  "timestamp": "2025-10-19T06:39:28.626Z"
}
```

### User Not Synced:
```json
{
  "status": "error",
  "message": "User profile not found in MongoDB. Try calling POST /api/sync/me to sync your Firebase user",
  "timestamp": "2025-10-19T06:39:28.626Z"
}
```

## Flutter Integration

### Get Users (No Auth Needed):
```dart
final response = await SustainableConstructionManagementAPIGroup
    .getUsersCall
    .call();

if (response.succeeded) {
  final users = GetUsersCall.users(response.jsonBody);
  print('Found ${users.length} users');
}
```

### Get Current User Profile (Auth Required):
```dart
final token = await FirebaseAuth.instance.currentUser?.getIdToken();

final response = await SustainableConstructionManagementAPIGroup
    .getCurrentUserProfileCall
    .call(firebaseAuth: token);

if (response.succeeded) {
  final userData = GetCurrentUserProfileCall.userData(response.jsonBody);
  print('User: ${GetCurrentUserProfileCall.userName(response.jsonBody)}');
} else {
  print('Error: ${response.jsonBody}');
}
```

### Sync Firebase User:
```dart
final token = await FirebaseAuth.instance.currentUser?.getIdToken();

final response = await SustainableConstructionManagementAPIGroup
    .syncFirebaseUserCall
    .call(firebaseAuth: token);

if (response.succeeded) {
  final synced = SyncFirebaseUserCall.synced(response.jsonBody);
  print('User synced: $synced');
}
```

## Common Issues & Solutions

### 1. "User profile not found"
**Solution**: Call `POST /api/sync/me` to sync your Firebase user to MongoDB

### 2. "Authentication required"
**Solution**: Make sure you're passing the Firebase token:
```dart
final token = await FirebaseAuth.instance.currentUser?.getIdToken();
// Use token in API calls
```

### 3. "EADDRINUSE: address already in use"
**Solution**: Kill the process on port 5000:
```bash
lsof -ti:5000 | xargs kill -9
```

### 4. "MongoDB connection error"
**Solution**: Make sure MongoDB is running:
```bash
sudo systemctl start mongod
# or
brew services start mongodb-community
```

## API Response Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required (helpful message in MVP) |
| 404 | Not Found | Resource not found (helpful message in MVP) |
| 500 | Server Error | Internal server error |

## Health Check

```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Expected response:
# {"status":"success","message":"API is healthy","timestamp":"..."}
```

## Database Cleanup

If you need to clean up old records without `isDeleted` field:

```bash
# Dry run (see what would be deleted)
cd /home/icy/github/uee-backend
node migrations/cleanup-deleted-records.js --dry-run

# Actual cleanup
node migrations/cleanup-deleted-records.js

# Clean specific collection only
node migrations/cleanup-deleted-records.js --collection=users
```

## Migration Scripts

### Sync All Firebase Users to MongoDB:
```bash
cd /home/icy/github/uee-backend

# Dry run
node migrations/sync-firebase-users.js --dry-run

# Actual sync
node migrations/sync-firebase-users.js

# Force update existing users
node migrations/sync-firebase-users.js --force
```

## Useful Commands

```bash
# Start backend
cd /home/icy/github/uee-backend && npm start

# View backend logs
tail -f /home/icy/github/uee-backend/logs/app.log

# Check MongoDB status
mongosh sustainable-construction --eval "db.users.count()"

# View all collections
mongosh sustainable-construction --eval "db.getCollectionNames()"

# Stop backend
pkill -f "node server.js"
```

## Documentation Links

- **Full Auth Guide**: [MVP_AUTH_UPDATE_SUMMARY.md](MVP_AUTH_UPDATE_SUMMARY.md)
- **Firebase Sync Guide**: [../ueescratch-ppsgae/FIREBASE_USER_SYNC_GUIDE.md](../ueescratch-ppsgae/FIREBASE_USER_SYNC_GUIDE.md)
- **API Documentation**: [README.md](README.md)
- **Setup Guide**: [SETUP.md](SETUP.md)

---

**Quick Start**: Backend is ready! Just call the APIs from Flutter - auth is optional for MVP! 🚀

