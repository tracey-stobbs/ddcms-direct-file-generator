/**
 * Main application entry point
 */
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';
import apiRoutes from './routes/api-routes';
import path from 'path';
import fs from 'fs';
import { logger, morganStream } from './utils/logger';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Set up middleware
app.use(helmet()); // Security headers
app.use(cors());   // Enable CORS
app.use(express.json()); // Parse JSON request bodies
app.use(morgan('combined', { stream: morganStream })); // Request logging

// API routes
app.use('/api', apiRoutes);

// Health check route
app.get('/health', (_, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root route
app.get('/', (_, res) => {
  res.status(200).json({
    message: 'DDCMS Direct File Builder API',
    docs: '/api-docs',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Serve static files
app.use(express.static(path.join(process.cwd(), 'public')));

// UI route for testing
app.get('/ui', (_, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// Create output directory if it doesn't exist
const outputDir = process.env.OUTPUT_DIR || path.join(process.cwd(), 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  logger.info(`Created output directory: ${outputDir}`);
}

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  logger.info(`Created logs directory: ${logsDir}`);
}

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Output directory set to: ${outputDir}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1); // Exit with failure
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

export default app;
