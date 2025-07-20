import express from 'express';
import { Server } from 'http';
import { config } from './lib/config';
import { logger } from './lib/logger';
import apiRoutes from './api/routes';
import { 
  requestLogger, 
  errorHandler, 
  notFoundHandler, 
  securityHeaders, 
  corsHeaders,
  requestSizeLimit,
  rateLimit 
} from './api/middleware';

const app = express();

// Apply middleware in correct order
app.use(securityHeaders);
app.use(corsHeaders);
app.use(requestSizeLimit);
app.use(rateLimit);
app.use(express.json({ limit: '10kb' }));
app.use(requestLogger);

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
app.use('/api', apiRoutes);

// Global error handler
app.use(errorHandler);

// 404 handler
app.use(notFoundHandler);

// Start server only if not in test environment
let server: Server | null = null;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(config.port, () => {
    logger.info(`DDCMS Direct File Creator started on port ${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`Output directory: ${config.outputPath}`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

export default app;
