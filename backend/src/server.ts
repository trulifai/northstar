/**
 * Northstar API Server
 * Congressional Intelligence Platform Backend
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import config from './config';

// Routes
import billsRouter from './routes/bills.route';
import membersRouter from './routes/members.route';

const app: Application = express();

// ============================================================================
// Security Middleware
// ============================================================================

// Helmet for security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// ============================================================================
// Body Parsing Middleware
// ============================================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// Request Logging Middleware
// ============================================================================

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
});

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.env,
    version: process.env.npm_package_version || '0.1.0',
  });
});

// ============================================================================
// API Routes
// ============================================================================

app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'Northstar Congressional Intelligence API',
    version: '1.0.0',
    description: 'Complete congressional data API with AI-powered intelligence',
    documentation: '/api/docs',
    endpoints: {
      bills: '/api/bills',
      members: '/api/members',
      votes: '/api/votes',
      committees: '/api/committees',
      amendments: '/api/amendments',
      hearings: '/api/hearings',
    },
  });
});

// Mount route handlers
app.use('/api/bills', billsRouter);
app.use('/api/members', membersRouter);

// Placeholder routes (to be implemented)
app.get('/api/votes', (req: Request, res: Response) => {
  res.json({ message: 'Votes endpoint - coming soon' });
});

app.get('/api/committees', (req: Request, res: Response) => {
  res.json({ message: 'Committees endpoint - coming soon' });
});

app.get('/api/amendments', (req: Request, res: Response) => {
  res.json({ message: 'Amendments endpoint - coming soon' });
});

app.get('/api/hearings', (req: Request, res: Response) => {
  res.json({ message: 'Hearings endpoint - coming soon' });
});

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} does not exist`,
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[ERROR]', err.stack);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.env === 'development' ? err.message : 'An unexpected error occurred',
    ...(config.env === 'development' && { stack: err.stack }),
  });
});

// ============================================================================
// Server Startup
// ============================================================================

const PORT = config.port;

app.listen(PORT, () => {
  console.log('');
  console.log('==================================================');
  console.log('🇺🇸  Northstar Congressional Intelligence Platform');
  console.log('==================================================');
  console.log('');
  console.log(`Environment:  ${config.env}`);
  console.log(`Server:       http://localhost:${PORT}`);
  console.log(`API:          http://localhost:${PORT}/api`);
  console.log(`Health:       http://localhost:${PORT}/health`);
  console.log('');
  console.log('Features:');
  console.log('  ✓ Bills & Legislation');
  console.log('  ✓ Members & Legislators');
  console.log('  ⏳ Votes & Voting Records');
  console.log('  ⏳ Committees & Hearings');
  console.log('  ⏳ Amendments');
  console.log('  ⏳ AI-Powered Intelligence');
  console.log('');
  console.log(`Congress.gov API: ${config.apiKeys.congressGov ? '✓ Connected' : '✗ Not configured'}`);
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('==================================================');
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

export default app;
