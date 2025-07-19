/**
 * Service responsible for generating random data according to validation rules
 * Uses corrected YYYYMMDD date format and proper field validation
 */
import { faker } from '@faker-js/faker';
import { DateTime } from 'luxon';
import { AddWorkingDays } from '../lib/calendar';
import { logger } from '../lib/logger';
import { 
  SDDirectRecord, 
  TransactionCode, 
  VALIDATION_CONSTANTS
} from '../types/sddirect';

// Extract constants for easier use
const TRANSACTION_CODES = VALIDATION_CONSTANTS.TRANSACTION_CODES;
const ALLOWED_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.&/- ';
const ZERO_AMOUNT_TRANSACTION_CODES: TransactionCode[] = ['0C', '0N', '0S'];

/**
 * Generate random string using only allowed characters
 */
export function generateRandomString(
  length: number,
  allowedChars: string = ALLOWED_CHARACTERS
): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += allowedChars.charAt(
      Math.floor(Math.random() * allowedChars.length)
    );
  }
  return result;
}

/**
 * Generate realistic account name (≤18 chars, allowed characters only)
 */
export function generateAccountName(): string {
  // Generate a company or person name and limit to 18 chars
  let name = Math.random() > 0.5 ? 
    faker.company.name() : 
    faker.person.fullName();
  
  // Filter out any non-allowed characters
  name = name.split('')
    .filter(char => ALLOWED_CHARACTERS.includes(char))
    .join('');
    
  // Ensure we have at least 3 characters after filtering
  while (name.length < 3) {
    name += generateRandomString(3 - name.length);
  }
  
  return name.substring(0, 18);
}

/**
 * Generate valid UK sort code (exactly 6 digits)
 */
export function generateSortCode(): string {
  // Use realistic UK bank sort codes (major banks)
  const ukBankPrefixes = ['12', '20', '30', '40', '50', '60', '77', '82', '83'];
  const prefix = ukBankPrefixes[Math.floor(Math.random() * ukBankPrefixes.length)];
  const suffix = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)).join('');
  return prefix + suffix;
}

/**
 * Generate valid account number (exactly 8 digits)
 */
export function generateAccountNumber(): string {
  return Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
}

/**
 * Generate valid payment reference (6-18 chars, specific rules)
 */
export function generatePaymentReference(): string {
  const length = Math.floor(Math.random() * 11) + 7; // Between 7 and 17 characters
  
  let reference = generateRandomString(length);
  
  // Ensure it doesn't start with "DDIC" or any non-word character
  while (reference.startsWith('DDIC') || /^\W/.test(reference)) {
    reference = generateRandomString(length);
  }
  
  // Ensure it doesn't contain all the same characters
  const uniqueChars = new Set(reference.split(''));
  if (uniqueChars.size === 1) {
    return generatePaymentReference(); // Retry generation
  }
  
  return reference;
}

/**
 * Generate amount based on transaction code rules
 */
export function generateAmount(transactionCode: TransactionCode): string {
  if (ZERO_AMOUNT_TRANSACTION_CODES.includes(transactionCode)) {
    return '0';
  }
  
  // Generate a random amount between 0.01 and 10000.00
  const amount = (Math.random() * 10000 + 0.01).toFixed(2);
  return amount;
}

/**
 * Generate valid transaction code from allowed list
 */
export function generateTransactionCode(): TransactionCode {
  const index = Math.floor(Math.random() * TRANSACTION_CODES.length);
  return TRANSACTION_CODES[index] as TransactionCode;
}

/**
 * Generate valid pay date (YYYYMMDD format, working day rules)
 */
