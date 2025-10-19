# Firebase to MongoDB Migration Guide

This guide walks you through migrating Firebase users to MongoDB for the Sustainable Construction Management API.

## Overview

The migration process syncs user data from Firebase Authentication to MongoDB, enabling:
- **Dual Authentication**: Support both Firebase and MongoDB auth
- **Enhanced User Management**: Rich user profiles with roles and permissions
- **Offline Capability**: Local user data for offline features
- **Performance**: Faster queries with MongoDB indexes

## Prerequisites Checklist

- [ ] Firebase project with existing users
- [ ] Firebase service account credentials
- [ ] MongoDB instance running (local or remote)
- [ ] Node.js 14+ installed
- [ ] Backend dependencies installed (`npm install`)

## Step 1: Setup Environment

### 1.1 Configure Environment Variables

Create or update `/home/icy/github/uee-backend/.env`:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/sustainable-construction

# Firebase Service Account (Option 1: Inline JSON)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk@your-project.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}

# OR Option 2: File Path
GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 1.2 Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (⚙️) → **Service Accounts**
4. Click **Generate New Private Key**
5. Save the downloaded JSON file securely
6. Either:
   - Copy the JSON content to `FIREBASE_SERVICE_ACCOUNT_KEY` (remove line breaks)
   - Or save the file and set `GOOGLE_APPLICATION_CREDENTIALS` to its path

### 1.3 Start MongoDB

**Local MongoDB:**
```bash
mongod --dbpath /path/to/data/db
```

**Docker MongoDB:**
```bash
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:latest
```

**Verify MongoDB is running:**
```bash
mongosh --eval "db.adminCommand('ping')"
```

## Step 2: Test Setup (Optional but Recommended)

### 2.1 Create Test Users

```bash
cd /home/icy/github/uee-backend
node migrations/test-migration.js create
```

This creates 3 test users:
- `manager.test@construction.com` (Admin role)
- `worker1.test@construction.com` (Worker role)
- `worker2.test@construction.com` (Worker role)

### 2.2 Dry Run Migration

Preview what will be migrated without making changes:

```bash
node migrations/sync-firebase-users.js --dry-run
```

**Expected output:**
```
🔄 Firebase to MongoDB User Migration
=====================================

✓ Firebase Admin initialized
✓ Connected to MongoDB

Fetching users from Firebase Auth...
✓ Fetched 3 users from Firebase

Syncing 3 users to MongoDB...
Batch size: 100
Mode: DRY RUN
Force update: NO

[DRY RUN] Would create: manager.test@construction.com
[DRY RUN] Would create: worker1.test@construction.com
[DRY RUN] Would create: worker2.test@construction.com

============================================================
MIGRATION SUMMARY
============================================================
Total users processed: 3
Created: 3
Updated: 0
Skipped: 0
Errors: 0
============================================================

⚠️  This was a DRY RUN. No changes were made to MongoDB.
```

## Step 3: Run Migration

### 3.1 Backup MongoDB (Safety First!)

```bash
mongodump \
  --db sustainable-construction \
  --out backup/$(date +%Y%m%d_%H%M%S)
```

### 3.2 Run Actual Migration

```bash
node migrations/sync-firebase-users.js
```

**Monitor progress:**
- Progress is shown in real-time: `[150/150] Created: user@example.com`
- Errors are logged with details
- Summary is displayed at the end

### 3.3 Force Update Existing Users (if needed)

If users already exist and you want to overwrite them:

```bash
node migrations/sync-firebase-users.js --force
```

**Warning:** This will overwrite existing user data in MongoDB!

## Step 4: Verify Migration

### 4.1 Check User Counts

```bash
# MongoDB user count
mongosh sustainable-construction --eval "db.users.countDocuments()"

# Firebase user count (should match)
node migrations/test-migration.js verify
```

### 4.2 Verify Sample Users

```javascript
// In MongoDB shell (mongosh)
use sustainable-construction

// Find a user by email
db.users.findOne({ email: "manager.test@construction.com" })

// Check all users have Firebase UID
db.users.countDocuments({ firebaseUid: { $exists: true } })

// Verify role distribution
db.users.aggregate([
  { $group: { _id: "$role", count: { $sum: 1 } } }
])
```

### 4.3 Test API Endpoints

**Update Flutter app base URL** (already done):
```dart
// lib/backend/api_requests/api_calls.dart
static String getBaseUrl() => 'http://localhost:5000';
```

**Start backend:**
```bash
cd /home/icy/github/uee-backend
npm start
```

**Test profile endpoint:**
```bash
# Get Firebase ID token first (from Flutter app or Firebase Console)
curl -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  http://localhost:5000/api/users/profile
```

## Step 5: Production Migration

### 5.1 Pre-Migration Checklist

