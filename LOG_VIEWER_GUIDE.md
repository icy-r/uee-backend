# 📊 Real-Time Log Viewer Guide

## Overview

The API now includes a **public real-time log viewer** that streams all requests and responses automatically using Socket.IO. This allows you to monitor your API in production without SSH access to the server.

## Features

✨ **Real-time Updates** - Logs appear instantly using Socket.IO (WebSocket with auto-fallback)
🎨 **Beautiful UI** - Modern, responsive interface with color-coded requests
🔍 **Smart Filtering** - Filter logs by URL, method, or status code
📊 **Live Statistics** - Track total requests, success rate, errors, and avg response time
💾 **Export Logs** - Download logs as JSON for offline analysis
⏸️ **Pause/Resume** - Pause the stream to examine specific logs
🗑️ **Clear Logs** - Clear all logs from memory
🔒 **Sanitized** - Automatically hides sensitive data (passwords, tokens, API keys)
🔄 **Auto-Reconnect** - Automatically reconnects if connection is lost

## Accessing the Log Viewer

### Local Development
```
http://localhost:5000/logs
```

### Production
```
https://your-domain.com/logs
```

## Endpoints

### 1. Log Viewer UI (Browser)
```
GET /logs
```
Opens the interactive log viewer with real-time updates.

### 2. Socket.IO Connection
Socket.IO automatically connects when you open the log viewer. The endpoint `/socket.io` is handled automatically by the Socket.IO server.

### 3. Get Logs (API)
```
GET /logs/api
```
Returns all logs as JSON.

**Response:**
```json
{
  "status": "success",
  "count": 42,
  "data": [
    {
      "id": 1697123456789.123,
      "timestamp": "2024-10-12T10:30:45.123Z",
      "type": "success",
      "request": {
        "method": "GET",
        "url": "/api/projects",
        "path": "/api/projects",
        "query": {},
        "headers": { ... },
        "body": {},
        "ip": "192.168.1.1"
      },
      "response": {
        "statusCode": 200,
        "statusMessage": "OK",
        "body": { ... },
        "headers": { ... }
      },
      "duration": "45ms"
    }
  ]
}
```

### 4. Clear Logs
```
POST /logs/clear
```
Clears all logs from server memory.

**Response:**
```json
{
  "status": "success",
  "message": "Logs cleared successfully"
}
```

## Using the Log Viewer

### UI Components

1. **Statistics Dashboard**
   - Total Requests
   - Successful Requests (2xx status)
   - Error Requests (4xx/5xx status)
   - Average Response Time

2. **Controls Bar**
   - Connection Status (Connected/Disconnected)
   - Filter Input (search by URL, method, status)
   - Pause/Resume Button
   - Export Logs Button (downloads JSON)
   - Clear Button

3. **Log Entries**
   - Color-coded by HTTP method
   - Shows: Method, URL, Status Code, Duration, Timestamp
   - Click "View Details" to expand full request/response

### Filtering Logs

Type in the filter box to search:
- By URL: `/api/projects`
- By method: `GET`, `POST`, etc.
- By status code: `200`, `404`, `500`, etc.

### Keyboard Shortcuts

While the filter input is focused:
- `Escape` - Clear filter
- `Enter` - Apply filter

## Security Considerations

### Sensitive Data Protection
The logger automatically sanitizes these fields:
- `password`
- `token`
- `secret`
- `apiKey`
- `api_key`

They will appear as `***` in the logs.

### Authorization Headers
Authorization headers are masked as `***` to prevent token exposure.

### Public Access
⚠️ **IMPORTANT**: The `/logs` endpoint is currently **PUBLIC** and requires no authentication.

**For Production**, you should add authentication:

```javascript
// Add this to src/routes/logs.routes.js
const { verifyAuth } = require('../middleware/auth');

// Protect all log routes
router.use(verifyAuth); // Add this line at the top

router.get('/', logsController.getLogViewer);
// ... rest of routes
```

Or use environment-based access:

```javascript
// Only enable in development
if (process.env.NODE_ENV === 'development') {
  app.use('/logs', logsRoutes);
}
```

## Performance

### Memory Management
- Logs are stored in memory (not database)
- Maximum 1000 log entries kept
- Older logs are automatically removed
- Use "Clear" button or restart server to free memory

### Scalability
- SSE connections are lightweight
- Each client maintains a single HTTP connection
- Tested with 100+ concurrent viewers

## Testing

Run the test script to verify the log viewer:

```bash
node test-log-viewer.js
```

## Troubleshooting

### "Disconnected" Status
**Cause**: Lost connection to server
**Solution**: Socket.IO will auto-reconnect automatically

### No Logs Appearing
**Cause**: No API requests being made
**Solution**: Make some API calls to generate logs

### Connection Issues
**Cause**: Firewall or proxy blocking WebSocket
**Solution**: Socket.IO automatically falls back to HTTP polling

### High Memory Usage
**Cause**: Too many logs in memory
**Solution**: Click "Clear" button or restart server

## Integration with External Tools

### Webhook to Slack/Discord

You can modify `src/services/logStream.service.js` to send errors to Slack:

```javascript
addLog(logEntry) {
  // ... existing code ...
  
  // Send errors to Slack
  if (logEntry.type === 'error') {
    notifySlack(logEntry);
  }
}
```

### Export to Log Management Service

Integrate with services like Loggly, Papertrail, or DataDog:

```javascript
addLog(logEntry) {
  // ... existing code ...
  
  // Send to external service
  externalLogger.log(logEntry);
}
```

## Examples

### Monitor API Performance
1. Open `/logs` in your browser
2. Watch the "Avg Response Time" statistic
3. Filter by specific endpoint: `/api/projects`
4. Check response times for performance issues

### Debug Production Issues
1. Open `/logs` when issue occurs
2. Use filter to find specific requests
3. Click "View Details" to see full request/response
4. Export logs for further analysis

### Track Error Rates
1. Watch "Errors" statistic in real-time
2. Filter by `500` to see server errors
3. Check error response bodies for debugging

## Architecture

```
┌─────────────────┐
│   Client 1      │◄─────┐
│   (Browser)     │      │
└─────────────────┘      │
                         │
┌─────────────────┐      │  Socket.IO
│   Client 2      │◄─────┼─────────┐
│   (Browser)     │      │         │
└─────────────────┘      │         │
                         │         │
┌─────────────────┐      │         │      ┌──────────────────┐
│   Client N      │◄─────┘         ├──────┤  Socket.IO       │
│   (Browser)     │                │      │  Logger Service  │
└─────────────────┘                │      │  (In-Memory)     │
                                   │      └──────────────────┘
                                   │              ▲
                                   │              │
                              ┌────┴────┐   ┌─────┴──────┐
                              │  /logs  │   │  Logger    │
                              │ Routes  │   │ Middleware │
                              └─────────┘   └────────────┘
                                                  ▲
                                                  │
                                            All API Requests
```

**Technology:** Socket.IO (WebSocket with fallback to HTTP long-polling)

## Customization

### Change Log Retention
Edit `src/services/socketLogger.service.js`:
```javascript
this.maxLogs = 5000; // Keep 5000 logs instead of 1000
```

### Add Custom Fields
Edit `src/middleware/logger.js`:
```javascript
const requestLog = {
  // ... existing fields ...
  userId: req.user?.id, // Add custom fields
  sessionId: req.session?.id
};
```

### Customize UI Colors
Edit the `<style>` section in `src/controllers/logs.controller.js`

## Support

For issues or questions:
1. Check server console for errors
2. Check browser console for JavaScript errors
3. Verify server is running: `http://localhost:5000/health`

## License

Same as parent project.