export function generatePayDate(transactionCode?: TransactionCode): string {
  const today = DateTime.now();
  
  if (transactionCode && ZERO_AMOUNT_TRANSACTION_CODES.includes(transactionCode)) {
    // Special rule: EXACTLY 3 working days in future for 0C, 0N, 0S
    const payDate = AddWorkingDays(today, 3);
    return payDate.toFormat('yyyyMMdd');
  }
  
  // Regular rule: 3-30 working days in future
  const minDays = 3;
  const maxDays = 30;
  const workingDaysOffset = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
  
  const payDate = AddWorkingDays(today, workingDaysOffset);
  return payDate.toFormat('yyyyMMdd');
}

/**
 * Generate realtime information checksum based on transaction code
 */
export function generateRealtimeInformationChecksum(transactionCode: TransactionCode): string {
  // Only generate for credit transaction codes (99)
  if (transactionCode !== '99') {
    return '';
  }
  
  // Randomly choose between the allowed patterns:
  // 1. /XXX where X is any allowed character
  // 2. 0000
  // 3. Empty string
  const patternChoice = Math.random();
  
  if (patternChoice < 0.33) {
    return '0000';
  } else if (patternChoice < 0.67) {
    // Return /XXX where X is any allowed character
    const chars = generateRandomString(3);
    return '/' + chars;
  } else {
    return '';
  }
}

/**
 * Generate a complete valid SDDirect record
 */
export function generateValidRecord(includeOptionalFields: boolean): SDDirectRecord {
  const transactionCode = generateTransactionCode();
  
  const record: SDDirectRecord = {
    destinationAccountName: generateAccountName(),
    destinationSortCode: generateSortCode(),
    destinationAccountNumber: generateAccountNumber(),
    paymentReference: generatePaymentReference(),
    amount: generateAmount(transactionCode),
    transactionCode: transactionCode
  };
  
  if (includeOptionalFields) {
    record.realtimeInformationChecksum = generateRealtimeInformationChecksum(transactionCode);
    record.payDate = generatePayDate(transactionCode);
    record.originatingSortCode = generateSortCode();
    record.originatingAccountNumber = generateAccountNumber();
    record.originatingAccountName = generateAccountName();
  }
  
  return record;
}

/**
 * Make a specific field invalid for testing
 */
