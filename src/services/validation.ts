/**
 * Payment Validation Service
 * 
 * Simple validation service for SDDirect payment instruction records.
 * Validates payment fields based on field-level-validation.md rules.
 */

import { logger } from '../lib/logger';

// SDDirect record interface matching SDDirect.md specification
export interface SDDirectRecord {
  // Required fields (exact order from SDDirect.md)
  destinationAccountName: string;        // ≤18 chars, allowed chars only
  destinationSortCode: string;           // Exactly 6 digits
  destinationAccountNumber: string;      // Exactly 8 digits  
  paymentReference: string;              // 6-18 chars, specific rules
  amount: string;                        // Decimal as string, "0" for 0C/0N/0S codes
  transactionCode: TransactionCode;      // 01,17,18,99,0C,0N,0S only
  
  // Optional fields (exact order from SDDirect.md)
  realtimeInformationChecksum?: string;  // /XXX pattern, 0000, or empty
  payDate?: string;                      // YYYYMMDD, working day rules
  originatingSortCode?: string;          // Exactly 6 digits
  originatingAccountNumber?: string;     // Exactly 8 digits
  originatingAccountName?: string;       // ≤18 chars, allowed chars only
}

// Valid transaction codes from field-level-validation.md
export type TransactionCode = '01' | '17' | '18' | '99' | '0C' | '0N' | '0S';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Validates payment records for SDDirect format
 */
export class SDDirectValidator {
  private formatName = 'SDDirect';
  
  // Allowed character pattern from field-level-validation.md
  private readonly ALLOWED_CHARS = /^[A-Za-z0-9.&/\-\s]*$/;
  
  // Valid transaction codes from field-level-validation.md
  private readonly VALID_TRANSACTION_CODES: TransactionCode[] = ['01', '17', '18', '99', '0C', '0N', '0S'];

  /**
   * Validates a single SDDirect record
   */
  validateRecord(record: SDDirectRecord): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate required fields
    this.validateRequiredField(record.destinationAccountName, 'destinationAccountName', errors);
    this.validateRequiredField(record.destinationSortCode, 'destinationSortCode', errors);
    this.validateRequiredField(record.destinationAccountNumber, 'destinationAccountNumber', errors);
    this.validateRequiredField(record.paymentReference, 'paymentReference', errors);
    this.validateRequiredField(record.amount, 'amount', errors);
    this.validateRequiredField(record.transactionCode, 'transactionCode', errors);

    // Destination Account Name validation
    if (record.destinationAccountName) {
      if (record.destinationAccountName.length > 18) {
        errors.push({
          field: 'destinationAccountName',
          message: 'Destination account name must be 18 characters or less',
          value: record.destinationAccountName
        });
      }
      if (!this.ALLOWED_CHARS.test(record.destinationAccountName)) {
        errors.push({
          field: 'destinationAccountName',
          message: 'Destination account name contains invalid characters',
          value: record.destinationAccountName
        });
      }
    }

    // Destination Sort Code validation
    if (record.destinationSortCode && !/^\d{6}$/.test(record.destinationSortCode)) {
      errors.push({
        field: 'destinationSortCode',
        message: 'Destination sort code must be exactly 6 digits',
        value: record.destinationSortCode
      });
    }

    // Destination Account Number validation
    if (record.destinationAccountNumber && !/^\d{8}$/.test(record.destinationAccountNumber)) {
      errors.push({
        field: 'destinationAccountNumber',
        message: 'Destination account number must be exactly 8 digits',
        value: record.destinationAccountNumber
      });
    }

    // Payment Reference validation
    if (record.paymentReference) {
      const length = record.paymentReference.length;
      if (length <= 6 || length >= 18) {
        errors.push({
          field: 'paymentReference',
          message: 'Payment reference must be more than 6 and less than 18 characters',
          value: record.paymentReference
        });
      }
      if (!/^[A-Za-z0-9]/.test(record.paymentReference)) {
        errors.push({
          field: 'paymentReference',
          message: 'Payment reference must start with a word character (letter or number)',
          value: record.paymentReference
        });
      }
      if (record.paymentReference.startsWith('DDIC') || record.paymentReference.startsWith(' ')) {
        errors.push({
          field: 'paymentReference',
          message: 'Payment reference must not start with "DDIC" or a space',
          value: record.paymentReference
        });
      }
      // Check if all characters are the same
      if (record.paymentReference.length > 1 && [...new Set(record.paymentReference)].length === 1) {
        errors.push({
          field: 'paymentReference',
          message: 'Payment reference cannot contain all the same characters',
          value: record.paymentReference
        });
      }
      if (!this.ALLOWED_CHARS.test(record.paymentReference)) {
        errors.push({
          field: 'paymentReference',
          message: 'Payment reference contains invalid characters',
          value: record.paymentReference
        });
      }
    }

