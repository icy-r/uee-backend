# Automatic Firebase to MongoDB User Sync

This system automatically syncs users from Firebase Authentication to MongoDB whenever a new user is created.

## 🚀 How It Works

There are **three automatic sync mechanisms**:

### 1. **Authentication Middleware** (Primary - Always Active)
Every time a user authenticates (logs in), the system automatically checks if they exist in MongoDB. If not, they're synced immediately.

**Location**: `src/middleware/auth.js`

**How it works**:
- User logs in → Firebase token verified
- System checks MongoDB for user
- If user doesn't exist → Auto-syncs from Firebase
- If user exists → Updates last login timestamp

**Advantages**:
- ✅ No setup required
- ✅ Works immediately
- ✅ Guaranteed to sync on first login
- ✅ Zero maintenance

**When it triggers**:
- First login after signup
- Any authenticated API request
- Profile page access
- Any protected endpoint

### 2. **Manual Sync Endpoints** (On-Demand)
API endpoints for manual synchronization when needed.

**Endpoints**:

```bash
# Sync current authenticated user
POST /api/sync/me
Headers: Authorization: Bearer <firebase-token>

# Sync specific user by Firebase UID
POST /api/sync/user/:firebaseUid

# Sync all Firebase users
POST /api/sync/all
Body: { "force": false, "batchSize": 100 }

# Get sync statistics
GET /api/sync/stats
```

**Usage Examples**:

```bash
# From Flutter app (automatic on first API call)
# No action needed - happens automatically

# Manual sync via curl (testing)
curl -X POST http://localhost:5000/api/sync/user/USER_FIREBASE_UID

# Sync all users (one-time bulk operation)
curl -X POST http://localhost:5000/api/sync/all \
  -H "Content-Type: application/json" \
  -d '{"force": false}'

# Check sync status
curl http://localhost:5000/api/sync/stats
```

### 3. **Firebase Cloud Functions** (Optional - Real-time)
Triggers immediately when user is created in Firebase Auth.

**Setup** (Optional):

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Initialize Firebase Functions**:
   ```bash
   cd /home/icy/github/uee-backend/firebase/functions
   npm install
   ```

3. **Configure Backend URL**:
   ```bash
   # Set your backend URL as environment variable
   firebase functions:config:set backend.url="https://api.uee.icy-r.dev"
   
   # For development/testing
   firebase functions:config:set backend.url="http://localhost:5000"
   ```

4. **Deploy Functions**:
   ```bash
   firebase deploy --only functions
   ```

**Available Cloud Functions**:
- `onUserCreate` - Triggers when new user signs up
- `onUserDelete` - Triggers when user is deleted
- `syncUserToMongo` - Manual HTTP trigger

## 📊 Sync Flow Diagram

```
New User Signs Up (Flutter App)
    ↓
Firebase Authentication
    ↓
    ├─→ [OPTIONAL] Cloud Function Triggers
    │       ↓
    │   Webhook Call to Backend
    │       ↓
    │   User Synced to MongoDB
    │
User Logs In / Makes API Call
    ↓
Auth Middleware Checks MongoDB
    ↓
User Not Found?
    ↓
[PRIMARY] Auto-Sync from Firebase
    ↓
User Exists in MongoDB ✓
```

## 🔧 Configuration

### Backend Configuration (`.env`)

```env
# Required for auto-sync
GOOGLE_APPLICATION_CREDENTIALS=./ueescratch-ppsgae-firebase-adminsdk-fbsvc-0f65f15e04.json
FIREBASE_PROJECT_ID=ueescratch-ppsgae
MONGODB_URI=mongodb://localhost:27017/sustainable-construction

# Optional: Webhook secret for security
WEBHOOK_SECRET=your-secure-secret-key
```

### Firebase Functions Configuration

```bash
# Set backend URL for webhooks
firebase functions:config:set \
  backend.url="http://localhost:5000" \
  webhook.secret="your-secure-secret-key"
```

## 🧪 Testing Auto-Sync

### Test 1: Create New User in Flutter App

1. Sign up a new user in your Flutter app
2. Check backend logs for sync message:
   ```
   ✓ Auto-synced new user: newuser@example.com (firebase-uid)
   ```
3. Verify in MongoDB:
   ```bash
   mongosh sustainable-construction --eval "db.users.find({email: 'newuser@example.com'})"
   ```

### Test 2: Manual Sync via API

```bash
# Create test user in Firebase (if needed)
# Then sync to MongoDB
curl -X POST http://localhost:5000/api/sync/user/FIREBASE_UID

# Expected response:
{
  "status": "success",
  "message": "User synced successfully",
  "data": {
    "user": {...},
    "synced": true,
    "message": "User created successfully"
  }
}
```

### Test 3: Check Sync Statistics

```bash
curl http://localhost:5000/api/sync/stats

# Expected response:
{
  "status": "success",
  "data": {
    "firebase": {
      "total": 9
    },
    "mongodb": {
      "total": 22,
      "synced": 9,
      "unsynced": 13
    },
    "sync": {
      "percentage": "100.00%",
      "missing": 0,
      "recent24h": 3
    }
  }
}
```

## 📝 Code Implementation

