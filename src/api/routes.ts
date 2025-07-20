/**
 * API Routes for file generation
 * Implements POST /api/generate endpoint with full request validation
 */
import { Router, Request, Response } from 'express';
import { generateFile, DEFAULT_REQUEST, type FileGenerationRequest } from '../services/fileGenerator';
import { saveFile } from '../services/fileStorage';
import { logger } from '../lib/logger';

const router = Router();

/**
 * Request validation middleware for /api/generate
 */
function validateGenerateRequest(req: Request, res: Response, next: Function): void {
  try {
    const body = req.body || {};
    
    // Validate fileType
    if (body.fileType && !['SDDirect', 'Bacs18PaymentLines', 'Bacs18StandardFile'].includes(body.fileType)) {
      res.status(400).json({
        success: false,
        error: `Invalid fileType. Must be one of: SDDirect, Bacs18PaymentLines, Bacs18StandardFile`
      });
      return;
    }
    
    // Validate numberOfRows
    if (body.numberOfRows !== undefined) {
      if (!Number.isInteger(body.numberOfRows) || body.numberOfRows <= 0 || body.numberOfRows > 10000) {
        res.status(400).json({
          success: false,
          error: 'numberOfRows must be a positive integer between 1 and 10000'
        });
        return;
      }
    }
    
    // Validate boolean fields
    const booleanFields = ['canInlineEdit', 'includeHeaders', 'hasInvalidRows', 'includeOptionalFields'];
    for (const field of booleanFields) {
      if (body[field] !== undefined && typeof body[field] !== 'boolean') {
        res.status(400).json({
          success: false,
          error: `${field} must be a boolean value`
        });
        return;
      }
    }
    
    // Validate outputPath
    if (body.outputPath !== undefined) {
      if (typeof body.outputPath !== 'string' || body.outputPath.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'outputPath must be a non-empty string'
        });
        return;
      }
      
      // Basic path safety check
      if (body.outputPath.includes('..') || /[<>:"|?*]/.test(body.outputPath)) {
        res.status(400).json({
          success: false,
          error: 'outputPath contains invalid characters'
        });
        return;
      }
    }
    
    next();
  } catch (error) {
    logger.error(`Request validation error: ${error}`);
    res.status(400).json({
      success: false,
      error: 'Invalid request format'
    });
  }
}

/**
 * POST /generate - Generate financial data file
 */
router.post('/generate', validateGenerateRequest, async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  let generatedFile: ReturnType<typeof generateFile> | null = null;
  
  try {
    // Merge request with defaults
    const request: Partial<FileGenerationRequest> = {
      ...DEFAULT_REQUEST,
      ...req.body
    };
    
    logger.info(`File generation request: ${JSON.stringify(request)}`);
    
    // Validate specific constraints
    if (request.fileType !== 'SDDirect') {
      res.status(422).json({
        success: false,
        error: 'Only SDDirect file type is currently supported in MVP'
      });
      return;
    }
    
    // Generate file content
    generatedFile = generateFile(request);
    
    // Save file to disk
    const outputPath = request.outputPath || './output';
    const fullPath = await saveFile(outputPath, generatedFile.filename, generatedFile.content);
    
    const duration = Date.now() - startTime;
    
    // Success response
    res.status(200).json({
      success: true,
      filePath: fullPath,
      metadata: {
        ...generatedFile.metadata,
        generationTimeMs: duration,
        fileSize: generatedFile.content.length,
        request: {
          fileType: request.fileType,
          numberOfRows: request.numberOfRows,
          includeHeaders: request.includeHeaders,
          hasInvalidRows: request.hasInvalidRows,
          includeOptionalFields: request.includeOptionalFields,
          canInlineEdit: request.canInlineEdit
        }
      }
    });
    
    logger.info(`File generation completed in ${duration}ms: ${generatedFile.filename}`);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`File generation failed after ${duration}ms: ${error}`);
    
    // Determine error type and response code
    if (error instanceof Error) {
      if (error.message.includes('Unsupported file type')) {
        res.status(422).json({
          success: false,
          error: error.message
        });
      } else if (error.message.includes('Number of rows')) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else if (error.message.includes('Failed to save')) {
        res.status(500).json({
          success: false,
          error: 'File system error: Unable to save generated file'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error during file generation'
        });
      }
    } else {
      res.status(500).json({
        success: false,
        error: 'Unknown error occurred'
      });
    }
  }
});

/**
 * GET /api/info - Get API information
 */
router.get('/info', (req: Request, res: Response): void => {
  res.status(200).json({
    name: 'DDCMS Direct File Creator API',
    version: '1.0.0',
    supportedFileTypes: ['SDDirect'],
    endpoints: {
      generate: 'POST /api/generate',
      health: 'GET /health',
      info: 'GET /api/info'
    },
    defaults: DEFAULT_REQUEST
  });
});

export default router;
