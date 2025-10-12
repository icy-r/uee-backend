/**
 * Socket.IO Log Service
 * Manages real-time log streaming using Socket.IO
 */

class SocketLoggerService {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
    this.io = null;
  }

  /**
   * Initialize with Socket.IO instance
   */
  initialize(io) {
    this.io = io;
    console.log('📡 Socket.IO logger service initialized');
    
    // Handle new client connections
    this.io.on('connection', (socket) => {
      console.log(`📱 Client connected: ${socket.id}`);
      
      // Send existing logs to new client
      socket.emit('init', this.logs);
      
      socket.on('disconnect', () => {
        console.log(`📱 Client disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Add a new log entry and broadcast to all clients
   */
  addLog(logEntry) {
    const log = {
      ...logEntry,
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString()
    };

    this.logs.push(log);
    
    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Broadcast to all connected clients
    if (this.io) {
      this.io.emit('log', log);
    }
  }

  /**
   * Get all logs
   */
  getLogs() {
    return this.logs;
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    if (this.io) {
      this.io.emit('clear');
    }
    console.log('🗑️  Logs cleared');
  }
}

// Singleton instance
const socketLoggerService = new SocketLoggerService();

module.exports = socketLoggerService;

