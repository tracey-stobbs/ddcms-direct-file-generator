/**
 * Service responsible for generating random data according to validation rules
 */
import { faker } from '@faker-js/faker';
import { DateTime } from 'luxon';
import { IsBankHoliday } from '../utils/uk-bank-holidays';
import logger from '../utils/logger';

const ALLOWED_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,&/-';
const TRANSACTION_CODES = ['01', '17', '18', '99', '0C', '0N', '0S'];
const ZERO_AMOUNT_TRANSACTION_CODES = ['0C', '0N', '0S'];

/**
 * Generate an account name that adheres to validation rules
 * @param forceInvalid Flag to forcefully generate an invalid value
 * @returns A valid or invalid account name
 */
export function generateAccountName(forceInvalid = false): string {
  if (forceInvalid) {
    // Generate an invalid account name (more than 18 characters)
    return faker.company.name().padEnd(19, 'X').slice(0, 25);
  }
  
  // Generate a valid account name (18 characters or less)
  let name = faker.company.name().slice(0, 18);  // Sanitize to only include allowed characters
  name = name.split('')
    .filter((char: string) => ALLOWED_CHARACTERS.includes(char))
    .join('');
    
  return name || 'Valid Account';
}

/**
 * Generate a sort code that adheres to validation rules
 * @param forceInvalid Flag to forcefully generate an invalid value
 * @returns A valid or invalid sort code
 */
export function generateSortCode(forceInvalid = false): string {
  if (forceInvalid) {
    // Generate an invalid sort code (not 6 digits or includes non-numeric)
    const options = [
      faker.string.numeric(5), // Too short
      faker.string.numeric(7), // Too long
      faker.string.alphanumeric(6) // Contains non-numeric
    ];
    return options[Math.floor(Math.random() * options.length)];
  }
  
  // Generate a valid sort code (exactly 6 digits)
  return faker.string.numeric(6);
}

/**
 * Generate an account number that adheres to validation rules
 * @param forceInvalid Flag to forcefully generate an invalid value
 * @returns A valid or invalid account number
 */
export function generateAccount(forceInvalid = false): string {
  if (forceInvalid) {
    // Generate an invalid account number (not 8 digits or includes non-numeric)
    const options = [
      faker.string.numeric(7), // Too short
      faker.string.numeric(9), // Too long
      faker.string.alphanumeric(8) // Contains non-numeric
    ];
    return options[Math.floor(Math.random() * options.length)];
  }
  
  // Generate a valid account number (exactly 8 digits)
  return faker.string.numeric(8);
}

/**
 * Generate a payment reference that adheres to validation rules
 * @param forceInvalid Flag to forcefully generate an invalid value
 * @returns A valid or invalid payment reference
 */
export function generatePaymentReference(forceInvalid = false): string {
  if (forceInvalid) {
    // Generate an invalid payment reference
    const options = [
      'DDIC' + faker.string.alphanumeric(5), // Starts with DDIC
      ' ' + faker.string.alphanumeric(7), // Starts with space
      faker.string.alphanumeric(5), // Too short
      faker.string.alphanumeric(20), // Too long
      'AAAAAAAA', // All the same character
      '.' + faker.string.alphanumeric(7), // Doesn't start with word character
      '&' + faker.string.alphanumeric(7) // Doesn't start with word character
    ];
    return options[Math.floor(Math.random() * options.length)];
  }
  
  // Generate a valid payment reference (more than 6, less than 18 chars)
  const length = Math.floor(Math.random() * 11) + 7; // 7 to 17 characters
  let ref = faker.string.alphanumeric(1); // Ensure it starts with a word character
  
  // Fill the rest with allowed characters
  for (let i = 1; i < length; i++) {
    ref += ALLOWED_CHARACTERS.charAt(Math.floor(Math.random() * ALLOWED_CHARACTERS.length));
  }
  
  return ref;
}

/**
 * Generate an amount that adheres to validation rules
 * @param transactionCode The transaction code associated with the amount
 * @param forceInvalid Flag to forcefully generate an invalid value
 * @returns A valid or invalid amount
 */
