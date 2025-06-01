/**
 * Factory for creating file format instances
 */
import { FileFormat } from "../models/file-formats/FileFormat";
import { SDDirectFileFormat } from "../models/file-formats/SDDirectFileFormat";

/**
 * Get the appropriate file format based on the fileType
 * @param fileType The type of file to generate
 * @returns The file format implementation
 */
export function getFileFormat(fileType: string) {
  switch (fileType) {
    case "SDDirect":
      return SDDirectFileFormat;
    case "Bacs18PaymentLines":
    case "Bacs18StandardFile":
      throw new Error(`File type ${fileType} is not yet implemented`);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}
