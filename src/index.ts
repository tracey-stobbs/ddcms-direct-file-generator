/**
 * DDCMS Direct File Builder
 * Entry point for the application
 */
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { fileGeneratorController } from './controllers/fileGeneratorController';
import { setupLogger } from './utils/logger';

// Initialize logger
const logger = setupLogger();

// Create Express application
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(morgan('combined')); // HTTP request logging

// Routes
app.post('/api/generate', fileGeneratorController);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(`Error: ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export default app;
