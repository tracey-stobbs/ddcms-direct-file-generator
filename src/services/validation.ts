/**
 * Validation Service
 * 
 * Implements a flexible validation system using the Factory pattern
 * to support multiple file formats with comprehensive error reporting.
 */

import { z } from 'zod';
import { logger } from '../lib/logger.js';
import type { 
  ValidationResult, 
  ValidationError, 
  FieldValidationRule,
  SDDirectRecord,
  SDDirectFile
} from '../types/sddirect.js';
import { 
  SDDirectRecordSchema, 
  SDDirectFileSchema,
  SDDIRECT_VALIDATION_RULES 
} from '../types/sddirect.js';

// Abstract base class for validators (Strategy pattern)
export abstract class FileFormatValidator {
  protected formatName: string;
  protected rules: FieldValidationRule[];

  constructor(formatName: string, rules: FieldValidationRule[]) {
    this.formatName = formatName;
    this.rules = rules;
  }

  abstract validateRecord(data: unknown): ValidationResult;
  abstract validateFile(data: unknown): ValidationResult;
  
  /**
   * Get validation rules for this format
   */
  getValidationRules(): FieldValidationRule[] {
    return [...this.rules];
  }

  /**
   * Get format name
   */
  getFormatName(): string {
    return this.formatName;
  }

  /**
   * Convert Zod errors to our ValidationError format
   */
  protected convertZodErrors(zodError: z.ZodError): ValidationError[] {
    return zodError.errors.map(error => ({
      field: error.path.join('.'),
      message: error.message,
      code: error.code,
      value: undefined, // Zod doesn't provide input value in all error types
      path: error.path.map(String)
    }));
  }

  /**
   * Create a successful validation result
   */
  protected createSuccessResult(data: unknown): ValidationResult {
    return {
      success: true,
      errors: [],
      data: data as SDDirectRecord | SDDirectFile
    };
  }

  /**
   * Create a failed validation result
   */
  protected createErrorResult(errors: ValidationError[]): ValidationResult {
    return {
      success: false,
      errors
    };
  }
}

// SDDirect format validator implementation
export class SDDirectValidator extends FileFormatValidator {
  constructor() {
    super('SDDirect', SDDIRECT_VALIDATION_RULES);
  }

  /**
   * Validate a single SDDirect record
   */
  validateRecord(data: unknown): ValidationResult {
    try {
      logger.debug('Validating SDDirect record', { data });
      
      const validatedData = SDDirectRecordSchema.parse(data);
      
      logger.debug('SDDirect record validation successful');
      return this.createSuccessResult(validatedData);
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = this.convertZodErrors(error);
        logger.warn('SDDirect record validation failed', { 
          errors: validationErrors,
          data 
        });
        return this.createErrorResult(validationErrors);
      }
      
      logger.error('Unexpected error during SDDirect record validation', error);
      return this.createErrorResult([{
        field: 'unknown',
        message: 'Unexpected validation error occurred',
        code: 'VALIDATION_ERROR',
        value: data
      }]);
    }
  }

  /**
   * Validate a complete SDDirect file
   */
  validateFile(data: unknown): ValidationResult {
    try {
      const dataObj = data as Record<string, unknown>;
      const recordCount = Array.isArray(dataObj?.records) ? dataObj.records.length : 'unknown';
      
      logger.debug('Validating SDDirect file', { recordCount });
      
      const validatedData = SDDirectFileSchema.parse(data);
      
      // Additional business rule validations
      const businessRuleErrors = this.validateBusinessRules(validatedData);
      if (businessRuleErrors.length > 0) {
        logger.warn('SDDirect file business rule validation failed', { 
          errors: businessRuleErrors 
        });
        return this.createErrorResult(businessRuleErrors);
      }
      
      logger.debug('SDDirect file validation successful', {
        recordCount: validatedData.records.length,
        totalValue: validatedData.metadata.totalValue
      });
      
      return this.createSuccessResult(validatedData);
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = this.convertZodErrors(error);
        logger.warn('SDDirect file validation failed', { 
          errors: validationErrors 
        });
        return this.createErrorResult(validationErrors);
      }
      
      logger.error('Unexpected error during SDDirect file validation', error);
      return this.createErrorResult([{
        field: 'unknown',
        message: 'Unexpected validation error occurred',
        code: 'VALIDATION_ERROR',
        value: data
      }]);
    }
  }

  /**
   * Validate business rules beyond schema validation
   */
  private validateBusinessRules(file: SDDirectFile): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check metadata consistency
    const actualRecordCount = file.records.length;
    if (file.metadata.recordCount !== actualRecordCount) {
      errors.push({
        field: 'metadata.recordCount',
        message: `Record count mismatch: metadata says ${file.metadata.recordCount}, actual count is ${actualRecordCount}`,
        code: 'RECORD_COUNT_MISMATCH',
        value: file.metadata.recordCount
      });
    }

    // Check total value consistency
    const actualTotalValue = file.records.reduce((sum, record) => sum + record.collectionAmount, 0);
    if (file.metadata.totalValue !== actualTotalValue) {
      errors.push({
        field: 'metadata.totalValue',
        message: `Total value mismatch: metadata says ${file.metadata.totalValue}, actual total is ${actualTotalValue}`,
        code: 'TOTAL_VALUE_MISMATCH',
        value: file.metadata.totalValue
      });
    }

    // Check for duplicate transaction IDs
    const transactionIds = file.records.map(record => record.transactionId);
    const duplicateIds = transactionIds.filter((id, index) => transactionIds.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      const uniqueDuplicates = [...new Set(duplicateIds)];
      errors.push({
        field: 'records.transactionId',
        message: `Duplicate transaction IDs found: ${uniqueDuplicates.join(', ')}`,
        code: 'DUPLICATE_TRANSACTION_IDS',
        value: uniqueDuplicates
      });
    }

    return errors;
  }
}

