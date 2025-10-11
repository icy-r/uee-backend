# DigitalOcean Spaces Migration Guide

## ✅ Migration Complete

Your backend has been successfully migrated to use DigitalOcean Spaces for persistent file storage. Files will now survive deployments and server rebuilds.

## 📋 Setup Steps

### 1. Get Your Spaces Credentials

You have a Spaces bucket set up:
- **Bucket Name**: `uee`
- **Region**: `sfo3`
- **Origin Endpoint**: `https://uee.sfo3.digitaloceanspaces.com`
- **CDN Endpoint**: `https://uee.sfo3.cdn.digitaloceanspaces.com`

Now you need to get your API keys:

1. Go to [DigitalOcean Dashboard → API → Spaces Keys](https://cloud.digitalocean.com/account/api/spaces)
2. Click "Generate New Key"
3. Give it a name (e.g., "UEE Backend Production")
4. **Save both keys immediately** (you won't see the secret again!)

### 2. Update Your Environment Variables

Add these variables to your `.env` file:

```bash
# DigitalOcean Spaces Configuration
SPACES_KEY=your_spaces_access_key_here
SPACES_SECRET=your_spaces_secret_key_here
SPACES_BUCKET=uee
SPACES_REGION=sfo3
SPACES_ENDPOINT=sfo3.digitaloceanspaces.com
SPACES_CDN_ENABLED=true
SPACES_CDN_ENDPOINT=https://uee.sfo3.cdn.digitaloceanspaces.com
```

**Important**: Replace `your_spaces_access_key_here` and `your_spaces_secret_key_here` with your actual credentials.

### 3. Configure DigitalOcean App Platform

If deploying on App Platform, add these environment variables in your app settings:

1. Go to your App → Settings → App-Level Environment Variables
2. Add each variable from step 2
3. Redeploy your app

### 4. Set Bucket Permissions (If Not Already Set)

Ensure your Spaces bucket allows public read access for files:

1. Go to your Spaces bucket settings
2. Under "File Listing" → Set to "Public" or "Private" (recommend Private for security)
3. Files are still accessible via CDN URLs even if bucket is private

## 🎯 What Changed

### New Files
- `src/services/storage.service.js` - Handles all Spaces operations
- `DIGITALOCEAN_SPACES_SETUP.md` - This guide

### Modified Files
- `src/utils/fileUpload.js` - Now uploads directly to Spaces
- `src/controllers/document.controller.js` - Uses Spaces URLs and handles temporary downloads for AI processing
- `server.js` - Removed local static file middleware
- `env.template` - Added Spaces configuration
- `package.json` - Added AWS SDK dependencies

### Removed
- Local `uploads/` directory usage (files now stored in Spaces)
- Static file serving middleware

## 🚀 How It Works

### File Upload Flow
1. Client uploads file → Multer processes it
2. File is directly uploaded to Spaces (no local storage)
3. Database stores the Spaces key (e.g., `projectId/filename`)
4. Response includes CDN URL for immediate access

### File Access
All document responses now include:
```json
{
  "_id": "...",
  "filename": "example.jpg",
  "fileUrl": "https://space.uee.sfo3.cdn.digitaloceanspaces.com/projectId/filename.jpg",
  "staticUrl": "https://space.uee.sfo3.cdn.digitaloceanspaces.com/projectId/filename.jpg",
  "previewUrl": "https://space.uee.sfo3.cdn.digitaloceanspaces.com/projectId/filename.jpg"
}
```

### AI Processing
- When AI services need to process images (OCR, task generation), files are temporarily downloaded
- Processing happens on downloaded temp file
- Temp file is automatically cleaned up after processing

### File URLs
- **Direct CDN Access**: Files served via DigitalOcean CDN for fast global delivery
- **Download Endpoint**: `/api/documents/:id/download` - Forces file download
- **Preview Endpoint**: `/api/documents/:id/preview` - Shows inline for images/PDFs

## 📝 API Response Examples

### Upload Document
```bash
POST /api/documents/upload
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "projectId": "507f191e810c19729de860ea",
    "filename": "1697123456789-blueprint.jpg",
    "originalName": "blueprint.jpg",
    "fileType": "image/jpeg",
    "fileSize": 2048576,
    "filePath": "507f191e810c19729de860ea/1697123456789-blueprint.jpg",
    "fileUrl": "https://space.uee.sfo3.cdn.digitaloceanspaces.com/507f191e810c19729de860ea/1697123456789-blueprint.jpg",
    "staticUrl": "https://space.uee.sfo3.cdn.digitaloceanspaces.com/507f191e810c19729de860ea/1697123456789-blueprint.jpg",
    "previewUrl": "https://space.uee.sfo3.cdn.digitaloceanspaces.com/507f191e810c19729de860ea/1697123456789-blueprint.jpg",
    "createdAt": "2025-10-11T20:00:00.000Z"
  }
}
```

## 🧪 Testing

### 1. Test File Upload
```bash
curl -X POST http://localhost:5000/api/documents/upload \
  -F "projectId=YOUR_PROJECT_ID" \
  -F "category=photo" \
  -F "document=@/path/to/image.jpg"
```

### 2. Verify File in Spaces
1. Go to your Spaces bucket in DigitalOcean
2. Navigate to the project folder
3. Verify the file appears there

### 3. Test File Access
Open the `fileUrl` from the upload response in your browser - the image should load via CDN.

### 4. Test Download
```bash
curl http://localhost:5000/api/documents/DOCUMENT_ID/download --output downloaded-file.jpg
```

### 5. Test AI Processing
```bash
curl -X POST http://localhost:5000/api/documents/DOCUMENT_ID/extract-text
```

## 🔧 Troubleshooting

### "Cannot read property 'key' of undefined"
- Check that `SPACES_KEY` and `SPACES_SECRET` are set in your environment

### "Access Denied" errors
- Verify your Spaces keys are correct
- Ensure bucket name matches (`uee`)
- Check bucket permissions allow public-read ACL

### Files not appearing in Spaces
- Verify multer-s3 is uploading: Check logs for errors
- Test credentials with AWS CLI or S3 browser

### AI processing fails
- Check that temp directory is writable
- Verify files are publicly accessible (for download)
- Check Gemini API key is configured

## 🎉 Benefits

✅ **Persistent Storage** - Files survive deployments and rebuilds
✅ **CDN Delivery** - Fast global file access
✅ **Scalable** - No disk space limitations
✅ **Reliable** - DigitalOcean handles backups and redundancy
✅ **Cost Effective** - Only pay for what you use

## 📚 Additional Resources

- [DigitalOcean Spaces Documentation](https://docs.digitalocean.com/products/spaces/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Multer-S3 Documentation](https://www.npmjs.com/package/multer-s3)

## 🆘 Need Help?

If you encounter any issues:
1. Check the application logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test Spaces access using the DigitalOcean web interface
4. Ensure your API keys have the correct permissions

