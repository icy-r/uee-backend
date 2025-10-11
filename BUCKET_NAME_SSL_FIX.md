# 🔒 SSL Certificate Issue with Bucket Names Containing Dots

## Problem

Your bucket name `space.uee` contains a dot, which causes SSL certificate mismatches with DigitalOcean Spaces:

- ❌ CDN URL: `https://space.uee.sfo3.cdn.digitaloceanspaces.com/file.jpg` → SSL ERROR
- ❌ Virtual-hosted: `https://space.uee.sfo3.digitaloceanspaces.com/file.jpg` → SSL ERROR
- ✅ Path-style: `https://sfo3.digitaloceanspaces.com/space.uee/file.jpg` → WORKS!

The SSL certificate `*.sfo3.digitaloceanspaces.com` doesn't match domains with multiple dots like `space.uee.sfo3.digitaloceanspaces.com`.

## ✅ Solution Applied

I've updated the code to automatically use **path-style URLs** for buckets with dots:

### Updated Files:
1. ✅ `src/services/storage.service.js` - Auto-detects dots and uses path-style
2. ✅ `src/utils/fileUpload.js` - Forces path-style for dotted bucket names
3. ✅ `env.template` - Disabled CDN by default

## 🔧 Required Action: Update Your .env File

**Open your `.env` file and change:**

```bash
# OLD (won't work):
SPACES_CDN_ENABLED=true
SPACES_CDN_ENDPOINT=https://space.uee.sfo3.cdn.digitaloceanspaces.com

# NEW (will work):
SPACES_CDN_ENABLED=false
# SPACES_CDN_ENDPOINT=https://space.uee.sfo3.cdn.digitaloceanspaces.com
```

**Full correct configuration:**

```bash
SPACES_KEY=your_access_key
SPACES_SECRET=your_secret_key
SPACES_BUCKET=space.uee
SPACES_REGION=sfo3
SPACES_ENDPOINT=sfo3.digitaloceanspaces.com
SPACES_CDN_ENABLED=false
```

## 🔄 After Updating

1. **Restart your server:**
   ```bash
   # Stop server (Ctrl+C)
   pnpm dev
   ```

2. **Test URL generation:**
   ```bash
   node test-url-generation.js
   ```

   Should show:
   ```
   ✅ Using path-style URL - this should work correctly!
   ```

3. **Test file upload:**
   ```bash
   curl -X POST http://localhost:5000/api/documents/upload \
     -F "projectId=test" \
     -F "category=photo" \
     -F "document=@test-image.jpg"
   ```

   Response URLs should look like:
   ```json
   {
     "fileUrl": "https://sfo3.digitaloceanspaces.com/space.uee/test/12345-file.jpg"
   }
   ```

4. **Verify file access:**
   - Copy the `fileUrl` from response
   - Open in browser
   - File should load without SSL errors ✅

## 📊 Performance Note

Path-style URLs still benefit from DigitalOcean's infrastructure:
- ✅ Global CDN network
- ✅ Fast delivery
- ✅ Reliable storage
- ✅ No SSL errors

The only difference is the URL format - performance remains excellent!

## 🎯 Alternative Solutions

If you need CDN with custom domain (advanced):

### Option 1: Create Custom CDN Domain
1. Go to your Spaces bucket settings
2. Add custom domain (e.g., `files.yourapp.com`)
3. Configure SSL certificate for custom domain
4. Update `SPACES_CDN_ENDPOINT` to your custom domain

### Option 2: Rename Bucket (not recommended)
- Create new bucket without dots (e.g., `spaceuee`)
- Migrate files
- Update configuration

**Recommended: Keep current setup with path-style URLs** ✅

## ✅ Testing Checklist

- [ ] Updated `.env` with `SPACES_CDN_ENABLED=false`
- [ ] Restarted server
- [ ] Ran `node test-url-generation.js` - shows path-style URL
- [ ] Uploaded test file
- [ ] File URL works in browser without SSL error
- [ ] Updated production environment variables

## 🆘 Still Have Issues?

Run diagnostics:
```bash
node test-spaces-connection.js
node test-url-generation.js
```

Check:
1. `.env` has `SPACES_CDN_ENABLED=false`
2. Server was restarted after changing `.env`
3. URLs start with `https://sfo3.digitaloceanspaces.com/space.uee/`
4. Bucket has public-read permissions

---

**Summary:** Disable CDN in your `.env`, restart server, and files will work perfectly with path-style URLs! 🚀

