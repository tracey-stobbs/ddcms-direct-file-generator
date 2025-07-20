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
    
    // If body has properties but no fileType, that's an error
    if (Object.keys(body).length > 0 && !body.fileType) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: 'fileType is required when other fields are provided'
      });
      return;
    }
    
    // Validate fileType only if provided (empty body uses defaults)
    if (body.fileType && !['SDDirect', 'Bacs18PaymentLines', 'Bacs18StandardFile'].includes(body.fileType)) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: 'fileType must be one of: SDDirect, Bacs18PaymentLines, Bacs18StandardFile'
      });
      return;
    }
    
    // Validate numberOfRows
    if (body.numberOfRows !== undefined) {
      if (!Number.isInteger(body.numberOfRows) || body.numberOfRows <= 0) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: 'numberOfRows must be at least 1'
        });
        return;
      }
      if (body.numberOfRows > 100000) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: 'numberOfRows must be at most 100000'
        });
        return;
      }
    }
    
    // Validate boolean fields
    const booleanFields = ['canInlineEdit', 'includeHeaders', 'hasInvalidRows'];
    for (const field of booleanFields) {
      if (body[field] !== undefined && typeof body[field] !== 'boolean') {
        res.status(400).json({
          success: false,
          error: `${field} must be a boolean value`
        });
        return;
      }
    }
    
    // Validate includeOptionalFields (boolean or array)
    if (body.includeOptionalFields !== undefined) {
      const isValidBoolean = typeof body.includeOptionalFields === 'boolean';
      const isValidArray = Array.isArray(body.includeOptionalFields) && 
        body.includeOptionalFields.every((item: unknown) => 
          typeof item === 'string' && 
          ['realtimeInformationChecksum', 'payDate', 'originatingAccountDetails'].includes(item)
        );
      
      if (!isValidBoolean && !isValidArray) {
        res.status(400).json({
          success: false,
          error: 'includeOptionalFields must be a boolean or an array of valid field names (realtimeInformationChecksum, payDate, originatingAccountDetails)'
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
        error: 'File generation failed',
        details: 'Only SDDirect file type is currently supported in MVP'
      });
      return;
    }
    
    // Generate file content
    generatedFile = generateFile(request);
    
    // Save file to disk
    const outputPath = request.outputPath || './output';
    await saveFile(outputPath, generatedFile.filename, generatedFile.content);
    
    const duration = Date.now() - startTime;
    
    // Success response
    res.status(200).json({
      success: true,
      message: 'File generated successfully',
      data: {
        filename: generatedFile.filename,
        content: generatedFile.content,
        metadata: {
          recordCount: generatedFile.metadata.recordCount,
          validRecords: generatedFile.metadata.validRecords,
          invalidRecords: generatedFile.metadata.invalidRecords,
          columnCount: generatedFile.metadata.columnCount,
          hasHeaders: generatedFile.metadata.hasHeaders
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
          error: 'File generation failed',
          message: 'Invalid payment data'
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
    name: 'Banking File Generation API',
    version: '1.0.0',
    status: 'operational',
    supportedFormats: ['SDDirect', 'Bacs18PaymentLines', 'Bacs18StandardFile'],
    endpoints: {
      generate: 'POST /api/generate',
      health: 'GET /health',
      info: 'GET /api/info'
    },
    defaults: DEFAULT_REQUEST
  });
});

export default router;
