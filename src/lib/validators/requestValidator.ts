import { Request } from "../types";
import { DateFormatter } from "../utils/dateFormatter";

export function validateRequest(request: Request): string[] {
  const errors: string[] = [];
  
  // Basic validation
  if (!request.fileType) {
    errors.push("fileType is required");
  } else {
    const validFileTypes = ["SDDirect", "Bacs18PaymentLines", "Bacs18StandardFile", "EaziPay"];
    if (!validFileTypes.includes(request.fileType)) {
      errors.push(`fileType must be one of: ${validFileTypes.join(", ")}`);
    }
  }
  
  if (typeof request.canInlineEdit !== "boolean") {
    errors.push("canInlineEdit must be boolean");
  }
  
  // Validate numberOfRows if provided
  if (request.numberOfRows !== undefined) {
    if (!Number.isInteger(request.numberOfRows) || request.numberOfRows <= 0) {
      errors.push("numberOfRows must be a positive integer");
    }
  }
  
  // EaziPay-specific validation
  if (request.fileType === "EaziPay") {
    // Validate dateFormat if provided
    if (request.dateFormat !== undefined) {
      if (!DateFormatter.validateDateFormat(request.dateFormat)) {
        const validFormats = DateFormatter.getAvailableFormats();
        errors.push(`dateFormat must be one of: ${validFormats.join(", ")}`);
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
    normalizedRequest
  };
}
