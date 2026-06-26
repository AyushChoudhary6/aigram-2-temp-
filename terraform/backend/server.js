/**
 * Aigram Video Upload Backend
 * Production-ready Express server with Azure integration
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const uploadRoutes = require('./routes/upload');
const transcribeRoutes = require('./routes/transcribe');
const quizRoutes = require('./routes/quiz');
const feedRoutes = require('./routes/feed');
const { errorHandler } = require('./middleware/errorHandler');
const { logRequest } = require('./middleware/logging');
const awsConfig = require('./config/aws');

// Initialize app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(logRequest);

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'aigram-video-upload-backend',
    version: '1.0.0'
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    provider: 'AWS',
    features: {
      videoUpload: true,
      s3Bucket: !!process.env.AWS_S3_BUCKET,
      dynamoDb: !!process.env.AWS_DYNAMODB_TABLE
    }
  });
});

// API Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/transcribe', transcribeRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/feed', feedRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Aigram Video Upload Backend API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      status: 'GET /api/status',
      uploadVideo: 'POST /api/upload/video',
      generateSas: 'POST /api/upload/sas-token',
      getMetadata: 'GET /api/upload/metadata/:videoId',
      updateMetadata: 'PUT /api/upload/metadata/:videoId',
      transcribeVideo: 'POST /api/transcribe',
      transcribeStatus: 'GET /api/transcribe/status',
      generateQuiz: 'POST /api/quiz/generate',
      quizStatus: 'GET /api/quiz/status'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.originalUrl,
    message: 'The requested resource was not found'
  });
});

// Global error handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║     Aigram Backend Server v2.0 (AWS) Started              ║
╠═══════════════════════════════════════════════════════════╣
║ Environment: ${process.env.NODE_ENV || 'development'}${' '.repeat(38 - (process.env.NODE_ENV || 'development').length)}║
║ Port: ${PORT}${' '.repeat(54)}║
║ Provider: AWS                                             ║
║ S3 Bucket: ${process.env.AWS_S3_BUCKET || 'Not configured'}${' '.repeat(44 - (process.env.AWS_S3_BUCKET || 'Not configured').length)}║
║ DynamoDB: ${process.env.AWS_DYNAMODB_TABLE || 'Not configured'}${' '.repeat(46 - (process.env.AWS_DYNAMODB_TABLE || 'Not configured').length)}║
╚═══════════════════════════════════════════════════════════╝
  `);
  
  // Validate AWS Configuration
  awsConfig.validateEnvironment();

  console.log('Available Endpoints:');
  console.log('  GET  /health');
  console.log('  GET  /api/status');
  console.log('  POST /api/upload/video');
  console.log('  POST /api/upload/sas-token');
  console.log('  GET  /api/upload/metadata/:videoId');
  console.log('  PUT  /api/upload/metadata/:videoId');
  console.log('  POST /api/transcribe');
  console.log('  GET  /api/transcribe/status');
  console.log('  POST /api/quiz/generate');
  console.log('  GET  /api/quiz/status');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app;

// Trigger nodemon restart to pick up GROQ_API_KEY
