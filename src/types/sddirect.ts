/**
 * SDDirect Payment File Format Type Definitions
 * 
 * Based on the SDDirect CSV specification for payment instructions
 * with comprehensive field validation and type safety.
 */

// SDDirect payment record interface matching SDDirect.md specification
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

export interface SDDirectFile {
  /** File metadata */
  metadata: {
    /** Generation timestamp */
    generatedAt: string;
    /** Total number of records */
    recordCount: number;
    /** Total value (sum of all amounts) */
    totalValue: string;
    /** File format version */
    version: string;
  };
  /** Array of payment records */
  records: SDDirectRecord[];
}

// Validation constants based on field-level-validation.md
export const VALIDATION_CONSTANTS = {
  DESTINATION_ACCOUNT_NAME: {
    MAX_LENGTH: 18,
    PATTERN: /^[A-Za-z0-9.&/\-\s]*$/
  },
  DESTINATION_SORT_CODE: {
    LENGTH: 6,
    PATTERN: /^\d{6}$/
  },
  DESTINATION_ACCOUNT_NUMBER: {
    LENGTH: 8,
    PATTERN: /^\d{8}$/
  },
  PAYMENT_REFERENCE: {
    MIN_LENGTH: 7,  // More than 6
    MAX_LENGTH: 17, // Less than 18
    PATTERN: /^[A-Za-z0-9.&/\-\s]*$/,
    START_PATTERN: /^[A-Za-z0-9]/,
    FORBIDDEN_PREFIXES: ['DDIC', ' ']
  },
  AMOUNT: {
    PATTERN: /^\d+(\.\d{1,2})?$/,
    NO_SEPARATORS: /^[^\s,]*$/
  },
  TRANSACTION_CODES: ['01', '17', '18', '99', '0C', '0N', '0S'] as const,
  REALTIME_INFO_CHECKSUM: {
    PATTERNS: [
      /^\/[A-Za-z0-9.&/\-\s]{3}$/,  // /XXX format
      /^0000$/                       // Exactly 0000
    ]
  },
  PAY_DATE: {
    PATTERN: /^\d{8}$/,              // YYYYMMDD format
    MIN_WORKING_DAYS: 3,
    MAX_WORKING_DAYS: 30
  },
  ORIGINATING_SORT_CODE: {
    LENGTH: 6,
    PATTERN: /^\d{6}$/
  },
  ORIGINATING_ACCOUNT_NUMBER: {
    LENGTH: 8,
    PATTERN: /^\d{8}$/
  },
  ORIGINATING_ACCOUNT_NAME: {
    MAX_LENGTH: 18,
    PATTERN: /^[A-Za-z0-9.&/\-\s]*$/
  },
  ALLOWED_CHARACTERS: /^[A-Za-z0-9.&/\-\s]*$/
} as const;

// Date validation helpers for YYYYMMDD format
export const DATE_HELPERS = {
  /** YYYYMMDD date format pattern */
  YYYYMMDD_PATTERN: /^\d{8}$/,
  
  /** Convert YYYYMMDD string to Date object */
  parseYYYYMMDD: (dateStr: string): Date | null => {
    if (!DATE_HELPERS.YYYYMMDD_PATTERN.test(dateStr)) return null;
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1; // Month is 0-indexed
    const day = parseInt(dateStr.substring(6, 8));
    const date = new Date(year, month, day);
    
    // Verify the date is valid and matches the input
    if (date.getFullYear() !== year || 
        date.getMonth() !== month || 
        date.getDate() !== day) {
      return null;
    }
    return date;
  },
  
  /** Check if date string is valid YYYYMMDD */
  isValidYYYYMMDD: (dateStr: string): boolean => {
    return DATE_HELPERS.parseYYYYMMDD(dateStr) !== null;
  },
  
  /** Format Date object to YYYYMMDD string */
  formatYYYYMMDD: (date: Date): string => {
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
  }
} as const;

// Validation result types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

// Field validation rule types for extensibility
export interface FieldValidationRule {
  field: string;
  type: 'string' | 'number' | 'date' | 'enum';
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  minValue?: number;
  maxValue?: number;
  enumValues?: string[];
  customValidator?: (value: unknown) => boolean;
  errorMessage?: string;
}

