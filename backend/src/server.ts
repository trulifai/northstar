/**
 * Northstar API Server
 * Congressional Intelligence Platform Backend
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import config from './config';
import { createLogger } from './lib/logger';
import { requestIdMiddleware } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';

// Routes
import billsRouter from './routes/bills.cached.route';
import membersRouter from './routes/members.route';
import votesRouter from './routes/votes.cached.route';
import committeesRouter from './routes/committees.cached.route';
import amendmentsRouter from './routes/amendments.route';
import hearingsRouter from './routes/hearings.route';
import statsRouter from './routes/stats.route';
import intelligenceRouter from './routes/intelligence.route';
import financeRouter from './routes/finance.route';
import lobbyingRouter from './routes/lobbying.route';
import districtsRouter from './routes/districts.route';
import regulatoryRouter from './routes/regulatory.route';
import newsRouter from './routes/news.route';
import graphRouter from './routes/graph.route';

const app: Application = express();
const logger = createLogger('server');

// ============================================================================
// Security Middleware
// ============================================================================

app.use(helmet());

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-Id'],
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
// Body Parsing & Request Middleware
// ============================================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestIdMiddleware);

// ============================================================================
// Request Logging Middleware
// ============================================================================

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const cacheStatus = res.getHeader('X-Cache') || 'N/A';
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms cache=${cacheStatus}`, {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
    });
  });

  next();
});

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.env,
    version: process.env.npm_package_version || '0.1.0',
    services: {
      congressGov: config.apiKeys.congressGov ? 'configured' : 'missing',
      gemini: config.apiKeys.gemini ? 'configured' : 'missing',
      redis: config.redis ? 'configured' : 'not configured',
      cache: config.cache.enabled ? 'enabled' : 'disabled',
    },
  });
});

// ============================================================================
// API Routes
// ============================================================================

app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'Northstar Congressional Intelligence API',
    version: '1.0.0',
    description: 'Unified government data engine for legislative intelligence',
    status: 'operational',
    endpoints: {
      bills: { base: '/api/bills', description: 'Bills & legislation' },
      members: { base: '/api/members', description: 'Members of Congress' },
      votes: { base: '/api/votes', description: 'Roll-call votes' },
      committees: { base: '/api/committees', description: 'Congressional committees' },
      amendments: { base: '/api/amendments', description: 'Bill amendments' },
      hearings: { base: '/api/hearings', description: 'Congressional hearings' },
      stats: { base: '/api/stats', description: 'Platform statistics' },
      intelligence: { base: '/api/intelligence', description: 'AI-powered bill analysis' },
      finance: { base: '/api/finance', description: 'Campaign finance data (FEC)' },
      lobbying: { base: '/api/lobbying', description: 'Lobbying disclosures (LDA)' },
      districts: { base: '/api/districts', description: 'Congressional district data' },
      regulatory: { base: '/api/regulatory', description: 'Executive orders & regulatory rules' },
      news: { base: '/api/news', description: 'Aggregated political news (RSS)' },
      graph: { base: '/api/graph', description: 'Knowledge graph & relationship engine' },
    },
    features: {
      working: [
        'Bills & Legislation',
        'Members & Legislators',
        'Votes & Voting Records',
        'Committees',
        'Amendments',
        'Hearings',
        'Platform Stats',
        'Response Caching',
        'Structured Logging',
        'Full-Text Search (PostgreSQL tsvector)',
        'AI Bill Summarization (Gemini)',
        'Passage Prediction',
        'Bipartisan Scoring',
        'Campaign Finance (FEC)',
        'Lobbying Intelligence (LDA)',
        'District Demographics & Impact',
        'Executive Order Tracking',
        'Regulatory Rule Monitoring',
        'News Aggregation (RSS)',
        'Knowledge Graph & Pathfinding',
      ],
      planned: [
        'Semantic Search (Embeddings/pgvector)',
        'Financial Disclosures & Stock Trading',
        'Interactive Graph Visualization',
        'Bill Text Version Comparison',
      ],
    },
  });
});

// Mount route handlers
app.use('/api/bills', billsRouter);
app.use('/api/members', membersRouter);
app.use('/api/votes', votesRouter);
app.use('/api/committees', committeesRouter);
app.use('/api/amendments', amendmentsRouter);
app.use('/api/hearings', hearingsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/intelligence', intelligenceRouter);
app.use('/api/finance', financeRouter);
app.use('/api/lobbying', lobbyingRouter);
app.use('/api/districts', districtsRouter);
app.use('/api/regulatory', regulatoryRouter);
app.use('/api/news', newsRouter);
app.use('/api/graph', graphRouter);

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} does not exist`,
    },
  });
});

// Global error handler
app.use(errorHandler);

// ============================================================================
// Server Startup
// ============================================================================

const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`Northstar server started on port ${PORT}`, {
    environment: config.env,
    port: PORT,
    congressGov: !!config.apiKeys.congressGov,
    gemini: !!config.apiKeys.gemini,
    redis: !!config.redis,
    cacheEnabled: config.cache.enabled,
  });

  console.log('');
  console.log('==================================================');
  console.log('  Northstar Congressional Intelligence Platform');
  console.log('==================================================');
  console.log('');
  console.log(`  Environment:  ${config.env}`);
  console.log(`  Server:       http://localhost:${PORT}`);
  console.log(`  API:          http://localhost:${PORT}/api`);
  console.log(`  Health:       http://localhost:${PORT}/health`);
  console.log(`  Stats:        http://localhost:${PORT}/api/stats`);
  console.log('');
  console.log(`  Congress.gov: ${config.apiKeys.congressGov ? 'Connected' : 'Not configured'}`);
  console.log(`  Gemini AI:    ${config.apiKeys.gemini ? 'Connected' : 'Not configured'}`);
  console.log(`  Cache:        ${config.cache.enabled ? 'Enabled' : 'Disabled'}`);
  console.log('');
  console.log('==================================================');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

export default app;
