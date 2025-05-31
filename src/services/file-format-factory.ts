/**
 * File format factory
 */
import { FileFormatStrategy } from '../types/interfaces';
import { SDDirectFileFormat } from './file-formats/sd-direct-format';

/**
 * Factory for creating file format strategy based on file type
 */
export class FileFormatFactory {
  /**
   * Get file format strategy for the specified file type
   * 
   * @param fileType - Type of file format to create
   * @returns Instance of file format strategy
   * @throws Error if unsupported file type is requested
   */
  static getFileFormat(fileType: string): FileFormatStrategy {
    switch (fileType) {
      case 'SDDirect':
        return new SDDirectFileFormat();
      
      case 'Bacs18PaymentLines':
      case 'Bacs18StandardFile':
        throw new Error(`File type ${fileType} is not yet implemented`);
      
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }
}