function makeFieldInvalid(record: SDDirectRecord, fieldName: keyof SDDirectRecord): void {
  switch (fieldName) {
    case 'destinationAccountName':
      // Make name too long (>18 chars) or include invalid chars
      record.destinationAccountName = generateRandomString(20, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789*^%$#@!');
      break;
    case 'destinationSortCode':
      // Make sort code invalid (not 6 digits or include non-numeric)
      record.destinationSortCode = Math.random() > 0.5 
        ? generateRandomString(5, '0123456789') 
        : generateRandomString(6, '0123456789ABC');
      break;
    case 'destinationAccountNumber':
      // Make account number invalid (not 8 digits or include non-numeric)
      record.destinationAccountNumber = Math.random() > 0.5
        ? generateRandomString(7, '0123456789')
        : generateRandomString(8, '0123456789XYZ');
      break;
    case 'paymentReference': {
      // Make payment reference invalid (too short, starts with DDIC, all same chars)
      const invalidOptions = [
        'DDIC' + generateRandomString(5),
        ' ' + generateRandomString(5),
        'AAA', // Too short
        generateRandomString(20) // Too long
      ];
      record.paymentReference = invalidOptions[Math.floor(Math.random() * invalidOptions.length)]!;
      break;
    }
    case 'transactionCode':
      // Use an invalid transaction code
      record.transactionCode = '0X' as TransactionCode;
      break;
    case 'realtimeInformationChecksum':
      if (record.realtimeInformationChecksum !== undefined) {
        // Make checksum invalid 
        const invalidOptions = [
          '123', // No leading slash
          '/1234', // Too long
          '/12', // Too short
          '/$$%', // Invalid characters
          'ABCD',  // No slash, wrong length
          '0000X', // Wrong format for zeros
          '00000'  // Too many zeros
        ];
        record.realtimeInformationChecksum = invalidOptions[Math.floor(Math.random() * invalidOptions.length)]!;
      }
      break;
    case 'payDate':
      if (record.payDate !== undefined) {
        // Make an invalid date (past date, weekend, or invalid format)
        const invalidOptions = [
          '20250101', // Past date
          '2025013a', // Invalid characters
          '202501', // Too short
          DateTime.now().plus({ days: 1 }).toFormat('yyyyMMdd') // Too soon (not working day)
        ];
        record.payDate = invalidOptions[Math.floor(Math.random() * invalidOptions.length)]!;
      }
      break;
    case 'originatingSortCode':
      if (record.originatingSortCode !== undefined) {
        record.originatingSortCode = 'ABC123';
      }
      break;
    case 'originatingAccountNumber':
      if (record.originatingAccountNumber !== undefined) {
        record.originatingAccountNumber = 'X1234567';
      }
      break;
    case 'originatingAccountName':
      if (record.originatingAccountName !== undefined) {
        record.originatingAccountName = generateRandomString(25); // Too long
      }
      break;
    default:
      break;
  }
}

/**
 * Generate an invalid record by corrupting 1-3 fields
 */
export function generateInvalidRecord(includeOptionalFields: boolean): SDDirectRecord {
  const record = generateValidRecord(includeOptionalFields);
  
  // Determine how many fields to make invalid (1-3)
  const numInvalidFields = Math.floor(Math.random() * 3) + 1;
  
  // Get all possible field names excluding 'amount' (amount rules are tied to transaction code)
  const possibleFields: (keyof SDDirectRecord)[] = [
    'destinationAccountName',
    'destinationSortCode',
    'destinationAccountNumber',
    'paymentReference',
    'transactionCode'
  ];
  
  if (includeOptionalFields) {
    possibleFields.push(
      'realtimeInformationChecksum',
      'payDate',
      'originatingSortCode',
      'originatingAccountNumber',
      'originatingAccountName'
    );
  }
  
  // Randomly select fields to make invalid
  const fieldsToInvalidate = new Set<keyof SDDirectRecord>();
  while (fieldsToInvalidate.size < numInvalidFields && possibleFields.length > 0) {
    const randomIndex = Math.floor(Math.random() * possibleFields.length);
    const field = possibleFields[randomIndex];
    if (field) {
      fieldsToInvalidate.add(field);
    }
  }
  
  // Invalidate selected fields
  fieldsToInvalidate.forEach(field => {
    makeFieldInvalid(record, field);
  });
  
  return record;
}

/**
 * Generate multiple records with specified valid/invalid ratio
 */
export function generateRecords(
  numberOfRows: number,
  hasInvalidRows: boolean,
  includeOptionalFields: boolean,
  canInlineEdit: boolean = true
): SDDirectRecord[] {
  const records: SDDirectRecord[] = [];
  
  if (!hasInvalidRows) {
    // Generate all valid records
    for (let i = 0; i < numberOfRows; i++) {
      records.push(generateValidRecord(includeOptionalFields));
    }
  } else {
    // Calculate number of invalid rows (50% rounded down, max 49 if canInlineEdit)
    let invalidRowCount = Math.floor(numberOfRows * 0.5);
    if (canInlineEdit && invalidRowCount > 49) {
      invalidRowCount = 49;
    }
    
    const validRowCount = numberOfRows - invalidRowCount;
    
    logger.info(`Generating ${numberOfRows} records: ${validRowCount} valid, ${invalidRowCount} invalid`);
    
    // Generate valid records
    for (let i = 0; i < validRowCount; i++) {
      records.push(generateValidRecord(includeOptionalFields));
    }
    
    // Generate invalid records
    for (let i = 0; i < invalidRowCount; i++) {
      records.push(generateInvalidRecord(includeOptionalFields));
    }
    
    // Shuffle to mix valid and invalid records
    for (let i = records.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const recordI = records[i];
      const recordJ = records[j];
      if (recordI && recordJ) {
        [records[i], records[j]] = [recordJ, recordI];
      }
    }
  }
  
  return records;
}
