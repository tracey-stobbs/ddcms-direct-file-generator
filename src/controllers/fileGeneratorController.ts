/**
 * Controller for file generation endpoints
 */
import { Request, Response } from 'express';
import { FileGenerationRequest, DEFAULT_FILE_GENERATION_REQUEST } from '../models/FileGenerationRequest';
import { FileService } from '../services/fileService';
import logger from '../utils/logger';

// Initialize the file service
const fileService = new FileService();

/**
 * Controller function to handle file generation requests
 * @param req Express request object
 * @param res Express response object
 */
export const fileGeneratorController = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestTime = new Date();
    logger.info(`File generation request received at ${requestTime.toISOString()}`);
    
    // Merge request with defaults
    const request: FileGenerationRequest = {
      ...DEFAULT_FILE_GENERATION_REQUEST,
      ...(req.body as FileGenerationRequest),
    };
    
    // Validate the request
    if (!isValidRequest(request)) {
      res.status(400).json({ error: 'Invalid request format' });
      return;
    }
    
    // Generate the file
    const result = await fileService.generateFile(request);
    
    // Return the result
    res.status(201).json({
      message: 'File generated successfully',
      fileName: result.fileName,
      filePath: result.filePath,
      fileSize: result.fileSize,
      requestTime: requestTime.toISOString(),
      processingTimeMs: new Date().getTime() - requestTime.getTime()
    });
  } catch (error) {
    logger.error(`Error in controller: ${(error as Error).message}`);
    res.status(500).json({ 
      error: 'Error generating file',
      details: (error as Error).message
    });
  }
};

/**
 * Validate the file generation request
 * @param request The request to validate
 * @returns True if the request is valid, false otherwise
 */
function isValidRequest(request: FileGenerationRequest): boolean {
  // Check if fileType is valid
  const validFileTypes = ['SDDirect', 'Bacs18PaymentLines', 'Bacs18StandardFile'];
  if (!validFileTypes.includes(request.fileType)) {
    logger.error(`Invalid file type: ${request.fileType}`);
    return false;
  }
  
  // Check that numberOfRows is a positive integer if provided
  if (request.numberOfRows !== undefined && 
      (typeof request.numberOfRows !== 'number' || 
       request.numberOfRows <= 0 || 
       !Number.isInteger(request.numberOfRows))) {
    logger.error(`Invalid number of rows: ${request.numberOfRows}`);
    return false;
  }
  
  // Check that boolean fields are actually booleans if provided
  if (request.includeHeaders !== undefined && typeof request.includeHeaders !== 'boolean') {
    logger.error(`Invalid includeHeaders: ${request.includeHeaders}`);
    return false;
  }
  
  if (request.includeOptionalFields !== undefined && typeof request.includeOptionalFields !== 'boolean') {
    logger.error(`Invalid includeOptionalFields: ${request.includeOptionalFields}`);
    return false;
  }
  
  if (request.hasInvalidRows !== undefined && typeof request.hasInvalidRows !== 'boolean') {
    logger.error(`Invalid hasInvalidRows: ${request.hasInvalidRows}`);
    return false;
  }
  
  return true;
}
