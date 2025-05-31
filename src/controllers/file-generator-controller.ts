/**
 * File generator controller
 * 
 * Handles HTTP requests for file generation
 */
import { Request, Response } from 'express';
import { FileGenerator } from '../services/file-generator';
import { GenerateFileRequest } from '../types/interfaces';
import { logger } from '../utils/logger';
import path from 'path';

/**
 * Controller for handling file generation requests
 */
export class FileGeneratorController {
  private fileGenerator: FileGenerator;
  
  /**
   * Constructor for FileGeneratorController
   * 
   * @param outputDir - Directory where generated files will be saved
   */
  constructor(outputDir: string) {
    this.fileGenerator = new FileGenerator(outputDir);
  }
  
  /**
   * Generate a file based on request parameters
   * 
   * @param req - Express request object
   * @param res - Express response object
   */
  async generateFile(req: Request, res: Response): Promise<void> {
    try {
      const request = req.body as GenerateFileRequest;
      logger.info(`Received file generation request: ${JSON.stringify(request)}`);
      
      const filePath = await this.fileGenerator.generateFile(request);
      
      logger.info(`File generated successfully: ${filePath}`);
      res.status(200).json({
        message: 'File generated successfully',
        fileName: path.basename(filePath),
        filePath
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error generating file: ${errorMessage}`);
      
      res.status(500).json({
        message: 'Error generating file',
        error: errorMessage
      });
    }
  }
}