    // Transaction Code validation
    if (record.transactionCode && !this.VALID_TRANSACTION_CODES.includes(record.transactionCode)) {
      errors.push({
        field: 'transactionCode',
        message: 'Transaction code must be one of: 01, 17, 18, 99, 0C, 0N, 0S',
        value: record.transactionCode
      });
    }

    // Amount validation
    if (record.amount) {
      // Special rule for certain transaction codes
      if (['0C', '0N', '0S'].includes(record.transactionCode) && record.amount !== '0') {
        errors.push({
          field: 'amount',
          message: 'Amount must be zero for transaction codes 0C, 0N, or 0S',
          value: record.amount
        });
      } else {
        // General amount validation
        const amountNum = parseFloat(record.amount);
        if (isNaN(amountNum)) {
          errors.push({
            field: 'amount',
            message: 'Amount must be a valid decimal or integer',
            value: record.amount
          });
        }
        // Check for separator characters (should not contain commas, etc.)
        if (/[,\s]/.test(record.amount)) {
          errors.push({
            field: 'amount',
            message: 'Amount must not contain separator characters',
            value: record.amount
          });
        }
      }
    }

    // Optional field validations
    if (record.realtimeInformationChecksum !== undefined && record.realtimeInformationChecksum !== '') {
      if (!/^(\/[A-Za-z0-9.&/\-\s]{3}|0000)$/.test(record.realtimeInformationChecksum)) {
        errors.push({
          field: 'realtimeInformationChecksum',
          message: 'Realtime information checksum must match pattern /XXX or be 0000',
          value: record.realtimeInformationChecksum
        });
      }
    }

    if (record.payDate && !/^\d{8}$/.test(record.payDate)) {
      errors.push({
        field: 'payDate',
        message: 'Pay date must be in YYYYMMDD format',
        value: record.payDate
      });
    }

    if (record.originatingSortCode && !/^\d{6}$/.test(record.originatingSortCode)) {
      errors.push({
        field: 'originatingSortCode',
        message: 'Originating sort code must be exactly 6 digits',
        value: record.originatingSortCode
      });
    }

    if (record.originatingAccountNumber && !/^\d{8}$/.test(record.originatingAccountNumber)) {
      errors.push({
        field: 'originatingAccountNumber',
        message: 'Originating account number must be exactly 8 digits',
        value: record.originatingAccountNumber
      });
    }

    if (record.originatingAccountName) {
      if (record.originatingAccountName.length > 18) {
        errors.push({
          field: 'originatingAccountName',
          message: 'Originating account name must be 18 characters or less',
          value: record.originatingAccountName
        });
      }
      if (!this.ALLOWED_CHARS.test(record.originatingAccountName)) {
        errors.push({
          field: 'originatingAccountName',
          message: 'Originating account name contains invalid characters',
          value: record.originatingAccountName
        });
      }
    }

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors
    };

    if (!result.isValid) {
      logger.debug('SDDirect record validation failed', { 
        formatName: this.formatName,
        errorCount: errors.length,
        errors: errors.map(e => ({ field: e.field, message: e.message }))
      });
    }

    return result;
  }

  /**
   * Validates multiple SDDirect records
   */
  validateRecords(records: SDDirectRecord[]): ValidationResult {
    const allErrors: ValidationError[] = [];

    records.forEach((record, index) => {
      const recordResult = this.validateRecord(record);
      if (!recordResult.isValid) {
        // Add record index to error context
        recordResult.errors.forEach(error => {
          allErrors.push({
            ...error,
            field: `record[${index}].${error.field}`
          });
        });
      }
    });

    return {
      isValid: allErrors.length === 0,
      errors: allErrors
    };
  }

  /**
   * Checks if the format is supported
   */
  supportsFormat(format: string): boolean {
    return format.toLowerCase() === 'sddirect';
  }

  /**
   * Gets the supported format name
   */
  getSupportedFormat(): string {
    return this.formatName;
  }

  private validateRequiredField(value: unknown, fieldName: string, errors: ValidationError[]): void {
    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
      errors.push({
        field: fieldName,
        message: `${fieldName} is required`,
        value
      });
    }
  }
}

// Export singleton instance
export const sdDirectValidator = new SDDirectValidator();
