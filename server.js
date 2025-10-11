require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const connectDB = require('./src/config/database');
const { initializeFirebase } = require('./src/config/firebase');
const errorHandler = require('./src/middleware/errorHandler');

// Import routes
const projectRoutes = require('./src/routes/project.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');
const materialRoutes = require('./src/routes/material.routes');
const taskRoutes = require('./src/routes/task.routes');
const budgetRoutes = require('./src/routes/budget.routes');
const documentRoutes = require('./src/routes/document.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Configure Helmet with relaxed CSP for Swagger UI
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "http://localhost:5000", "https://api.uee.icy-r.dev"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(cors(
  {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Initialize connections
connectDB();
initializeFirebase();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Sustainable Construction API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/documents', documentRoutes);

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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📚 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌍 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;

