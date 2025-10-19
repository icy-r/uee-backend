# Database Migrations

This directory contains migration scripts for the Sustainable Construction Management API.

## Firebase Users to MongoDB Migration

### Overview
The `sync-firebase-users.js` script synchronizes users from Firebase Authentication to MongoDB. This is useful for:
- Initial data migration from Firebase to MongoDB
- Keeping MongoDB user data in sync with Firebase
- Backing up user data
- Enabling dual authentication (Firebase + MongoDB)

### Prerequisites

1. **Environment Variables**: Ensure your `.env` file contains:
   ```env
   MONGODB_URI=mongodb://localhost:27017/sustainable-construction
   
   # Option 1: Service Account Key (recommended)
   FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
   
   # Option 2: Application Default Credentials
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json
   ```

2. **Firebase Service Account**:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file securely
   - Either:
     - Set `FIREBASE_SERVICE_ACCOUNT_KEY` to the JSON content (as string)
     - Set `GOOGLE_APPLICATION_CREDENTIALS` to the file path

3. **MongoDB Running**:
   ```bash
   # Start MongoDB locally
   mongod --dbpath /path/to/data/db
   
   # Or use Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

### Usage

#### Dry Run (Preview Changes)
Test the migration without making any changes:
```bash
node migrations/sync-firebase-users.js --dry-run
```

#### Basic Migration
Sync all users (skip existing ones):
```bash
node migrations/sync-firebase-users.js
```

#### Force Update
Overwrite existing users in MongoDB:
```bash
node migrations/sync-firebase-users.js --force
```

#### Custom Batch Size
Process users in smaller/larger batches:
```bash
node migrations/sync-firebase-users.js --batch-size=50
```

#### Combined Options
```bash
node migrations/sync-firebase-users.js --force --batch-size=200
```

### What Gets Migrated

For each Firebase user, the script migrates:
- **Basic Info**: UID, email, display name, phone number, photo URL
- **Role**: From custom claims (defaults to 'Worker')
- **Status**: Active/Inactive based on disabled flag
- **Metadata**: Creation time, last sign-in, email verification
- **Providers**: All authentication providers linked to the account

### User Mapping

Firebase Field → MongoDB Field:
- `uid` → `firebaseUid`
- `email` → `email`
- `displayName` → `name`
- `phoneNumber` → `phone`
- `photoURL` → `avatar`
- `customClaims.role` → `role`
- `disabled` → `status` (inactive/active)
- `emailVerified` → `emailVerified`

### Output Example

```
🔄 Firebase to MongoDB User Migration
=====================================

✓ Firebase Admin initialized
✓ Connected to MongoDB

Fetching users from Firebase Auth...
✓ Fetched 150 users from Firebase

Syncing 150 users to MongoDB...
Batch size: 100
Mode: LIVE
Force update: NO

[150/150] Created: user@example.com

============================================================
MIGRATION SUMMARY
============================================================
Total users processed: 150
Created: 142
Updated: 0
Skipped: 8
Errors: 0
============================================================

✓ Migration completed successfully!
```

### Error Handling

The script handles:
- **Network errors**: Retries Firebase API calls
- **Validation errors**: Logs user email and error details
- **Duplicate users**: Skips unless `--force` flag is used
- **Missing data**: Uses defaults (e.g., 'Unnamed User' for missing names)

Errors are logged to the summary with details:
```
ERROR DETAILS:
  - user@example.com: Email already exists
  - another@example.com: Invalid phone number format
```

### Best Practices

1. **Always dry-run first**:
   ```bash
   node migrations/sync-firebase-users.js --dry-run
   ```

2. **Backup MongoDB before force update**:
   ```bash
   mongodump --db sustainable-construction --out backup/
   node migrations/sync-firebase-users.js --force
   ```

3. **Run during low-traffic periods**:
   - Large migrations can be resource-intensive
   - Consider using `--batch-size` for better control

4. **Verify results**:
   ```bash
   # Check MongoDB user count
   mongo sustainable-construction --eval "db.users.countDocuments()"
   
   # Check for users without Firebase UID
   mongo sustainable-construction --eval "db.users.countDocuments({firebaseUid: {$exists: false}})"
   ```

5. **Schedule regular syncs** (optional):
   ```bash
   # Cron job for daily sync (1 AM)
   0 1 * * * cd /path/to/uee-backend && node migrations/sync-firebase-users.js >> logs/sync.log 2>&1
   ```

### Troubleshooting

#### "Firebase credentials not found"
- Check `.env` file has `FIREBASE_SERVICE_ACCOUNT_KEY` or `GOOGLE_APPLICATION_CREDENTIALS`
- Verify the service account JSON is valid
- Ensure the service account has Firebase Admin SDK permissions

#### "Failed to connect to MongoDB"
- Verify MongoDB is running: `mongosh --eval "db.adminCommand('ping')"`
- Check `MONGODB_URI` in `.env`
- Ensure no firewall blocking port 27017

#### "User already exists" errors
- Use `--force` flag to overwrite existing users
- Or manually resolve conflicts in MongoDB

#### Permission errors
- Ensure Firebase service account has "Firebase Admin SDK Administrator Service Agent" role
- Check MongoDB user has write permissions

### Rollback

If you need to undo the migration:

1. **Delete migrated users**:
   ```javascript
   // In MongoDB shell
   db.users.deleteMany({ 
     firebaseUid: { $exists: true },
     createdAt: { $gte: ISODate("2024-10-19T00:00:00Z") }
   })
   ```

2. **Restore from backup**:
   ```bash
   mongorestore --db sustainable-construction backup/sustainable-construction
   ```

### Next Steps

After successful migration:

1. **Update User Model**: Ensure `User.js` model matches your requirements
2. **Update Auth Middleware**: Modify `auth.js` to check both Firebase and MongoDB
3. **Test Authentication**: Verify both Firebase and MongoDB auth work
4. **Update API Endpoints**: Ensure profile endpoints work with synced data

### Support

For issues or questions:
- Check backend logs: `tail -f logs/app.log`
- Review MongoDB logs: `tail -f /var/log/mongodb/mongod.log`
- Consult Firebase Admin SDK docs: https://firebase.google.com/docs/admin/setup

