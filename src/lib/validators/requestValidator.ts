import { FileTypeLiteral, McpGenerateRequest, Request } from '../types';
import { DateFormatter } from '../utils/dateFormatter';

export function validateRequest(request: Request): string[] {
  const errors: string[] = [];

  // Basic validation
  if (!request.fileType) {
    errors.push('fileType is required');
  } else {
    const validFileTypes = ['SDDirect', 'Bacs18PaymentLines', 'Bacs18StandardFile', 'EaziPay'];
    if (!validFileTypes.includes(request.fileType)) {
      errors.push(`fileType must be one of: ${validFileTypes.join(', ')}`);
    }
  }

  if (typeof request.canInlineEdit !== 'boolean') {
    errors.push('canInlineEdit must be boolean');
  }

  // Validate numberOfRows if provided
  if (request.numberOfRows !== undefined) {
    if (!Number.isInteger(request.numberOfRows) || request.numberOfRows <= 0) {
      errors.push('numberOfRows must be a positive integer');
    }
  }

  // EaziPay-specific validation
  if (request.fileType === 'EaziPay') {
    // Validate dateFormat if provided
    if (request.dateFormat !== undefined) {
      if (!DateFormatter.validateDateFormat(request.dateFormat)) {
        const validFormats = DateFormatter.getAvailableFormats();
        errors.push(`dateFormat must be one of: ${validFormats.join(', ')}`);
      }
    }
  }

  return errors;
}

/**
 * Validate and normalize header support based on file type
 * Silently overrides includeHeaders for file types that don't support headers
 * @param request - The request to validate and normalize
 * @returns Normalized request with correct header settings
 */
export function validateAndNormalizeHeaders(request: Request): Request {
  const headerSupportedTypes = ['SDDirect', 'Bacs18StandardFile'];

  if (!headerSupportedTypes.includes(request.fileType) && request.includeHeaders) {
    // Silently override to false for EaziPay and Bacs18PaymentLines
    return { ...request, includeHeaders: false };
  }

  return request;
}

/**
 * Comprehensive request validation and normalization
 * @param request - The request to validate
 * @returns Object with validation result and normalized request
 */
export function validateAndNormalizeRequest(request: Request): {
  isValid: boolean;
  errors: string[];
  normalizedRequest: Request;
} {
  const errors = validateRequest(request);
  const normalizedRequest = validateAndNormalizeHeaders(request);

  return {
    isValid: errors.length === 0,
    errors,
    normalizedRequest,
  };
}

/**
 * MCP: Validate and normalize the new generate request based on endpoint file type
 */
export function validateAndNormalizeMcpRequest(
  fileType: FileTypeLiteral,
  body: McpGenerateRequest
): {
  isValid: boolean;
  errors: string[];
  normalized: Request;
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Defaults and coercions
  const canInlineEdit = body.forInlineEditing !== undefined ? Boolean(body.forInlineEditing) : true;
  const includeHeaders = body.includeHeaders === true;
  const hasInvalidRows = body.hasInvalidRows === true;
  const numberOfRows = body.numberOfRows !== undefined ? body.numberOfRows : 15;

  if (!Number.isInteger(numberOfRows) || numberOfRows <= 0) {
    errors.push('numberOfRows must be a positive integer');
  }

  // Include headers support: only for SDDirect and Bacs18StandardFile
  const headerSupportedTypes: FileTypeLiteral[] = ['SDDirect', 'Bacs18StandardFile'];
  let includeHeadersEffective = includeHeaders;
  if (!headerSupportedTypes.includes(fileType) && includeHeaders) {
    includeHeadersEffective = false;
    warnings.push('includeHeaders is ignored for this file type');
  }

  // Build legacy Request shape for generators
  const normalized: Request = {
    fileType,
    canInlineEdit: canInlineEdit,
    includeHeaders: includeHeadersEffective,
    hasInvalidRows,
    numberOfRows,
    outputPath: body.outputPath,
    dateFormat: body.dateFormat,
    // Preserve existing defaultValues usage; SUN stub applied by route if needed
    defaultValues: {
      originatingAccountDetails: {
        canBeInvalid: true,
      },
    },
  } as Request;

  return { isValid: errors.length === 0, errors, normalized, warnings };
}
