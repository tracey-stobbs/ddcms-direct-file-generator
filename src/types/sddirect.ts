/**
 * SDDirect File Format Type Definitions
 * 
 * Based on the SDDirect CSV specification with comprehensive field validation
 * and type safety for the DDCMS Direct File Creator application.
 */

import { z } from 'zod';

// Base interfaces for SDDirect file format
export interface SDDirectRecord {
  /** Unique transaction identifier */
  transactionId: string;
  /** Service user number (6 digits) */
  serviceUserNumber: string;
  /** Payer sort code (6 digits, format: NNNNNN) */
  payerSortCode: string;
  /** Payer account number (up to 8 digits) */
  payerAccountNumber: string;
  /** Payer name (up to 18 characters) */
  payerName: string;
  /** Collection amount in pence (positive integer) */
  collectionAmount: number;
  /** Collection date (YYYY-MM-DD format) */
  collectionDate: string;
  /** Reference (up to 18 characters) */
  reference: string;
  /** Direct debit instruction reference (up to 35 characters) */
  ddiReference: string;
}

export interface SDDirectFile {
  /** File metadata */
  metadata: {
    /** Generation timestamp */
    generatedAt: string;
    /** Total number of records */
    recordCount: number;
    /** Total value in pence */
    totalValue: number;
    /** File format version */
    version: string;
  };
  /** Array of transaction records */
  records: SDDirectRecord[];
}

// Validation constants based on field specifications
export const VALIDATION_CONSTANTS = {
  SERVICE_USER_NUMBER: {
    LENGTH: 6,
    PATTERN: /^\d{6}$/
  },
  SORT_CODE: {
    LENGTH: 6,
    PATTERN: /^\d{6}$/
  },
  ACCOUNT_NUMBER: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 8,
    PATTERN: /^\d{1,8}$/
  },
  PAYER_NAME: {
    MAX_LENGTH: 18,
    PATTERN: /^[A-Z0-9\s\-&'.]*$/i
  },
  REFERENCE: {
    MAX_LENGTH: 18,
    PATTERN: /^[A-Z0-9\s\-&'.]*$/i
  },
  DDI_REFERENCE: {
    MAX_LENGTH: 35,
    PATTERN: /^[A-Z0-9\s\-&'.]*$/i
  },
  COLLECTION_AMOUNT: {
    MIN_VALUE: 1,
    MAX_VALUE: 99999999999 // 11 digits max
  },
  TRANSACTION_ID: {
    MAX_LENGTH: 50,
    PATTERN: /^[A-Z0-9\-_]+$/i
  }
} as const;

// Date validation helpers
export const DATE_HELPERS = {
  /** ISO date format pattern (YYYY-MM-DD) */
  ISO_DATE_PATTERN: /^\d{4}-\d{2}-\d{2}$/,
  
  /** Check if date is a valid calendar date */
  isValidDate: (dateStr: string): boolean => {
    if (!DATE_HELPERS.ISO_DATE_PATTERN.test(dateStr)) return false;
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime()) && 
           date.toISOString().split('T')[0] === dateStr;
  },
  
  /** Check if date is in the future (for collection dates) */
  isFutureDate: (dateStr: string): boolean => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }
} as const;

// Custom Zod refinements for business rules
const serviceUserNumberSchema = z.string()
  .length(VALIDATION_CONSTANTS.SERVICE_USER_NUMBER.LENGTH, 'Service User Number must be exactly 6 digits')
  .regex(VALIDATION_CONSTANTS.SERVICE_USER_NUMBER.PATTERN, 'Service User Number must contain only digits');

const sortCodeSchema = z.string()
  .length(VALIDATION_CONSTANTS.SORT_CODE.LENGTH, 'Sort Code must be exactly 6 digits')
  .regex(VALIDATION_CONSTANTS.SORT_CODE.PATTERN, 'Sort Code must contain only digits');

const accountNumberSchema = z.string()
  .min(VALIDATION_CONSTANTS.ACCOUNT_NUMBER.MIN_LENGTH, 'Account Number must be at least 1 digit')
  .max(VALIDATION_CONSTANTS.ACCOUNT_NUMBER.MAX_LENGTH, 'Account Number must be at most 8 digits')
  .regex(VALIDATION_CONSTANTS.ACCOUNT_NUMBER.PATTERN, 'Account Number must contain only digits');

const payerNameSchema = z.string()
  .min(1, 'Payer Name is required')
  .max(VALIDATION_CONSTANTS.PAYER_NAME.MAX_LENGTH, `Payer Name must be at most ${VALIDATION_CONSTANTS.PAYER_NAME.MAX_LENGTH} characters`)
  .regex(VALIDATION_CONSTANTS.PAYER_NAME.PATTERN, 'Payer Name contains invalid characters');

const collectionAmountSchema = z.number()
  .int('Collection Amount must be an integer')
  .min(VALIDATION_CONSTANTS.COLLECTION_AMOUNT.MIN_VALUE, 'Collection Amount must be at least 1 pence')
  .max(VALIDATION_CONSTANTS.COLLECTION_AMOUNT.MAX_VALUE, 'Collection Amount exceeds maximum value');

const collectionDateSchema = z.string()
  .regex(DATE_HELPERS.ISO_DATE_PATTERN, 'Collection Date must be in YYYY-MM-DD format')
  .refine(DATE_HELPERS.isValidDate, 'Collection Date must be a valid calendar date')
  .refine(DATE_HELPERS.isFutureDate, 'Collection Date must be today or in the future');

const referenceSchema = z.string()
  .min(1, 'Reference is required')
  .max(VALIDATION_CONSTANTS.REFERENCE.MAX_LENGTH, `Reference must be at most ${VALIDATION_CONSTANTS.REFERENCE.MAX_LENGTH} characters`)
  .regex(VALIDATION_CONSTANTS.REFERENCE.PATTERN, 'Reference contains invalid characters');

