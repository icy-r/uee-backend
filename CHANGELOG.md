# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2024-10-12

### Changed
- **Replaced SSE with Socket.IO for Log Viewer** 🔄
  - Switched from Server-Sent Events to Socket.IO for better reliability
  - Auto-reconnection built-in
  - Automatic fallback to HTTP polling if WebSocket fails
  - Works across all browsers and proxies
  - More stable connection handling

### Added
- Socket.IO integration for real-time communication
- Improved connection status indicators
- Better error handling and recovery

### Removed
- Old SSE-based log streaming implementation
- `src/services/logStream.service.js` (replaced with socketLogger)
- Non-working SSE endpoints

### New Files
- `src/services/socketLogger.service.js` - Socket.IO-based log service
- `test-socket-logs.js` - New test script for Socket.IO logs

### Modified
- `server.js` - Integrated Socket.IO with HTTP server
- `src/middleware/logger.js` - Updated to use Socket.IO service
- `src/controllers/logs.controller.js` - Rewritten with Socket.IO client
- `src/routes/logs.routes.js` - Removed SSE stream endpoint
- `README.md` - Updated to reflect Socket.IO implementation
- `LOG_VIEWER_GUIDE.md` - Updated documentation for Socket.IO

### Technical Details
- Uses Socket.IO v4+ for WebSocket with fallback
- Bi-directional communication support
- Event-based architecture
- Auto-reconnection with exponential backoff
- Cross-browser compatible

### Usage
```bash
# Start server
npm run dev

# Open browser
http://localhost:5000/logs
```

### Why Socket.IO?
- ✅ More reliable than SSE
- ✅ Auto-reconnection built-in
- ✅ Works through firewalls/proxies
- ✅ Battle-tested in production
- ✅ Bi-directional communication

---

## [1.1.0] - 2024-10-12 (Deprecated)

### Added
- Initial real-time log viewer attempt with SSE (replaced in 1.2.0)

### Security Notes
- ⚠️ The `/logs` endpoint is currently PUBLIC
- For production, consider adding authentication middleware
- Sensitive data is automatically masked in logs

---

## [1.0.0] - Previous

### Initial Release
- Dashboard API
- Material Management
- Task Management  
- Budget/Finance Management
- Document Management
- AI-powered features (Gemini)
- n8n integration
- Weather API integration
- OData-like query system
- FlutterFlow integration guides
