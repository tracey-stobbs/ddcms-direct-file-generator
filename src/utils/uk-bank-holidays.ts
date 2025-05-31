/**
 * UK bank holidays utility
 * 
 * This file contains utility functions for handling UK bank holidays
 */

// UK bank holidays for 2025-2026 (add more as needed)
const UK_BANK_HOLIDAYS: string[] = [
  // 2025 holidays
  '20250101', // New Year's Day
  '20250418', // Good Friday
  '20250421', // Easter Monday
  '20250505', // Early May Bank Holiday
  '20250526', // Spring Bank Holiday
  '20250825', // Summer Bank Holiday
  '20251225', // Christmas Day
  '20251226', // Boxing Day
  
  // 2026 holidays (add when available)
  '20260101', // New Year's Day
];

/**
 * Checks if a date is a UK bank holiday
 * 
 * @param dateString - Date string in format YYYYMMDD
 * @returns boolean - true if date is a UK bank holiday
 */
export function isUKBankHoliday(dateString: string): boolean {
  return UK_BANK_HOLIDAYS.includes(dateString);
}

/**
 * Checks if a date is a weekend (Saturday or Sunday)
 * 
 * @param dateString - Date string in format YYYYMMDD
 * @returns boolean - true if date is a weekend
 */
export function isWeekend(dateString: string): boolean {
  // Parse the dateString to a Date object
  const year = parseInt(dateString.substring(0, 4));
  const month = parseInt(dateString.substring(4, 6)) - 1; // Month is 0-indexed in JS
  const day = parseInt(dateString.substring(6, 8));
  
  const date = new Date(year, month, day);
  const dayOfWeek = date.getDay();
  
  // 0 is Sunday, 6 is Saturday
  return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * Checks if a date is a business day (not a weekend or UK bank holiday)
 * 
 * @param dateString - Date string in format YYYYMMDD
 * @returns boolean - true if date is a business day
 */
export function isBusinessDay(dateString: string): boolean {
  return !isWeekend(dateString) && !isUKBankHoliday(dateString);
}