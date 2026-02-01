/**
 * Congressional Data API - MVP Server
 * 
 * Simple REST API for congressional data
 * Phase 1: Basic endpoints for bills, members, votes
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // CORS
app.use(express.json()); // JSON body parser

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Routes
const billsRouter = require('./routes/bills');
const membersRouter = require('./routes/members');
const votesRouter = require('./routes/votes');

app.use('/api/bills', billsRouter);
app.use('/api/members', membersRouter);
app.use('/api/votes', votesRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '0.1.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Congressional Data API',
    version: '0.1.0',
    description: 'Developer-friendly congressional data with AI features',
    documentation: '/docs',
    endpoints: {
      bills: '/api/bills',
      members: '/api/members',
      votes: '/api/votes'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} does not exist`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Congressional API running on port ${PORT}`);
  console.log(`📖 Documentation: http://localhost:${PORT}/docs`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