// Export validation rules for documentation and testing
export const SDDIRECT_VALIDATION_RULES: FieldValidationRule[] = [
  {
    field: 'destinationAccountName',
    type: 'string',
    required: true,
    maxLength: VALIDATION_CONSTANTS.DESTINATION_ACCOUNT_NAME.MAX_LENGTH,
    pattern: VALIDATION_CONSTANTS.DESTINATION_ACCOUNT_NAME.PATTERN,
    errorMessage: 'Destination account name must be 18 characters or less with allowed characters only'
  },
  {
    field: 'destinationSortCode',
    type: 'string',
    required: true,
    minLength: VALIDATION_CONSTANTS.DESTINATION_SORT_CODE.LENGTH,
    maxLength: VALIDATION_CONSTANTS.DESTINATION_SORT_CODE.LENGTH,
    pattern: VALIDATION_CONSTANTS.DESTINATION_SORT_CODE.PATTERN,
    errorMessage: 'Destination sort code must be exactly 6 digits'
  },
  {
    field: 'destinationAccountNumber',
    type: 'string',
    required: true,
    minLength: VALIDATION_CONSTANTS.DESTINATION_ACCOUNT_NUMBER.LENGTH,
    maxLength: VALIDATION_CONSTANTS.DESTINATION_ACCOUNT_NUMBER.LENGTH,
    pattern: VALIDATION_CONSTANTS.DESTINATION_ACCOUNT_NUMBER.PATTERN,
    errorMessage: 'Destination account number must be exactly 8 digits'
  },
  {
    field: 'paymentReference',
    type: 'string',
    required: true,
    minLength: VALIDATION_CONSTANTS.PAYMENT_REFERENCE.MIN_LENGTH,
    maxLength: VALIDATION_CONSTANTS.PAYMENT_REFERENCE.MAX_LENGTH,
    pattern: VALIDATION_CONSTANTS.PAYMENT_REFERENCE.PATTERN,
    errorMessage: 'Payment reference must be 7-17 characters with allowed characters, start with alphanumeric'
  },
  {
    field: 'amount',
    type: 'string',
    required: true,
    pattern: VALIDATION_CONSTANTS.AMOUNT.PATTERN,
    errorMessage: 'Amount must be a valid decimal without separator characters'
  },
  {
    field: 'transactionCode',
    type: 'enum',
    required: true,
    enumValues: [...VALIDATION_CONSTANTS.TRANSACTION_CODES],
    errorMessage: 'Transaction code must be one of: 01, 17, 18, 99, 0C, 0N, 0S'
  },
  {
    field: 'realtimeInformationChecksum',
    type: 'string',
    required: false,
    errorMessage: 'Realtime information checksum must match pattern /XXX or be 0000'
  },
  {
    field: 'payDate',
    type: 'date',
    required: false,
    pattern: VALIDATION_CONSTANTS.PAY_DATE.PATTERN,
    customValidator: (value) => typeof value === 'string' && DATE_HELPERS.isValidYYYYMMDD(value),
    errorMessage: 'Pay date must be a valid date in YYYYMMDD format, 3-30 working days in future'
  },
  {
    field: 'originatingSortCode',
    type: 'string',
    required: false,
    minLength: VALIDATION_CONSTANTS.ORIGINATING_SORT_CODE.LENGTH,
    maxLength: VALIDATION_CONSTANTS.ORIGINATING_SORT_CODE.LENGTH,
    pattern: VALIDATION_CONSTANTS.ORIGINATING_SORT_CODE.PATTERN,
    errorMessage: 'Originating sort code must be exactly 6 digits'
  },
  {
    field: 'originatingAccountNumber',
    type: 'string',
    required: false,
    minLength: VALIDATION_CONSTANTS.ORIGINATING_ACCOUNT_NUMBER.LENGTH,
    maxLength: VALIDATION_CONSTANTS.ORIGINATING_ACCOUNT_NUMBER.LENGTH,
    pattern: VALIDATION_CONSTANTS.ORIGINATING_ACCOUNT_NUMBER.PATTERN,
    errorMessage: 'Originating account number must be exactly 8 digits'
  },
  {
    field: 'originatingAccountName',
    type: 'string',
    required: false,
    maxLength: VALIDATION_CONSTANTS.ORIGINATING_ACCOUNT_NAME.MAX_LENGTH,
    pattern: VALIDATION_CONSTANTS.ORIGINATING_ACCOUNT_NAME.PATTERN,
    errorMessage: 'Originating account name must be 18 characters or less with allowed characters only'
  }
];

