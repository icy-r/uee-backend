# Sustainable Construction Backend - Setup Guide

## Prerequisites

Before setting up the backend, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v5 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **npm** or **yarn** package manager
- **Git** for version control

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd uee-backend
```

## Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Express.js (web framework)
- Mongoose (MongoDB ODM)
- Firebase Admin SDK (authentication)
- Google Generative AI (Gemini API)
- Axios (HTTP client)
- And other dependencies

## Step 3: Set Up MongoDB

### Option A: Local MongoDB

1. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS (Homebrew)
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

2. Verify MongoDB is running:
   ```bash
   mongosh
   ```

3. The database will be created automatically when the application starts.

### Option B: MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get connection string from Atlas dashboard
4. Use this connection string in your `.env` file

## Step 4: Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Navigate to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Download the JSON file
6. Extract the following values for your `.env` file:
   - `project_id`
   - `private_key`
   - `client_email`

## Step 5: Get API Keys

### Google Gemini API

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Copy the key for your `.env` file

### OpenWeather API

1. Sign up at [OpenWeather](https://openweathermap.org/api)
2. Get your free API key
3. Copy the key for your `.env` file

## Step 6: Configure n8n Integration

The n8n MCP server is already configured. If you need to update it:

1. Open `mcp.json` in your Cursor configuration
2. Verify the n8n webhook URL is correct
3. Ensure n8n workflows are deployed and accessible

## Step 7: Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit the `.env` file with your actual values:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/sustainable-construction
# For MongoDB Atlas use:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/sustainable-construction

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key-here

# OpenWeather API
OPENWEATHER_API_KEY=your-openweather-api-key-here
DEFAULT_LOCATION=Colombo,LK

# n8n Configuration
N8N_WEBHOOK_URL=https://n8n.icy-r.dev/mcp/a38260d2-7457-432e-bde5-254a4cf83f63

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

### Important Notes:

1. **Firebase Private Key**: 
   - Keep the `\n` characters in the private key
   - Wrap the entire key in quotes
   - Make sure there are no extra spaces

2. **MongoDB URI**:
   - Local: `mongodb://localhost:27017/sustainable-construction`
   - Atlas: Replace `<username>` and `<password>` with your credentials

3. **Default Location**:
   - Format: `City,CountryCode` (e.g., "Colombo,LK", "London,UK")

## Step 8: Create Upload Directory

```bash
mkdir uploads
```

Or it will be created automatically when you upload the first file.

## Step 9: Start the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server should start on `http://localhost:5000`

## Step 10: Verify Installation

### Check Health Endpoint
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "success",
  "message": "Sustainable Construction API is running",
  "timestamp": "2024-10-08T12:00:00.000Z"
}
```

### Check Database Connection
Look for this message in the console:
```
✅ MongoDB Connected: localhost
```

### Check Firebase
Look for this message in the console:
```
✅ Firebase Admin initialized
```

## Troubleshooting

### MongoDB Connection Issues

**Error**: `MongooseServerSelectionError`

**Solutions**:
- Verify MongoDB is running: `mongosh`
- Check connection string in `.env`
- For Atlas, ensure IP whitelist includes your IP
- Check firewall settings

### Firebase Initialization Error

**Error**: `Firebase initialization error`

**Solutions**:
- Verify all Firebase credentials are correct
- Ensure private key includes `\n` characters
- Check quotes around the private key
- Verify the service account has proper permissions

### Gemini API Errors

**Error**: `Failed to estimate materials`

**Solutions**:
- Verify API key is valid and active
- Check API quotas in Google AI Studio
- Ensure API key has access to Gemini Pro model
- Check network connectivity

### OpenWeather API Errors

**Error**: `Failed to fetch weather data`

**Solutions**:
- Verify API key is valid
- Check the location format (City,CountryCode)
- Free tier has rate limits - check usage
- Wait a few hours after creating new API key (activation delay)

### Port Already in Use

**Error**: `EADDRINUSE: address already in use`

**Solutions**:
- Change PORT in `.env` file
- Kill process using port 5000:
  ```bash
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  
  # macOS/Linux
  lsof -ti:5000 | xargs kill -9
  ```

### File Upload Issues

**Error**: File upload fails

**Solutions**:
- Ensure `uploads` directory exists
- Check file size limits (MAX_FILE_SIZE)
- Verify file type is allowed
- Check disk space

## Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:5000/health

# Get project overview (requires project ID)
curl "http://localhost:5000/api/dashboard/overview?projectId=YOUR_PROJECT_ID"
```

### Using Postman

1. Import the provided Postman collection (if available)
2. Set the base URL to `http://localhost:5000`
3. Test each endpoint

