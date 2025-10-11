# Deploy to Production - Quick Guide

**Status:** ✅ Code tested and ready  
**Date:** October 11, 2025

## What Was Changed

✅ Replaced n8n with Google Gemini AI + Tesseract OCR (100% FREE)  
✅ All local tests passing  
✅ Zero cost - no billing accounts required

## Production Deployment Steps

### 1. Deploy Code to Production Server

```bash
# SSH into your production server
ssh your-server

# Navigate to backend directory
cd /path/to/uee-backend

# Pull latest changes
git pull origin main

# Install optional Tesseract dependency (recommended for free OCR fallback)
npm install tesseract.js
# or
pnpm add tesseract.js
```

### 2. Verify Environment Variables

Make sure your `.env` file has:

```bash
# Required
GEMINI_API_KEY=your-gemini-api-key-here

# All other existing variables should remain the same
```

**Get Gemini API Key** (FREE):
1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy and paste into .env

### 3. Restart the Server

```bash
# If using PM2
pm2 restart uee-backend

# If using systemd
sudo systemctl restart uee-backend

# If using nodemon/npm
npm restart
```

### 4. Test Production Endpoints

```bash
# Health check
http GET https://api.uee.icy-r.dev/health

# Upload a test document
http --form --ignore-stdin POST https://api.uee.icy-r.dev/api/documents/upload \
  document@test-image.png \
  projectId=YOUR_PROJECT_ID \
  category=photo \
  description="Production test"

# Extract text (replace DOCUMENT_ID with the ID from upload response)
http POST https://api.uee.icy-r.dev/api/documents/DOCUMENT_ID/extract-text

# Complete processing
http POST https://api.uee.icy-r.dev/api/documents/DOCUMENT_ID/process
```

## Expected Results

✅ Text extraction works with Tesseract OCR (free, local)  
✅ Task generation works with Gemini AI (free tier: 1500/day)  
✅ No errors about n8n or billing  
✅ Response shows `"method":"tesseract-ocr"` or `"method":"gemini-vision"`

## What If Something Goes Wrong?

### Issue: "GEMINI_API_KEY is not defined"
**Fix:** Add the API key to your .env file and restart

### Issue: "Tesseract OCR not available"
**Impact:** Minor - OCR will only fail if Gemini Vision also fails  
**Fix:** `npm install tesseract.js` (optional but recommended)

### Issue: "Method not recognized"
**Fix:** Make sure you deployed ALL files, including the Document model update

## Files That Changed

Key files to ensure are deployed:
- ✅ `src/services/gemini.service.js` - Enhanced with vision
- ✅ `src/services/cloudvision.service.js` - Tesseract fallback (NEW)
- ✅ `src/controllers/document.controller.js` - Updated to use Gemini
- ✅ `src/models/Document.js` - Added new method enums
- ✅ `src/services/n8n.service.js` - Deprecated (commented out)
- ✅ `package.json` - Added tesseract.js as optional

## Monitoring After Deployment

Check server logs for:
```bash
pm2 logs uee-backend

# Look for:
✅ Tesseract OCR initialized as free fallback
✅ Gemini Vision extracted text from...
```

## Cost Summary

- **Gemini AI**: FREE (1500 requests/day)
- **Tesseract OCR**: FREE (unlimited, runs locally)
- **Total Cost**: $0.00 🎉

---

**Need Help?** Check `GEMINI_MIGRATION_SUMMARY.md` for detailed information.