export function generateAmount(transactionCode: string, forceInvalid = false): string {
  if (forceInvalid) {
    // Generate an invalid amount
    if (ZERO_AMOUNT_TRANSACTION_CODES.includes(transactionCode)) {
      // For zero amount transaction codes, any non-zero amount is invalid
      return (Math.random() * 1000).toFixed(2);
    } else {
      // For other transaction codes, add separator characters (invalid)
      return (Math.random() * 1000).toLocaleString('en-US', { minimumFractionDigits: 2 });
    }
  }
  
  // Generate a valid amount
  if (ZERO_AMOUNT_TRANSACTION_CODES.includes(transactionCode)) {
    return '0.00';
  } else {
    // Random amount without separator characters
    return (Math.random() * 1000).toFixed(2).replace('.', '');
  }
}

/**
 * Generate a transaction code that adheres to validation rules
 * @param forceInvalid Flag to forcefully generate an invalid value
 * @returns A valid or invalid transaction code
 */
export function generateTransactionCode(forceInvalid = false): string {
  if (forceInvalid) {
    // Generate an invalid transaction code (not in the allowed list)
    const invalidOptions = ['00', '02', '03', '0A', '0B', 'XX', ''];
    return invalidOptions[Math.floor(Math.random() * invalidOptions.length)];
  }
  
  // Generate a valid transaction code
  return TRANSACTION_CODES[Math.floor(Math.random() * TRANSACTION_CODES.length)];
}

/**
 * Generate a checksum that adheres to validation rules
 * @param forceInvalid Flag to forcefully generate an invalid value
 * @returns A valid or invalid checksum
 */
export function generateChecksum(forceInvalid = false): string {
  if (forceInvalid) {
    // Generate an invalid checksum
    const invalidOptions = [
      '/XX', // Too few characters
      '/XXXX', // Too many characters
      '000', // Too few zeros
      '00000', // Too many zeros
      'ABC123' // Contains invalid characters
    ];
    return invalidOptions[Math.floor(Math.random() * invalidOptions.length)];
  }
  
  // Generate a valid checksum
  const validOptions = [
    '/' + faker.string.alphanumeric(3).toUpperCase(),
    '0000',
    '' // Empty is also valid
  ];
  
  return validOptions[Math.floor(Math.random() * validOptions.length)];
}

/**
 * Generate a pay date that adheres to validation rules
 * @param forceInvalid Flag to forcefully generate an invalid value
 * @returns A valid or invalid pay date
 */
export function generatePayDate(forceInvalid = false): string {
  if (forceInvalid) {
    // Generate an invalid pay date
    const options = [
      DateTime.now().plus({ days: 1 }).toFormat('yyyyMMdd'), // Only 1 day in future (too soon)
      DateTime.now().plus({ days: 31 }).toFormat('yyyyMMdd'), // More than 30 days in future
      DateTime.now().plus({ days: 5 }).toFormat('yyyy-MM-dd'), // Wrong format
      'invalid-date' // Not a date
    ];
    return options[Math.floor(Math.random() * options.length)];
  }
  
  // Generate a valid pay date
  // - Must be 2-30 days in future
  // - Must not be a weekend or bank holiday
  let daysToAdd = 2; // Start with 2 days in the future
  let dateTime = DateTime.now().plus({ days: daysToAdd });
  
  // Try to find a valid date (not weekend or bank holiday)
  while (
    daysToAdd <= 30 && 
    (dateTime.weekday > 5 || IsBankHoliday(dateTime))
  ) {
    daysToAdd++;
    dateTime = DateTime.now().plus({ days: daysToAdd });
  }
  
  if (daysToAdd > 30) {
    logger.warn('Could not find a valid pay date within 30 days. Defaulting to first available weekday.');
    // Default to first available weekday
    dateTime = DateTime.now().plus({ days: 2 });
    while (dateTime.weekday > 5) {
      dateTime = dateTime.plus({ days: 1 });
    }
  }
  
  return dateTime.toFormat('yyyyMMdd');
}
