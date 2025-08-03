const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize basic server without database or email service
async function startServer() {
  try {
    console.log('Starting server...');

    // Trust proxy for proper IP detection
    app.set('trust proxy', true);

    // Basic middleware
    app.use(helmet());
    app.use(cors({
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true
    }));
    
    // Add cache-busting headers for API routes
    app.use('/api', (req, res, next) => {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.set('Expires', '0');
      res.set('Pragma', 'no-cache');
      next();
    });
    
    app.use(morgan('combined'));
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        message: 'Resource Management Portal API is running'
      });
    });

    // Basic NBL list endpoint (stub)
    app.get('/api/nbl-list', (req, res) => {
      res.status(200).json([]);
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('Express error:', err);
      
      res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
      });
    });

    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found'
      });
    });

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('Received SIGTERM, shutting down gracefully');
      server.close(() => {
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('Received SIGINT, shutting down gracefully');
      server.close(() => {
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

module.exports = app;
