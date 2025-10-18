require('dotenv').config();
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const connectDB = require('./src/config/database');
const { initializeFirebase } = require('./src/config/firebase');
const errorHandler = require('./src/middleware/errorHandler');
const requestLogger = require('./src/middleware/logger');
const socketLoggerService = require('./src/services/socketLogger.service');

// Import routes
const projectRoutes = require('./src/routes/project.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');
const materialRoutes = require('./src/routes/material.routes');
const taskRoutes = require('./src/routes/task.routes');
const budgetRoutes = require('./src/routes/budget.routes');
const documentRoutes = require('./src/routes/document.routes');
const logsRoutes = require('./src/routes/logs.routes');
const userRoutes = require("./src/routes/user.routes");

// New routes
const wasteRoutes = require("./src/routes/waste.routes");
const sustainabilityRoutes = require("./src/routes/sustainability.routes");
const aiRoutes = require("./src/routes/ai.routes");
const analyticsRoutes = require("./src/routes/analytics.routes");
const notificationRoutes = require("./src/routes/notification.routes");
const reportsRoutes = require("./src/routes/reports.routes");
const syncRoutes = require("./src/routes/sync.routes");

const app = express();
const httpServer = http.createServer(app);
const io = socketio(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO logger service
socketLoggerService.initialize(io);

// Middleware
// Configure Helmet with relaxed CSP for Swagger UI
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: [
          "'self'",
          "http://localhost:5000",
          "https://api.uee.icy-r.dev",
        ],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Request/Response logger for real-time monitoring
app.use(requestLogger);

// Initialize connections
connectDB();
initializeFirebase();

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Sustainable Construction API is running",
    timestamp: new Date().toISOString(),
  });
});

// Log viewer - Public endpoint for monitoring
app.use("/logs", logsRoutes);

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/documents", documentRoutes);

// New API Routes
app.use("/api/waste", wasteRoutes);
app.use("/api/sustainability", sustainabilityRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/sync", syncRoutes);

// Swagger UI Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'Sustainable Construction API',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true
  }
}));

// Redirect root to API docs
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server with Socket.IO
httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📚 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌍 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Log Viewer: http://localhost:${PORT}/logs`);
});

module.exports = app;