### Auto-Sync Middleware (`src/middleware/autoSyncFirebaseUser.js`)

```javascript
// Automatically called on every authenticated request
const result = await syncFirebaseUserToMongo(firebaseUid);

if (result.synced) {
  console.log(`✓ Auto-synced new user: ${email}`);
} else {
  // User already exists, just update last login
}
```

### Auth Middleware Integration (`src/middleware/auth.js`)

```javascript
// After token verification
req.user = { uid, email, name };

// Auto-sync (async, doesn't block request)
syncFirebaseUserToMongo(uid).catch(err => {
  console.error('Background sync failed:', err.message);
});
```

## 🎯 User Data Mapping

Firebase → MongoDB:
```javascript
{
  firebaseUid: user.uid,
  email: user.email,
  name: user.displayName || 'Unnamed User',
  phone: user.phoneNumber,
  avatar: user.photoURL,
  role: customClaims.role || 'Worker',
  status: user.disabled ? 'inactive' : 'active',
  emailVerified: user.emailVerified,
  lastLogin: new Date(),
  providers: [...] // Auth providers
}
```

## ⚠️ Important Notes

### Security Considerations

1. **Webhook Endpoints** should validate requests:
   ```javascript
   // Add to webhook handler
   const { authorization } = req.headers;
   if (authorization !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
     return res.status(401).json({ error: 'Unauthorized' });
   }
   ```

2. **Production deployment**:
   - Restrict `/api/sync/all` to admin only
   - Add rate limiting to sync endpoints
   - Use HTTPS for all webhook calls

### Performance Considerations

- ✅ Auto-sync is **async** (doesn't block requests)
- ✅ Duplicate syncs are **prevented** (checks if user exists)
- ✅ Failed syncs **retry on next login**
- ✅ Sync stats are **cached** for performance

### Failure Handling

**If sync fails**:
1. Error logged to console
2. Request continues successfully
3. User automatically synced on next login
4. No data loss

**Common failure reasons**:
- MongoDB connection lost → Retries on next request
- Firebase rate limit → Sync queued
- Network timeout → Retries automatically

## 🔍 Monitoring & Debugging

### View Sync Logs

```bash
# Backend logs
tail -f logs/app.log | grep sync

# Look for:
✓ Auto-synced new user: email@example.com (uid)
⚠️ User already exists in MongoDB
✗ Failed to sync user: error message
```

### Check Sync Status

```bash
# Get detailed statistics
curl http://localhost:5000/api/sync/stats | jq

# Count synced users in MongoDB
mongosh sustainable-construction --eval "
  db.users.countDocuments({ firebaseUid: { \$exists: true } })
"

# Find recent syncs (last hour)
mongosh sustainable-construction --eval "
  db.users.find({
    firebaseUid: { \$exists: true },
    createdAt: { \$gte: new Date(Date.now() - 3600000) }
  }).count()
"
```

### Test Sync Function

```javascript
// Direct function test
const { syncFirebaseUserToMongo } = require('./src/middleware/autoSyncFirebaseUser');

syncFirebaseUserToMongo('firebase-user-id')
  .then(result => console.log('Sync result:', result))
  .catch(error => console.error('Sync error:', error));
```

## 🚀 Quick Start

**For most users, you don't need to do anything!**

Auto-sync works automatically via the authentication middleware. Just:

1. ✅ User signs up in Flutter app
2. ✅ User logs in or makes any API call
3. ✅ Middleware automatically syncs to MongoDB
4. ✅ Done!

**Optional**: Deploy Firebase Cloud Functions for real-time sync on signup (before first login).

## 📚 Related Documentation

- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Initial bulk migration
- [QUICK_START.md](./QUICK_START.md) - Backend setup guide
- [migrations/README.md](./migrations/README.md) - Migration scripts

## 🆘 Troubleshooting

### User not syncing automatically

**Check 1**: Is authentication middleware running?
```bash
# Should see this in logs when user logs in
Auth middleware executed for user: email@example.com
✓ Auto-synced new user: email@example.com
```

**Check 2**: Is MongoDB connected?
```bash
curl http://localhost:5000/health
# Should show MongoDB connection status
```

**Check 3**: Manual sync
```bash
# Force sync specific user
curl -X POST http://localhost:5000/api/sync/user/FIREBASE_UID
```

### Duplicate user errors

This is normal! If user already exists:
- First login attempt → Creates user
- Subsequent logins → Updates last login
- No duplicate creation

### Cloud Function not triggering

1. Check Firebase Functions deployment:
   ```bash
   firebase functions:list
   ```

2. Check Cloud Function logs:
   ```bash
   firebase functions:log --only onUserCreate
   ```

3. Verify backend URL configuration:
   ```bash
   firebase functions:config:get
   ```

## ✅ Success Indicators

You'll know auto-sync is working when:

- ✅ New users appear in MongoDB immediately after login
- ✅ Backend logs show "Auto-synced new user" messages
- ✅ Sync stats show 100% sync percentage
- ✅ No "user not found" errors in API calls
- ✅ Profile management works for all users

---

**Last Updated**: October 19, 2025  
**Auto-Sync Status**: ✅ Active and Working

