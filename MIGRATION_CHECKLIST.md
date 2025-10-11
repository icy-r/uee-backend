# DigitalOcean Spaces Migration Checklist

## ✅ Completed

- [x] Installed AWS SDK and multer-s3 packages
- [x] Created storage service for Spaces operations
- [x] Updated file upload to use Spaces instead of local disk
- [x] Updated document controller to use Spaces URLs
- [x] Added temporary file download for AI processing
- [x] Removed local static file middleware
- [x] Updated environment configuration template
- [x] Created setup documentation

## 📝 Your Action Items

### 1. Get API Credentials (5 minutes)
- [ ] Go to [DigitalOcean Spaces Keys](https://cloud.digitalocean.com/account/api/spaces)
- [ ] Generate new API key
- [ ] Save both Access Key and Secret Key

### 2. Update Environment Variables (2 minutes)

#### Local Development (`.env`)
```bash
SPACES_KEY=your_access_key_here
SPACES_SECRET=your_secret_key_here
SPACES_BUCKET=uee
SPACES_REGION=sfo3
SPACES_ENDPOINT=sfo3.digitaloceanspaces.com
SPACES_CDN_ENABLED=true
SPACES_CDN_ENDPOINT=https://uee.sfo3.cdn.digitaloceanspaces.com
```

#### Production (DigitalOcean App Platform)
- [ ] Add environment variables in App Settings
- [ ] Redeploy the app

### 3. Test the Migration (10 minutes)

#### Test File Upload
```bash
# Replace with your actual project ID
curl -X POST http://localhost:5000/api/documents/upload \
  -F "projectId=YOUR_PROJECT_ID" \
  -F "category=photo" \
  -F "document=@test-image.jpg"
```

Expected response includes:
- `fileUrl` with CDN endpoint
- `staticUrl` with CDN endpoint
- `previewUrl` with CDN endpoint

#### Verify in Spaces
- [ ] Open DigitalOcean Spaces dashboard
- [ ] Navigate to `uee` bucket
- [ ] Confirm file appears in project folder

#### Test File Access
- [ ] Copy `fileUrl` from upload response
- [ ] Open URL in browser
- [ ] Image should load via CDN

#### Test AI Processing (if using)
```bash
curl -X POST http://localhost:5000/api/documents/DOCUMENT_ID/extract-text
```

### 4. Monitor First Deployment (5 minutes)
- [ ] Deploy to production
- [ ] Check application logs
- [ ] Upload test file
- [ ] Verify file persists after redeployment

## 🎯 Success Criteria

✅ Files upload successfully to Spaces
✅ CDN URLs are returned in API responses
✅ Files are accessible via browser
✅ AI processing works (downloads temp files)
✅ Files persist after server rebuild
✅ No local disk storage used

## 📊 Before/After Comparison

| Feature | Before (Local Storage) | After (Spaces) |
|---------|----------------------|----------------|
| **Storage** | Local disk | DigitalOcean Spaces |
| **Persistence** | ❌ Lost on rebuild | ✅ Permanent |
| **Scalability** | Limited by disk | ✅ Unlimited |
| **Performance** | Server bandwidth | ✅ CDN cached |
| **Cost** | Server disk | Pay per GB |
| **Backups** | Manual | ✅ Automatic |

## 🚨 Important Notes

1. **Backwards Compatibility**: Existing documents in database with local file paths won't work automatically. You'll need to migrate them or handle both paths.

2. **Temp Directory**: AI processing creates temporary files in `uee-backend/temp/`. This directory is automatically cleaned up but ensure it's writable.

3. **Public Access**: Files are uploaded with `public-read` ACL. If you need private files, modify the `acl` setting in `fileUpload.js`.

4. **CDN Caching**: CDN may cache files. If you update a file with same name, it might serve cached version. Use versioned filenames (already implemented with timestamps).

## 🔄 Rollback Plan (If Needed)

If you need to rollback to local storage:

1. Restore original `fileUpload.js` from git:
   ```bash
   git checkout HEAD~1 -- src/utils/fileUpload.js
   ```

2. Restore original `document.controller.js`:
   ```bash
   git checkout HEAD~1 -- src/controllers/document.controller.js
   ```

3. Restore `server.js`:
   ```bash
   git checkout HEAD~1 -- server.js
   ```

4. Remove packages:
   ```bash
   pnpm remove @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer-s3
   ```

## 📞 Support

Need help? Check:
- `DIGITALOCEAN_SPACES_SETUP.md` - Detailed setup guide
- Application logs for specific errors
- DigitalOcean Spaces dashboard for bucket status

---

**Ready to test?** Start with checklist item #1! 🚀

