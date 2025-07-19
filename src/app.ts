import express from 'express';
import { config } from './lib/config';
import { logger } from './lib/logger';

const app = express();

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS middleware for development
if (config.devEnableCors && config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
}

// Request logging middleware for development
if (config.devLogRequests && config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
      body: req.body,
      query: req.query,
      params: req.params
    });
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    version: '1.0.0'
  });
});

// Basic API routes placeholder
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not implemented yet'
  });
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  
  res.status(500).json({
    success: false,
    error: config.nodeEnv === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server
const server = app.listen(config.port, () => {
  logger.info(`DDCMS Direct File Creator started on port ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`Output directory: ${config.outputPath}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;
