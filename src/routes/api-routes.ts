/**
 * API routes
 * 
 * Defines the routes for the application
 */
import { Router } from 'express';
import { FileGeneratorController } from '../controllers/file-generator-controller';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create the router
const router = Router();

// Set up output directory from environment variables or default
const outputDir = process.env.OUTPUT_DIR || path.join(process.cwd(), 'output');

// Create controller instance
const fileGeneratorController = new FileGeneratorController(outputDir);

/**
 * @route POST /api/generate
 * @desc Generate a file based on request parameters
 * @access Public
 */
router.post('/generate', (req, res) => {
  fileGeneratorController.generateFile(req, res).catch((error) => {
    console.error('Unhandled promise rejection in route handler:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: 'An unexpected error occurred'
    });
  });
});

// Export the router
export default router;
