/**
 * Constants used throughout the application
 */

export const DEFAULT_VALUES = {
  FILE_TYPE: 'SDDirect',
  INCLUDE_HEADERS: true,
  INCLUDE_OPTIONAL_FIELDS: false,
  NUMBER_OF_ROWS: 100,
  HAS_INVALID_ROWS: false,
};

// Characters allowed in text fields
export const ALLOWED_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.&/- ';

// Transaction code values
export const TRANSACTION_CODES = ['01', '17', '18', '99', '0C', '0N', '0S'];

// Zero amount transaction codes
export const ZERO_AMOUNT_TRANSACTION_CODES = ['0C', '0N', '0S'];

// Forbidden payment reference prefixes
export const FORBIDDEN_PAYMENT_REF_PREFIXES = ['DDIC', ' '];