### Using Browser

For GET requests, simply open in browser:
```
http://localhost:5000/health
http://localhost:5000/api/dashboard/weather?location=Colombo,LK
```

## Creating Your First Project

Since this is an MVP, you'll need to create a project directly in MongoDB:

```javascript
// Connect to MongoDB
mongosh

// Use the database
use sustainable-construction

// Create a project
db.projects.insertOne({
  name: "Sample Construction Project",
  description: "A sample residential construction project",
  location: "Colombo",
  startDate: new Date("2024-01-01"),
  expectedEndDate: new Date("2024-12-31"),
  status: "in_progress",
  progressPercentage: 0,
  sustainabilityScore: 0,
  teamSize: 10,
  projectType: "residential",
  projectSize: {
    value: 2000,
    unit: "sqft"
  },
  owner: "admin@example.com",
  createdBy: "admin@example.com"
})
```

Copy the generated `_id` and use it as `projectId` in API calls.

## Development Tips

### Auto-reload on Changes

The `nodemon` package is configured for development. Any changes to files will automatically restart the server.

### Debugging

Add debug logs:
```javascript
console.log('Debug:', variable);
```

Or use Node.js debugger:
```bash
node --inspect server.js
```

### Testing AI Features

AI features require valid API keys and may take a few seconds to respond. Be patient and check console logs for errors.

### Testing n8n Integration

Ensure your n8n workflows are:
1. Deployed and accessible
2. Configured to accept webhook requests
3. Returning the expected response format

## Production Deployment

### Environment Setup

1. Set `NODE_ENV=production` in `.env`
2. Use production-grade MongoDB (Atlas recommended)
3. Set up proper security:
   - Enable HTTPS
   - Configure CORS properly
   - Use strong API keys
   - Enable rate limiting

### Deployment Platforms

**Recommended platforms:**
- **Heroku**: Easy deployment with MongoDB Atlas
- **Railway**: Modern platform with great developer experience
- **DigitalOcean**: App Platform or Droplets
- **AWS**: EC2 or Elastic Beanstalk
- **Google Cloud**: App Engine or Cloud Run

### Deployment Checklist

- [ ] Environment variables configured
- [ ] MongoDB connection secured
- [ ] Firebase credentials secured
- [ ] API keys secured
- [ ] CORS configured for your domains
- [ ] Rate limiting enabled
- [ ] Error logging configured
- [ ] Backup strategy in place
- [ ] Health monitoring set up

## Next Steps

1. Review the [API Documentation](./API_DOCUMENTATION.md)
2. Test all endpoints with your project ID
3. Integrate with your Flutter mobile app
4. Set up CI/CD pipeline (optional)
5. Configure monitoring and logging (optional)

## Support

If you encounter issues not covered in this guide:

1. Check the console logs for error messages
2. Review the [API Documentation](./API_DOCUMENTATION.md)
3. Check MongoDB, Firebase, and API service statuses
4. Ensure all environment variables are set correctly
5. Contact the development team

## Useful Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start

# Check for security vulnerabilities
npm audit

# Update dependencies
npm update

# View logs
tail -f logs/app.log  # If logging is configured
```

## Security Best Practices

1. **Never commit `.env` file** - It's in `.gitignore`
2. **Rotate API keys regularly**
3. **Use environment variables for all secrets**
4. **Enable authentication in production** (replace `optionalAuth` with `requireAuth`)
5. **Configure CORS** to allow only your mobile app domains
6. **Use HTTPS** in production
7. **Implement rate limiting** to prevent abuse
8. **Regular security audits**: `npm audit`
9. **Keep dependencies updated**
10. **Monitor API usage** and set up alerts

## Backup and Recovery

### Database Backup

```bash
# MongoDB backup
mongodump --uri="mongodb://localhost:27017/sustainable-construction" --out=./backup

# Restore
mongorestore --uri="mongodb://localhost:27017/sustainable-construction" ./backup/sustainable-construction
```

### File Backup

Regularly backup the `uploads` directory:
```bash
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/
```

## Performance Optimization

1. **Database Indexing**: Add indexes for frequently queried fields
2. **Caching**: Implement Redis caching for frequently accessed data
3. **Pagination**: Always use pagination for large datasets
4. **Compression**: Enable gzip compression
5. **CDN**: Use CDN for file uploads in production

## Monitoring

Consider setting up:
- **Error tracking**: Sentry, Rollbar
- **Performance monitoring**: New Relic, DataDog
- **Uptime monitoring**: UptimeRobot, Pingdom
- **Log aggregation**: LogDNA, Papertrail

---

**Happy Coding!** 🚀

