require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
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
app.use(helmet());
app.use(cors());
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

