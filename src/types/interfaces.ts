/**
 * API request interface
 */
export interface GenerateFileRequest {
  fileType: "SDDirect" | "Bacs18PaymentLines" | "Bacs18StandardFile";
  includeHeaders?: boolean;
  includeOptionalFields?: boolean;
  numberOfRows?: number;
  hasInvalidRows?: boolean;
}

/**
 * Interface for field validation rules
 */
export interface FieldValidationRule {
  name: string;
  validate: (value: string) => boolean;
  generate: () => string;
  generateInvalid: () => string;
}

/**
 * Interface for file format strategy
 */
export interface FileFormatStrategy {
  getHeaders(): string[];
  getRequiredFields(): FieldValidationRule[];
  getOptionalFields(): FieldValidationRule[];
  getFilePrefix(): string;
}

/**
 * Interface for file generator service
 */
export interface FileGeneratorService {
  generateFile(request: GenerateFileRequest): Promise<string>;
}
