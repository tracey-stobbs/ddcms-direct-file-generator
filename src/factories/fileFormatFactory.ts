/**
 * Factory for creating file format instances
 */
import { FileFormat } from '../models/file-formats/FileFormat';
import { SDDirectFileFormat } from '../models/file-formats/SDDirectFileFormat';
import { Bacs18PaymentLinesFileFormat } from '../models/file-formats/Bacs18PaymentLinesFileFormat';
import { Bacs18StandardFileFormat } from '../models/file-formats/Bacs18StandardFileFormat';

/**
 * Get the appropriate file format based on the fileType
 * @param fileType The type of file to generate
 * @returns The file format implementation
 */
export function getFileFormat(fileType: string): FileFormat {
  switch (fileType) {
    case 'SDDirect':
      return SDDirectFileFormat;
    case 'Bacs18PaymentLines':
      return Bacs18PaymentLinesFileFormat;
    case 'Bacs18StandardFile':
      return Bacs18StandardFileFormat;
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}
