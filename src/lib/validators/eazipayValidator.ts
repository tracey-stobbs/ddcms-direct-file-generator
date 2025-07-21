import type { EaziPayTrailerFormat } from '../types';

/**
 * Validator for EaziPay-specific field validation rules
 * Handles Fixed Zero, Empty Field, SUN Number conditional logic, and EaziPayTrailer
 */
export class EaziPayValidator {
  /**
   * Valid transaction codes that allow SUN Number to be present
   */
  private static readonly SUN_ALLOWED_TRANSACTION_CODES = ['0C', '0N', '0S'];

  /**
   * Validate Fixed Zero field - must be exactly number 0
   * @param value - The value to validate
   * @returns True if valid (exactly 0), false otherwise
   */
  static validateFixedZero(value: unknown): value is 0 {
    return value === 0;
  }

  /**
   * Validate Empty field - must be exactly undefined
   * @param value - The value to validate
   * @returns True if valid (undefined), false otherwise
   */
  static validateEmptyField(value: unknown): value is undefined {
    return value === undefined;
  }

  /**
   * Validate SUN Number based on transaction code conditional logic
   * If Transaction Code is NOT 0C, 0N, or 0S → must be null/undefined
   * If Transaction Code is 0C, 0N, or 0S → can be present or null/undefined
   * @param sunNumber - The SUN number value
   * @param transactionCode - The transaction code
   * @returns True if valid according to rules
   */
  static validateSunNumber(sunNumber: unknown, transactionCode: string): boolean {
    const isTransactionCodeAllowed = this.SUN_ALLOWED_TRANSACTION_CODES.includes(transactionCode);
    const isSunNumberEmpty = sunNumber === null || sunNumber === undefined;
    
    if (!isTransactionCodeAllowed) {
      // If transaction code doesn't allow SUN number, it must be null/undefined
      return isSunNumberEmpty;
    }
    
    // If transaction code allows SUN number, it can be present or null/undefined
    return true;
  }

  /**
   * Validate and determine EaziPayTrailer format
   * @param trailer - The trailer string to validate
   * @returns The trailer format type if valid
   * @throws Error if trailer format is invalid
   */
  static validateEaziPayTrailer(trailer: string): EaziPayTrailerFormat {
    const quotedPattern = '",,,,,,,,"';  // 9 commas within quotes
    const unquotedPattern = ',,,,,,,,,';  // 9 consecutive commas
    
    if (trailer === quotedPattern) {
      return 'quoted';
    }
    
    if (trailer === unquotedPattern) {
      return 'unquoted';
    }
    
    throw new Error(`Invalid EaziPayTrailer format. Expected "${quotedPattern}" or "${unquotedPattern}", got "${trailer}"`);
  }

  /**
   * Generate a valid trailer string for the specified format
   * @param format - The trailer format to generate
   * @returns Valid trailer string
   */
  static generateValidTrailer(format: EaziPayTrailerFormat): string {
    switch (format) {
      case 'quoted':
        return '",,,,,,,,"';  // 9 commas within quotes
      case 'unquoted':
        return ',,,,,,,,,';   // 9 consecutive commas
      default:
        throw new Error(`Unknown trailer format: ${format}`);
    }
  }

  /**
   * Get the column count for a given trailer format
   * @param format - The trailer format
   * @returns Number of columns (15 for quoted, 23 for unquoted)
   */
  static getColumnCount(format: EaziPayTrailerFormat): number {
    switch (format) {
      case 'quoted':
        return 15;  // Trailer is one column
      case 'unquoted':
        return 23;  // Trailer expands to 9 columns (14 regular + 9 trailer = 23)
      default:
        throw new Error(`Unknown trailer format: ${format}`);
    }
  }

  /**
   * Validate if a transaction code allows SUN number
   * @param transactionCode - The transaction code to check
   * @returns True if SUN number is allowed
   */
  static isSunNumberAllowed(transactionCode: string): boolean {
    return this.SUN_ALLOWED_TRANSACTION_CODES.includes(transactionCode);
  }

  /**
   * Get all transaction codes that allow SUN number
   * @returns Array of valid transaction codes
   */
  static getSunAllowedTransactionCodes(): readonly string[] {
    return Object.freeze([...this.SUN_ALLOWED_TRANSACTION_CODES]);
  }

  /**
   * Validate all EaziPay-specific fields at once
   * @param fields - Object containing the fields to validate
   * @returns Validation result with details
   */
  static validateAllFields(fields: {
    fixedZero: unknown;
    empty: unknown;
    sunNumber: unknown;
    transactionCode: string;
    eaziPayTrailer: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate Fixed Zero
    if (!this.validateFixedZero(fields.fixedZero)) {
      errors.push(`Fixed Zero must be exactly 0, got: ${fields.fixedZero}`);
    }

    // Validate Empty field
    if (!this.validateEmptyField(fields.empty)) {
      errors.push(`Empty field must be undefined, got: ${fields.empty}`);
    }

    // Validate SUN Number
    if (!this.validateSunNumber(fields.sunNumber, fields.transactionCode)) {
      errors.push(`SUN Number invalid for transaction code ${fields.transactionCode}. Must be null/undefined for codes other than 0C, 0N, 0S`);
    }

    // Validate EaziPay Trailer
    try {
      this.validateEaziPayTrailer(fields.eaziPayTrailer);
    } catch (error) {
      errors.push((error as Error).message);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
