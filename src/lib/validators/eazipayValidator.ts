
/**
 * Validator for EaziPay-specific field validation rules
 * Handles Fixed Zero, Empty Field, and SUN Number conditional logic
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

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
