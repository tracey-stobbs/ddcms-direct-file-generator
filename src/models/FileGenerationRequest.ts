/**
 * Request interface for the file generation API
 */
export interface FileGenerationRequest {
  fileType: 'SDDirect' | 'Bacs18PaymentLines' | 'Bacs18StandardFile';
  includeHeaders?: boolean;
  includeOptionalFields?: boolean;
  numberOfRows?: number;
  hasInvalidRows?: boolean;
}

/**
 * Default values for file generation request when not provided
 */
export const DEFAULT_FILE_GENERATION_REQUEST: FileGenerationRequest = {
  fileType: 'SDDirect',
  includeHeaders: true,
  includeOptionalFields: false,
  numberOfRows: 100,
  hasInvalidRows: false
};
