# 🪣 Create New DigitalOcean Spaces Bucket: `uee`

## ✅ Why a New Bucket?

Your old bucket `space.uee` has a dot in the name, which causes SSL certificate errors. The new bucket `uee` (no dots) will work perfectly with:
- ✅ CDN URLs
- ✅ Virtual-hosted-style URLs
- ✅ No SSL certificate issues
- ✅ Better performance with CDN enabled

## 📋 Step-by-Step Guide

### 1. Create the Bucket

1. **Go to DigitalOcean Dashboard**
   - Navigate to: [Spaces & Object Storage](https://cloud.digitalocean.com/spaces)
   
2. **Click "Create a Spaces Bucket"**

3. **Configure the Bucket:**
   - **Choose a datacenter region**: `San Francisco 3` (SFO3) - *Same as your current bucket*
   - **Bucket Name**: `uee` (no dots, lowercase only)
   - **Enable CDN**: ✅ **YES** - Check this box!
   - **File Listing**: Choose "Private" (recommended for security)
   
4. **Click "Create Spaces Bucket"**

5. **Save Your Endpoints:**
   After creation, you'll see:
   - **Origin Endpoint**: `https://uee.sfo3.digitaloceanspaces.com`
   - **CDN Endpoint**: `https://uee.sfo3.cdn.digitaloceanspaces.com` ✅

### 2. Configure Bucket Permissions

1. **Go to your bucket settings**
2. **Under "Permissions"**:
   - Ensure it allows public-read for uploaded files
   - Or keep private and files will be accessible via their individual ACLs

### 3. (Optional) Configure CORS

If you plan to upload files directly from browser:

1. **Click on bucket → Settings → CORS Configurations**
2. **Add CORS rule:**
   ```json
   {
     "CORSRules": [
       {
         "AllowedOrigins": ["*"],
         "AllowedMethods": ["GET", "PUT", "POST"],
         "AllowedHeaders": ["*"],
         "MaxAgeSeconds": 3000
       }
     ]
   }
   ```

### 4. Get API Keys

If you don't have them already:

1. **Go to**: [API → Spaces Keys](https://cloud.digitalocean.com/account/api/spaces)
2. **Click "Generate New Key"**
3. **Name it**: "UEE Backend"
4. **Save both keys immediately** (you won't see the secret again!)

### 5. Update Your .env File

Update your local `.env` file with the new bucket name:

```bash
# DigitalOcean Spaces Configuration
SPACES_KEY=your_actual_access_key
SPACES_SECRET=your_actual_secret_key
SPACES_BUCKET=uee
SPACES_REGION=sfo3
SPACES_ENDPOINT=sfo3.digitaloceanspaces.com
SPACES_CDN_ENABLED=true
SPACES_CDN_ENDPOINT=https://uee.sfo3.cdn.digitaloceanspaces.com
```

**Important changes:**
- ✅ `SPACES_BUCKET=uee` (was `space.uee`)
- ✅ `SPACES_CDN_ENABLED=true` (was `false`)
- ✅ `SPACES_CDN_ENDPOINT=https://uee.sfo3.cdn.digitaloceanspaces.com`

### 6. Update Production Environment

If deploying on DigitalOcean App Platform:

1. **Go to your App → Settings → Environment Variables**
2. **Update or add these variables:**
   - `SPACES_BUCKET` = `uee`
   - `SPACES_CDN_ENABLED` = `true`
   - `SPACES_CDN_ENDPOINT` = `https://uee.sfo3.cdn.digitaloceanspaces.com`
   - (Keep your existing `SPACES_KEY` and `SPACES_SECRET`)
3. **Redeploy your app**

### 7. Test the Setup

After updating:

```bash
# Restart your server
cd /home/icy/app/uee-backend
# Stop with Ctrl+C, then:
pnpm dev
```

**Test URL generation:**
```bash
node test-url-generation.js
```

Expected output:
```
✅ Using CDN URL - should work perfectly with 'uee' bucket!
Generated URL: https://uee.sfo3.cdn.digitaloceanspaces.com/...
```

**Test file upload:**
```bash
curl -X POST http://localhost:5000/api/documents/upload \
  -F "projectId=test-project" \
  -F "category=photo" \
  -F "document=@test-image.jpg"
```

Expected response:
```json
{
  "fileUrl": "https://uee.sfo3.cdn.digitaloceanspaces.com/test-project/12345-test-image.jpg"
}
```

**Test in browser:**
- Copy the `fileUrl` from the response
- Open it in your browser
- Image should load instantly via CDN ✅

## 🎯 Before/After Comparison

| Bucket | SSL Issues | CDN Support | URL Format |
|--------|-----------|-------------|------------|
| `space.uee` ❌ | Yes, dot in name | ❌ No | Path-style only |
| `uee` ✅ | No | ✅ Yes | CDN + all formats |

## 📦 What About Old Files?

Your old bucket `space.uee` will remain untouched:
- ✅ Existing files stay there
- ✅ No data loss
- ✅ New uploads go to `uee` bucket
- 🔄 Optionally migrate old files later if needed

## ✅ Success Checklist

- [ ] Created new `uee` bucket in SFO3 region
- [ ] Enabled CDN on the bucket
- [ ] Noted down CDN endpoint
- [ ] Updated `.env` with new bucket name
- [ ] Set `SPACES_CDN_ENABLED=true`
- [ ] Updated CDN endpoint URL
- [ ] Restarted server
- [ ] Tested URL generation (shows CDN URL)
- [ ] Uploaded test file
- [ ] File URL works in browser without SSL errors
- [ ] Updated production environment variables

## 🚀 Result

After completing these steps, your files will:
- ✅ Upload directly to the new `uee` bucket
- ✅ Be served via fast CDN: `https://uee.sfo3.cdn.digitaloceanspaces.com`
- ✅ Load instantly worldwide
- ✅ No SSL certificate errors
- ✅ Full CDN caching and optimization

---

**Ready to create the bucket?** Start with Step 1! 🎉

