/**
 * Service responsible for generating random data according to validation rules
 */
import { faker } from '@faker-js/faker';
import { DateTime } from 'luxon';
import { IsBankHoliday } from '../utils/uk-bank-holidays';
import logger from '../utils/logger';
import { ALLOWED_TRANSACTION_CODES,  RowData, TransactionCode, ZERO_AMOUNT_TRANSACTION_CODES } from '@models/RowData';



const ALLOWED_CHARACTERS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .&/-";

// Function to generate a random string of specified length using allowed characters
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

// Generate random account name (up to 18 characters)
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

// Generate random sort code (exactly 6 digits)
export function generateSortCode(): string {
  return Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');
}

// Generate random account number (exactly 8 digits)
export function generateAccountNumber(): string {
  return Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
}

// Generate valid payment reference
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

// Generate random amount
export function generateAmount(transactionCode: TransactionCode): string {
  if (ZERO_AMOUNT_TRANSACTION_CODES.includes(transactionCode)) {
    return '0.00';
  }
  
  // Generate a random amount between 0.01 and 10000.00
  const amount = (Math.random() * 10000).toFixed(2);
  return amount;
}

// Generate random transaction code
export function generateTransactionCode(): TransactionCode {
  const index = Math.floor(Math.random() * ALLOWED_TRANSACTION_CODES.length);
  return ALLOWED_TRANSACTION_CODES[index];
}

// Generate valid pay date (2-30 days in future, not weekend or bank holiday)
export function generatePayDate(): string {
  let date = DateTime.now().plus({ days: 2 });
  
  // Ensure it's not more than 30 days in the future
  const maxDate = DateTime.now().plus({ days: 30 });
  
  // Find a valid date (not weekend, not bank holiday)
  while (
    date < maxDate && 
    (date.weekday > 5 || IsBankHoliday(date))
  ) {
    date = date.plus({ days: 1 });
  }
  
  // Format as YYYYMMDD
  return date.toFormat('yyyyMMdd');
}

// Generate random checksum that matches regex: /^[/]{1}[A-Za-z0-9.&/\-, ]{3}$)|(^0{4}$)|(^$)/
export function generateRealtimeInformationChecksum(): string {
  // Randomly choose between the allowed patterns:
  // 1. /XXX where X is any allowed character
  // 2. 0000
  // 3. Empty string
  const patternChoice = Math.random();
  
  if (patternChoice < 0.33) {
    // Return 0000
    return '0000';
  } else if (patternChoice < 0.67) {
    // Return /XXX where X is any allowed character
    const allowedCharsForRest = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789./&- ';
    let result = '/';
    for (let i = 0; i < 3; i++) {
      result += allowedCharsForRest.charAt(Math.floor(Math.random() * allowedCharsForRest.length));
    }
    return result;
  } else {
    // Return empty string
    return '';
  }
}

// Generate a valid row based on the specifications
export function generateValidRow(includeOptionalFields: boolean) : RowData {
  const transactionCode = generateTransactionCode();
  
  const row: RowData = {
    destinationAccountName: generateAccountName(),
    destinationSortCode: generateSortCode(),
    destinationAccountNumber: generateAccountNumber(),
    paymentReference: generatePaymentReference(),
    amount: generateAmount(transactionCode),
    transactionCode: transactionCode
  };
  
  if (includeOptionalFields) {
    row.realtimeInformationChecksum = generateRealtimeInformationChecksum();
    row.payDate = generatePayDate();
    row.originatingSortCode = generateSortCode();
    row.originatingAccountNumber = generateAccountNumber();
    row.originatingAccountName = generateAccountName();
  }
  
  return row;
}

// Function to make a field invalid based on field name
function makeFieldInvalid(row: RowData, fieldName: keyof RowData): void {
  switch (fieldName) {
    case 'destinationAccountName':
      // Make name too long (>18 chars) or include invalid chars
      row.destinationAccountName = generateRandomString(20, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789*^%$#@!');
      break;
    case 'destinationSortCode':
      // Make sort code invalid (not 6 digits or include non-numeric)
      row.destinationSortCode = Math.random() > 0.5 
        ? generateRandomString(5, '0123456789') 
        : generateRandomString(6, '0123456789ABC');
      break;
    case 'destinationAccountNumber':
      // Make account number invalid (not 8 digits or include non-numeric)
      row.destinationAccountNumber = Math.random() > 0.5
        ? generateRandomString(7, '0123456789')
        : generateRandomString(8, '0123456789XYZ');
      break;
    case 'paymentReference':
      // Make payment reference invalid (too short, starts with DDIC, all same chars)
      const invalidOptions = [
        'DDIC' + generateRandomString(5),
        ' ' + generateRandomString(5),
        'AAA'
      ];
      row.paymentReference = invalidOptions[Math.floor(Math.random() * invalidOptions.length)];
      break;
    case 'transactionCode':
      // Use an invalid transaction code
      row.transactionCode = '0X';
      break;    case 'payDate':
      if (row.payDate) {
        // Make an invalid date or weekend date
        row.payDate = '20250101'; // Past date
      }
      break;    case 'realtimeInformationChecksum':
      if (row.realtimeInformationChecksum) {
        // Make checksum invalid according to regex /^[/]{1}[A-Za-z0-9.&/\-, ]{3}$)|(^0{4}$)|(^$)/
        const invalidOptions = [
          '123', // No leading slash
          '/1234', // Too long
          '/12', // Too short
          '/$$%', // Invalid characters
          'ABCD',  // No slash, wrong length
          '0000X', // Wrong format for zeros
          '00000'  // Too many zeros
        ];
        row.realtimeInformationChecksum = invalidOptions[Math.floor(Math.random() * invalidOptions.length)];
      }
      break;
    case 'originatingSortCode':
      if (row.originatingSortCode) {
        // Make originating sort code invalid
        row.originatingSortCode = 'ABC123';
      }
      break;
    case 'originatingAccountNumber':
      if (row.originatingAccountNumber) {
        // Make originating account number invalid
        row.originatingAccountNumber = 'X1234567';
      }
      break;
    case 'originatingAccountName':
      if (row.originatingAccountName) {
        // Make originating account name invalid
        row.originatingAccountName = generateRandomString(25); // Too long
      }
      break;
    default:
      break;
  }
}

// Generate an invalid row by corrupting 1-3 fields (except amount)
export function generateInvalidRow(includeOptionalFields: boolean): RowData {
  const row = generateValidRow(includeOptionalFields);
  
  // Determine how many fields to make invalid (1-3)
  const numInvalidFields = Math.floor(Math.random() * 3) + 1;
  
  // Get all possible field names excluding 'amount'
  const possibleFields: (keyof RowData)[] = [
    'destinationAccountName',
    'destinationSortCode',
    'destinationAccountNumber',
    'paymentReference',
    'transactionCode'
  ];
  
  if (includeOptionalFields) {
    possibleFields.push(
      'realtimeInformationChecksum',
      'processingDate',
      'originatingSortCode',
      'originatingAccountNumber',
      'originatingAccountName'
    );
  }
  
  // Randomly select fields to make invalid
  const fieldsToInvalidate = new Set<keyof RowData>();
  while (fieldsToInvalidate.size < numInvalidFields) {
    const randomIndex = Math.floor(Math.random() * possibleFields.length);
    fieldsToInvalidate.add(possibleFields[randomIndex]);
  }
  
  // Invalidate selected fields
  fieldsToInvalidate.forEach(field => {
    makeFieldInvalid(row, field);
  });
  
  return row;
}