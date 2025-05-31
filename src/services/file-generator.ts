/**
 * File generator service
 * 
 * Handles the generation of test files with random data
 */
import fs from 'fs/promises';
import path from 'path';
import { FileGeneratorService, GenerateFileRequest, FieldValidationRule } from '../types/interfaces';
import { FileFormatFactory } from './file-format-factory';
import { DEFAULT_VALUES } from '../utils/constants';

/**
 * Service responsible for generating files based on provided request
 */
export class FileGenerator implements FileGeneratorService {
  private outputDir: string;

  /**
   * Constructor for FileGenerator
   * 
   * @param outputDir - Directory where generated files will be saved
   */
  constructor(outputDir: string) {
    this.outputDir = outputDir;
  }

  /**
   * Generate a file according to the specified request
   * 
   * @param request - File generation request parameters
   * @returns Promise resolving to the path of the generated file
   */
  async generateFile(request: GenerateFileRequest): Promise<string> {
    // Apply default values for any missing parameters
    const fileType = request.fileType ?? DEFAULT_VALUES.FILE_TYPE;
    const includeHeaders = request.includeHeaders ?? DEFAULT_VALUES.INCLUDE_HEADERS;
    const includeOptionalFields = request.includeOptionalFields ?? DEFAULT_VALUES.INCLUDE_OPTIONAL_FIELDS;
    const numberOfRows = request.numberOfRows ?? DEFAULT_VALUES.NUMBER_OF_ROWS;
    const hasInvalidRows = request.hasInvalidRows ?? DEFAULT_VALUES.HAS_INVALID_ROWS;
    
    // Get the appropriate file format strategy
    const fileFormat = FileFormatFactory.getFileFormat(fileType);
    
    // Prepare the content
    const lines: string[] = [];
    
    // Add headers if requested
    if (includeHeaders) {
      const headers = fileFormat.getHeaders();
      const headerRow = includeOptionalFields
        ? headers.join(',')
        : headers.slice(0, fileFormat.getRequiredFields().length).join(',');
      
      lines.push(headerRow);
    }
    
    // Get the fields we'll be generating
    const requiredFields = fileFormat.getRequiredFields();
    const fields = includeOptionalFields
      ? [...requiredFields, ...fileFormat.getOptionalFields()]
      : requiredFields;
    
    // Generate the requested number of rows
    for (let i = 0; i < numberOfRows; i++) {
      // Determine if this row should have invalid data
      const shouldBeInvalid = hasInvalidRows && Math.random() < 0.5;
      
      if (shouldBeInvalid) {
        // Generate row with 1-3 invalid fields
        lines.push(this.generateInvalidRow(fields));
      } else {
        // Generate valid row
        lines.push(this.generateValidRow(fields));
      }
    }
    
    // Join all lines with newlines to create file content
    const content = lines.join('\n');
    
    // Create filename based on specs
    const timestamp = this.getTimestamp();
    const columnCount = includeOptionalFields ? '11' : '06'; // For SDDirect specifically
    const headersFlag = includeHeaders ? 'H_' : 'NH';
    const validityFlag = hasInvalidRows ? 'I' : 'V';
    
    const filename = `${fileFormat.getFilePrefix()}_${columnCount}_${headersFlag}${validityFlag}_${timestamp}.csv`;
    
    // Ensure output directory exists
    await fs.mkdir(this.outputDir, { recursive: true });
    
    // Write file
    const filePath = path.join(this.outputDir, filename);
    await fs.writeFile(filePath, content);
    
    return filePath;
  }

  /**
   * Generate a valid row with random field values
   * 
   * @param fields - Field validation rules to use for generation
   * @returns Comma-separated string of field values
   */
  private generateValidRow(fields: FieldValidationRule[]): string {
    // Generate values for all fields
    const values = fields.map(field => field.generate());
    
    // Special case: If we have both Amount and Transaction code,
    // ensure they are consistent (zero amount for certain codes)
    const transactionCodeIndex = fields.findIndex(f => f.name === 'Transaction code');
    const amountIndex = fields.findIndex(f => f.name === 'Amount');
    
    if (transactionCodeIndex >= 0 && amountIndex >= 0) {
      const transactionCode = values[transactionCodeIndex];
      const amount = values[amountIndex];
      
      // If this is a zero-amount transaction code but amount is not zero,
      // we need to regenerate the amount
      if (['0C', '0N', '0S'].includes(transactionCode) && amount !== '0.00') {
        values[amountIndex] = '0.00';
      }
    }
    
    return values.join(',');
  }

  /**
   * Generate an invalid row with 1-3 invalid field values
   * 
   * @param fields - Field validation rules to use for generation
   * @returns Comma-separated string of field values with some invalid ones
   */
  private generateInvalidRow(fields: FieldValidationRule[]): string {
    // First generate all valid values
    const values = fields.map(field => field.generate());
    
    // Randomly select 1-3 fields to invalidate
    const invalidCount = Math.floor(Math.random() * 3) + 1;
    const fieldIndices = Array.from({ length: fields.length }, (_, i) => i);
    
    // Shuffle the indices
    for (let i = fieldIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fieldIndices[i], fieldIndices[j]] = [fieldIndices[j], fieldIndices[i]];
    }
    
    // Take the first N indices and invalidate those fields
    for (let i = 0; i < invalidCount; i++) {
      const index = fieldIndices[i];
      values[index] = fields[index].generateInvalid();
    }
    
    return values.join(',');
  }

  /**
   * Get current timestamp in format YYYYMMDD_HHMMSS
   * 
   * @returns Formatted timestamp
   */
  private getTimestamp(): string {
    const now = new Date();
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  }
}
