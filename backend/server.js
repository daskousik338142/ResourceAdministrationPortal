const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
require('dotenv').config();

const resourceRoutes = require('./routes/resources');
const nblListRoutes = require('./routes/nblList');
const allocationDataRoutes = require('./routes/allocationData');
const newAllocationsRoutes = require('./routes/newAllocations');
const resourceEvaluationsRoutes = require('./routes/resourceEvaluations');
const { router: emailRoutes, setEmailService } = require('./routes/email');
const emailListRoutes = require('./routes/emailList');
const EmailService = require('./services/emailService');

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize email service
const emailService = new EmailService();
setEmailService(emailService);

// Make email service available to routes
app.locals.emailService = emailService;

// Trust proxy for proper IP detection
app.set('trust proxy', true);

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/resources', resourceRoutes);
app.use('/api/nbl-list', nblListRoutes);
app.use('/api/allocation-data', allocationDataRoutes);
app.use('/api/new-allocations', newAllocationsRoutes);
app.use('/api/resource-evaluations', resourceEvaluationsRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/email-list', emailListRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Resource Management Portal API is running'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`SMTP server running on port 2525`);
  console.log(`Email API available at: http://localhost:${PORT}/api/emails`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await emailService.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await emailService.shutdown();
  process.exit(0);
});

module.exports = app;