const ddiReferenceSchema = z.string()
  .min(1, 'DDI Reference is required')
  .max(VALIDATION_CONSTANTS.DDI_REFERENCE.MAX_LENGTH, `DDI Reference must be at most ${VALIDATION_CONSTANTS.DDI_REFERENCE.MAX_LENGTH} characters`)
  .regex(VALIDATION_CONSTANTS.DDI_REFERENCE.PATTERN, 'DDI Reference contains invalid characters');

const transactionIdSchema = z.string()
  .min(1, 'Transaction ID is required')
  .max(VALIDATION_CONSTANTS.TRANSACTION_ID.MAX_LENGTH, `Transaction ID must be at most ${VALIDATION_CONSTANTS.TRANSACTION_ID.MAX_LENGTH} characters`)
  .regex(VALIDATION_CONSTANTS.TRANSACTION_ID.PATTERN, 'Transaction ID contains invalid characters');

// Main validation schemas
export const SDDirectRecordSchema = z.object({
  transactionId: transactionIdSchema,
  serviceUserNumber: serviceUserNumberSchema,
  payerSortCode: sortCodeSchema,
  payerAccountNumber: accountNumberSchema,
  payerName: payerNameSchema,
  collectionAmount: collectionAmountSchema,
  collectionDate: collectionDateSchema,
  reference: referenceSchema,
  ddiReference: ddiReferenceSchema
});

export const SDDirectFileSchema = z.object({
  metadata: z.object({
    generatedAt: z.string().datetime(),
    recordCount: z.number().int().min(0),
    totalValue: z.number().int().min(0),
    version: z.string().min(1)
  }),
  records: z.array(SDDirectRecordSchema).min(1, 'File must contain at least one record')
});

// Type exports derived from schemas
export type SDDirectRecordInput = z.infer<typeof SDDirectRecordSchema>;
export type SDDirectFileInput = z.infer<typeof SDDirectFileSchema>;

// Validation result types
export interface ValidationResult {
  success: boolean;
  errors: ValidationError[];
  data?: SDDirectRecord | SDDirectFile;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
  path?: string[];
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
    field: 'transactionId',
    type: 'string',
    required: true,
    maxLength: VALIDATION_CONSTANTS.TRANSACTION_ID.MAX_LENGTH,
    pattern: VALIDATION_CONSTANTS.TRANSACTION_ID.PATTERN,
    errorMessage: 'Transaction ID must be alphanumeric with hyphens/underscores'
  },
  {
    field: 'serviceUserNumber',
    type: 'string',
    required: true,
    minLength: VALIDATION_CONSTANTS.SERVICE_USER_NUMBER.LENGTH,
    maxLength: VALIDATION_CONSTANTS.SERVICE_USER_NUMBER.LENGTH,
    pattern: VALIDATION_CONSTANTS.SERVICE_USER_NUMBER.PATTERN,
    errorMessage: 'Service User Number must be exactly 6 digits'
  },
  {
    field: 'payerSortCode',
    type: 'string',
    required: true,
    minLength: VALIDATION_CONSTANTS.SORT_CODE.LENGTH,
    maxLength: VALIDATION_CONSTANTS.SORT_CODE.LENGTH,
    pattern: VALIDATION_CONSTANTS.SORT_CODE.PATTERN,
    errorMessage: 'Sort Code must be exactly 6 digits'
  },
  {
    field: 'payerAccountNumber',
    type: 'string',
    required: true,
    minLength: VALIDATION_CONSTANTS.ACCOUNT_NUMBER.MIN_LENGTH,
    maxLength: VALIDATION_CONSTANTS.ACCOUNT_NUMBER.MAX_LENGTH,
    pattern: VALIDATION_CONSTANTS.ACCOUNT_NUMBER.PATTERN,
    errorMessage: 'Account Number must be 1-8 digits'
  },
  {
    field: 'payerName',
    type: 'string',
    required: true,
    maxLength: VALIDATION_CONSTANTS.PAYER_NAME.MAX_LENGTH,
    pattern: VALIDATION_CONSTANTS.PAYER_NAME.PATTERN,
    errorMessage: 'Payer Name must be alphanumeric with allowed special characters'
  },
  {
    field: 'collectionAmount',
    type: 'number',
    required: true,
    minValue: VALIDATION_CONSTANTS.COLLECTION_AMOUNT.MIN_VALUE,
    maxValue: VALIDATION_CONSTANTS.COLLECTION_AMOUNT.MAX_VALUE,
    errorMessage: 'Collection Amount must be between 1 and 99,999,999,999 pence'
  },
  {
    field: 'collectionDate',
    type: 'date',
    required: true,
    pattern: DATE_HELPERS.ISO_DATE_PATTERN,
    customValidator: (value) => typeof value === 'string' && DATE_HELPERS.isValidDate(value) && DATE_HELPERS.isFutureDate(value),
    errorMessage: 'Collection Date must be a valid future date in YYYY-MM-DD format'
  },
  {
    field: 'reference',
    type: 'string',
    required: true,
    maxLength: VALIDATION_CONSTANTS.REFERENCE.MAX_LENGTH,
    pattern: VALIDATION_CONSTANTS.REFERENCE.PATTERN,
    errorMessage: 'Reference must be alphanumeric with allowed special characters'
  },
  {
    field: 'ddiReference',
    type: 'string',
    required: true,
    maxLength: VALIDATION_CONSTANTS.DDI_REFERENCE.MAX_LENGTH,
    pattern: VALIDATION_CONSTANTS.DDI_REFERENCE.PATTERN,
    errorMessage: 'DDI Reference must be alphanumeric with allowed special characters'
  }
];
