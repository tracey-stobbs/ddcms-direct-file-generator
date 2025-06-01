/**
 * Service responsible for file operations
 */
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { FileGenerationRequest } from '../models/FileGenerationRequest';
import { getFileFormat } from '../factories/fileFormatFactory';
import logger from '../utils/logger';

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

/**
 * Class for handling file operations
 */
export class FileService {
  private outputDir: string;
  
  /**
   * Constructor for the FileService
   * @param outputDir The directory where generated files will be saved
   */
  constructor(outputDir: string = path.join(process.cwd(), 'output')) {
    this.outputDir = outputDir;
  }
  
  /**
   * Generate a file based on the request
   * @param request The file generation request
   * @returns Information about the generated file
   */
  public async generateFile(request: FileGenerationRequest): Promise<{ 
    filePath: string; 
    fileName: string; 
    fileSize: number;
  }> {
    try {
      // Ensure output directory exists
      await this.ensureDirectoryExists();
      
      // Get the file format
      const fileFormat = getFileFormat(request.fileType);
      
      // Set default values for missing parameters
      const includeHeaders = request.includeHeaders ?? true;
      const includeOptionalFields = request.includeOptionalFields ?? false;
      const numberOfRows = request.numberOfRows ?? 100;
      const hasInvalidRows = request.hasInvalidRows ?? false;
      
      // Generate the file content
      const content = fileFormat.generateData({
        includeHeaders,
        includeOptionalFields,
        numberOfRows,
        hasInvalidRows
      });
      
      // Generate the file name
      const fileName = fileFormat.generateFileName(
        includeOptionalFields,
        includeHeaders,
        hasInvalidRows
      );
      
      // Full path to the file
      const filePath = path.join(this.outputDir, fileName);
      
      // Write the file
      await writeFileAsync(filePath, content);
      
      // Get the file size
      const stats = fs.statSync(filePath);
      
      logger.info(`File generated: ${filePath}`);
      
      return {
        filePath,
        fileName,
        fileSize: stats.size
      };
    } catch (error) {
      logger.error(`Error generating file: ${(error as Error).message}`);
      throw new Error(`Error generating file: ${(error as Error).message}`);
    }
  }
  
  /**
   * Ensure the output directory exists
   */
  private async ensureDirectoryExists(): Promise<void> {
    try {
      await mkdirAsync(this.outputDir, { recursive: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
      // Directory already exists, no action needed
    }
  }
}
