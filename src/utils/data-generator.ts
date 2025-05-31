/**
 * Data generation utilities
 */
import { ALLOWED_CHARACTERS, TRANSACTION_CODES, ZERO_AMOUNT_TRANSACTION_CODES } from './constants';
import { isBusinessDay } from './uk-bank-holidays';

/**
 * Generates a random string of given length with allowed characters
 * 
 * @param length - Length of string to generate
 * @returns Random string of specified length
 */
export function generateRandomString(length: number): string {
  let result = '';
  const charactersLength = ALLOWED_CHARACTERS.length;
  
  for (let i = 0; i < length; i++) {
    result += ALLOWED_CHARACTERS.charAt(Math.floor(Math.random() * charactersLength));
  }
  
  return result;
}

/**
 * Generates a random numeric string of specified length
 * 
 * @param length - Length of numeric string
 * @returns Random numeric string
 */
export function generateRandomNumericString(length: number): string {
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  
  return result;
}

/**
 * Generates a random decimal amount
 * 
 * @param min - Minimum amount
 * @param max - Maximum amount
 * @param transactionCode - Optional transaction code to check for zero amount condition
 * @returns Random decimal amount as string
 */
export function generateRandomAmount(min: number, max: number, transactionCode?: string): string {
  // If transaction code requires a zero amount
  if (transactionCode && ZERO_AMOUNT_TRANSACTION_CODES.includes(transactionCode)) {
    return '0.00';
  }
  
  const randomAmount = Math.random() * (max - min) + min;
  return randomAmount.toFixed(2);
}

/**
 * Generates a random transaction code
 * 
 * @returns Random transaction code
 */
export function generateRandomTransactionCode(): string {
  const randomIndex = Math.floor(Math.random() * TRANSACTION_CODES.length);
  return TRANSACTION_CODES[randomIndex];
}

/**
 * Generates a valid future business date in YYYYMMDD format
 * 
 * @returns Valid future business date
 */
export function generateValidFutureBusinessDate(): string {
  const today = new Date();
  const futureDate = new Date();
  
  // Add minimum 2 days, maximum 30 days
  const daysToAdd = Math.floor(Math.random() * 29) + 2;
  futureDate.setDate(today.getDate() + daysToAdd);
  
  // Format as YYYYMMDD
  const dateString = formatDateYYYYMMDD(futureDate);
  
  // Check if it's a business day, if not, recursively try again
  if (!isBusinessDay(dateString)) {
    return generateValidFutureBusinessDate();
  }
  
  return dateString;
}

/**
 * Format date as YYYYMMDD
 * 
 * @param date - Date object to format
 * @returns Date formatted as YYYYMMDD string
 */
export function formatDateYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}${month}${day}`;
}

/**
 * Generates a random RealTime Information Checksum
 * 
 * @returns Random RTI checksum string
 */
export function generateRandomRTIChecksum(): string {
  const patterns = [
    // Forward slash + 3 allowed characters
    () => '/' + generateRandomString(3),
    // 4 zeros
    () => '0000',
    // Empty string
    () => '',
  ];
  
  const randomPattern = Math.floor(Math.random() * patterns.length);
  return patterns[randomPattern]();
}