// Validator factory (Factory pattern)
export class ValidatorFactory {
  private static validators = new Map<string, () => FileFormatValidator>();

  /**
   * Register a validator for a file format
   */
  static register(formatName: string, validatorFactory: () => FileFormatValidator): void {
    logger.debug('Registering validator', { formatName });
    this.validators.set(formatName.toLowerCase(), validatorFactory);
  }

  /**
   * Create a validator for the specified format
   */
  static create(formatName: string): FileFormatValidator {
    const factory = this.validators.get(formatName.toLowerCase());
    if (!factory) {
      throw new Error(`No validator registered for format: ${formatName}`);
    }
    
    logger.debug('Creating validator', { formatName });
    return factory();
  }

  /**
   * Get list of supported formats
   */
  static getSupportedFormats(): string[] {
    return Array.from(this.validators.keys());
  }

  /**
   * Check if a format is supported
   */
  static isFormatSupported(formatName: string): boolean {
    return this.validators.has(formatName.toLowerCase());
  }
}

// Main validation service
export class ValidationService {
  private static instance: ValidationService;

  private constructor() {
    this.initializeValidators();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  /**
   * Initialize default validators
   */
  private initializeValidators(): void {
    logger.debug('Initializing validation service');
    
    // Register SDDirect validator
    ValidatorFactory.register('sddirect', () => new SDDirectValidator());
    
    logger.info('Validation service initialized', {
      supportedFormats: ValidatorFactory.getSupportedFormats()
    });
  }

  /**
   * Validate a record for the specified format
   */
  validateRecord(formatName: string, data: unknown): ValidationResult {
    try {
      const validator = ValidatorFactory.create(formatName);
      return validator.validateRecord(data);
    } catch (error) {
      logger.error('Failed to create validator', { formatName, error });
      return {
        success: false,
        errors: [{
          field: 'format',
          message: `Unsupported file format: ${formatName}`,
          code: 'UNSUPPORTED_FORMAT',
          value: formatName
        }]
      };
    }
  }

  /**
   * Validate a file for the specified format
   */
  validateFile(formatName: string, data: unknown): ValidationResult {
    try {
      const validator = ValidatorFactory.create(formatName);
      return validator.validateFile(data);
    } catch (error) {
      logger.error('Failed to create validator', { formatName, error });
      return {
        success: false,
        errors: [{
          field: 'format',
          message: `Unsupported file format: ${formatName}`,
          code: 'UNSUPPORTED_FORMAT',
          value: formatName
        }]
      };
    }
  }

  /**
   * Get validation rules for a format
   */
  getValidationRules(formatName: string): FieldValidationRule[] {
    try {
      const validator = ValidatorFactory.create(formatName);
      return validator.getValidationRules();
    } catch (error) {
      logger.error('Failed to get validation rules', { formatName, error });
      return [];
    }
  }

  /**
   * Get list of supported formats
   */
  getSupportedFormats(): string[] {
    return ValidatorFactory.getSupportedFormats();
  }

  /**
   * Check if a format is supported
   */
  isFormatSupported(formatName: string): boolean {
    return ValidatorFactory.isFormatSupported(formatName);
  }

  /**
   * Validate multiple records in batch
   */
  validateRecordsBatch(formatName: string, records: unknown[]): ValidationResult[] {
    logger.debug('Validating records batch', { 
      formatName, 
      recordCount: records.length 
    });
    
    return records.map((record, index) => {
      const result = this.validateRecord(formatName, record);
      if (!result.success) {
        // Add batch context to errors
        result.errors = result.errors.map(error => ({
          ...error,
          field: `record[${index}].${error.field}`,
          path: ['record', String(index), ...(error.path || [])]
        }));
      }
      return result;
    });
  }
}

// Export singleton instance
export const validationService = ValidationService.getInstance();
