/**
 * AI-Powered Dynamic Planner - Backend Server
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// AI operations rate limit (more restrictive)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 AI requests per minute
  message: 'Too many AI requests, please slow down.'
});
app.use('/api/ask', aiLimiter);
app.use('/api/autofill', aiLimiter);

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'AI-Powered Dynamic Planner API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: 'GET /api/health',
      chunk: 'POST /api/chunk',
      index: 'POST /api/index',
      search: 'POST /api/search',
      ask: 'POST /api/ask',
      autofill: 'POST /api/autofill',
      deleteIndex: 'DELETE /api/index/:templateId'
    },
    docs: 'https://github.com/svend4/daten4/tree/main/ai-planner'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 AI-Powered Dynamic Planner API');
  console.log('================================');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️ ChromaDB: ${process.env.CHROMA_URL || 'http://localhost:8000'}`);
  console.log(`🤖 AI Model: Claude 3.5 Sonnet`);
  console.log('');
  console.log('Available endpoints:');
  console.log(`  GET  /              - API info`);
  console.log(`  GET  /api/health    - Health check`);
  console.log(`  POST /api/chunk     - Chunk template`);
  console.log(`  POST /api/index     - Index chunks`);
  console.log(`  POST /api/search    - Search chunks`);
  console.log(`  POST /api/ask       - Ask AI question`);
  console.log(`  POST /api/autofill  - Auto-fill field`);
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
