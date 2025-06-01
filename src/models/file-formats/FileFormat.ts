/**
 * Interface for file format definitions
 */
export interface FileFormat {
  fileType: string;
  fileExtension: string;
  requiredFields: string[];
  optionalFields: string[];
  requiredHeaders: string;
  fullHeaders: string;
  generateData: (request: {
    includeHeaders: boolean;
    includeOptionalFields: boolean;
    numberOfRows: number;
    hasInvalidRows: boolean;
  }) => string;
  generateFileName: (
    includeOptionalFields: boolean,
    includeHeaders: boolean,
    hasInvalidRows: boolean
  ) => string;
}