- [ ] Announce maintenance window to users
- [ ] Backup Firebase data (export users via Firebase Console)
- [ ] Backup MongoDB database
- [ ] Test migration on staging/development environment
- [ ] Prepare rollback plan
- [ ] Monitor system resources (CPU, memory, network)

### 5.2 Production Migration Steps

```bash
# 1. Put system in maintenance mode
# 2. Run migration with larger batch size for speed
node migrations/sync-firebase-users.js --batch-size=500

# 3. Verify critical users migrated correctly
node migrations/test-migration.js verify

# 4. Test authentication flows
# 5. Monitor logs for errors
tail -f logs/app.log

# 6. Remove maintenance mode
```

### 5.3 Post-Migration Monitoring

Monitor these for 24-48 hours:
- User login success rate
- API response times
- Error rates in logs
- Database performance
- User complaints/support tickets

## Troubleshooting

### Issue: "Firebase credentials not found"

**Solution:**
```bash
# Verify .env file exists
cat .env | grep FIREBASE

# Check JSON validity
node -e "console.log(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))"

# Test Firebase Admin initialization
node -e "
  const admin = require('firebase-admin');
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  console.log('✓ Firebase Admin initialized');
"
```

### Issue: "Failed to connect to MongoDB"

**Solution:**
```bash
# Check MongoDB is running
mongosh --eval "db.adminCommand('ping')"

# Check connection string
echo $MONGODB_URI

# Test connection with Node.js
node -e "
  const mongoose = require('mongoose');
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✓ Connected'))
    .catch(err => console.error('✗', err.message));
"
```

### Issue: "User already exists" errors

**Solution:**
```bash
# Use force update to overwrite
node migrations/sync-firebase-users.js --force

# Or delete existing users first
mongosh sustainable-construction --eval "
  db.users.deleteMany({ 
    firebaseUid: { \$exists: true } 
  })
"
```

### Issue: Migration is slow

**Solutions:**
```bash
# Increase batch size
node migrations/sync-firebase-users.js --batch-size=500

# Check network latency
ping firestore.googleapis.com

# Check MongoDB performance
mongosh --eval "db.users.stats()"

# Add MongoDB indexes
mongosh sustainable-construction --eval "
  db.users.createIndex({ firebaseUid: 1 }, { unique: true });
  db.users.createIndex({ email: 1 }, { unique: true });
"
```

## Rollback Procedure

If migration fails or causes issues:

### Option 1: Restore from Backup

```bash
# Stop backend
pm2 stop server

# Restore MongoDB from backup
mongorestore --db sustainable-construction backup/TIMESTAMP/sustainable-construction

# Start backend
pm2 start server

# Verify restoration
mongosh sustainable-construction --eval "db.users.countDocuments()"
```

### Option 2: Delete Migrated Users

```bash
# Delete only users created by migration
mongosh sustainable-construction --eval "
  db.users.deleteMany({
    firebaseUid: { \$exists: true },
    createdAt: { \$gte: ISODate('2024-10-19T00:00:00Z') }
  })
"
```

## Cleanup

After successful migration and verification:

### Remove Test Users

```bash
node migrations/test-migration.js cleanup
```

### Archive Migration Scripts (Optional)

```bash
mkdir -p migrations/archive
mv migrations/sync-firebase-users.js migrations/archive/
mv migrations/test-migration.js migrations/archive/
```

## Next Steps

1. **Update Authentication Flow**:
   - Modify `src/middleware/auth.js` to support both Firebase and MongoDB auth
   - Add fallback logic if Firebase token fails

2. **Enable Offline Support**:
   - Implement SQLite caching in Flutter app
   - Sync offline changes when connection restored

3. **Monitor Performance**:
   - Add MongoDB indexes for frequently queried fields
   - Implement connection pooling
   - Use Redis for session caching

4. **Documentation**:
   - Update API documentation with new endpoints
   - Document dual authentication flow
   - Create user migration SOP for team

## Support

For issues or questions:
- Check backend logs: `tail -f logs/app.log`
- Review MongoDB logs: `tail -f /var/log/mongodb/mongod.log`
- Firebase Admin SDK: https://firebase.google.com/docs/admin/setup
- MongoDB docs: https://docs.mongodb.com/

## Summary Checklist

- [ ] Environment variables configured
- [ ] MongoDB running and accessible
- [ ] Firebase credentials valid
- [ ] Test migration successful (dry-run)
- [ ] Backup created
- [ ] Production migration completed
- [ ] Verification passed
- [ ] API endpoints working
- [ ] Monitoring in place
- [ ] Rollback plan tested
- [ ] Documentation updated
- [ ] Team notified

---

**Migration Date**: _________________  
**Migrated By**: _________________  
**Total Users Migrated**: _________________  
**Verification Status**: ☐ Passed ☐ Failed  
**Notes**: _________________

