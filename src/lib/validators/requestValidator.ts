import { EaziPayDateFormat, GenerateRequest, RowPreviewRequest } from '../types';
import { DateFormatter } from '../utils/dateFormatter';

function validateCommon(request: {
    numberOfRows?: number;
    forInlineEditing?: boolean;
    dateFormat?: EaziPayDateFormat;
}): string[] {
    const errors: string[] = [];
    if (request.forInlineEditing !== undefined && typeof request.forInlineEditing !== 'boolean') {
        errors.push('forInlineEditing must be boolean');
    }
    if (request.numberOfRows !== undefined) {
        if (!Number.isInteger(request.numberOfRows) || request.numberOfRows <= 0) {
            errors.push('numberOfRows must be a positive integer');
        }
    }
    if (request.dateFormat !== undefined) {
        if (!DateFormatter.validateDateFormat(request.dateFormat)) {
            const validFormats = DateFormatter.getAvailableFormats();
            errors.push(`dateFormat must be one of: ${validFormats.join(', ')}`);
        }
    }
    return errors;
}

export function validateGenerateRequest(request: GenerateRequest): string[] {
    const errors = validateCommon(request);
    // No additional rules currently beyond header normalization handled separately
    return errors;
}

export function validateRowPreviewRequest(request: RowPreviewRequest): string[] {
    return validateCommon(request);
}

/**
 * Validate and normalize header support based on file type
 * Silently overrides includeHeaders for file types that don't support headers
 * @param request - The request to validate and normalize
 * @returns Normalized request with correct header settings
 */
export function validateAndNormalizeHeaders<T extends GenerateRequest>(
    fileType: string,
    request: T,
): T {
    const headerSupportedTypes = ['SDDirect', 'Bacs18StandardFile'];
    if (!headerSupportedTypes.includes(fileType) && request.includeHeaders) {
        // Silently override to false for EaziPay and Bacs18PaymentLines
        return { ...request, includeHeaders: false } as T;
    }
    return request;
}

/**
 * Comprehensive request validation and normalization
 * @param request - The request to validate
 * @returns Object with validation result and normalized request
 */
export function validateAndNormalizeGenerateRequest(
    fileType: string,
    request: GenerateRequest,
): {
    isValid: boolean;
    errors: string[];
    normalizedRequest: GenerateRequest;
} {
    const errors = validateGenerateRequest(request);
    const normalizedRequest = validateAndNormalizeHeaders(fileType, request);
    return { isValid: errors.length === 0, errors, normalizedRequest };
}
