import { DateTime } from 'luxon';
import { randomBytes } from 'crypto';
import type { EaziPayDateFormat } from '../types';

/**
 * Date formatter for EaziPay-specific date formats
 * Handles multiple date format options with consistent formatting across files
 */
export class DateFormatter {
  private static readonly VALID_FORMATS: EaziPayDateFormat[] = [
    'YYYY-MM-DD',
    'DD-MMM-YYYY',
    'DD/MM/YYYY',
  ];

  /**
   * Format a Luxon DateTime to EaziPay-specific format
   * @param date - The DateTime to format
   * @param format - The target format
   * @returns Formatted date string
   */
  static formatEaziPayDate(date: DateTime, format: EaziPayDateFormat): string {
    if (!date.isValid) {
      throw new Error(`Invalid date provided: ${date.invalidReason}`);
    }

    switch (format) {
      case 'YYYY-MM-DD':
        return date.toFormat('yyyy-MM-dd');

      case 'DD-MMM-YYYY':
        // Use uppercase month abbreviation
        return date.toFormat('dd-MMM-yyyy').toUpperCase();

      case 'DD/MM/YYYY':
        return date.toFormat('dd/MM/yyyy');

      default:
        throw new Error(`Unsupported date format: ${format}`);
    }
  }

  /**
   * Get a random date format using crypto.randomBytes for true randomness
   * @returns Random EaziPayDateFormat
   */
  static getRandomDateFormat(): EaziPayDateFormat {
    const randomValue = randomBytes(1)[0];
    const index = randomValue % this.VALID_FORMATS.length;
    return this.VALID_FORMATS[index];
  }

  /**
   * Parse and validate a date format string
   * @param formatString - The format string to parse
   * @returns Valid EaziPayDateFormat
   * @throws Error if format is invalid
   */
  static parseEaziPayFormat(formatString: string): EaziPayDateFormat {
    if (!this.validateDateFormat(formatString)) {
      throw new Error(`Invalid EaziPay date format: ${formatString}`);
    }
    return formatString as EaziPayDateFormat;
  }

  /**
   * Validate if a format string is a valid EaziPayDateFormat
   * @param format - The format string to validate
   * @returns True if valid, false otherwise
   */
  static validateDateFormat(format: string): format is EaziPayDateFormat {
    return this.VALID_FORMATS.includes(format as EaziPayDateFormat);
  }

  /**
   * Get all available date formats
   * @returns Array of all valid formats
   */
  static getAvailableFormats(): readonly EaziPayDateFormat[] {
    return Object.freeze([...this.VALID_FORMATS]);
  }

  /**
   * Format example showing all formats for a given date
   * @param date - The date to show examples for
   * @returns Object with all format examples
   */
  static getFormatExamples(date: DateTime): Record<EaziPayDateFormat, string> {
    return {
      'YYYY-MM-DD': this.formatEaziPayDate(date, 'YYYY-MM-DD'),
      'DD-MMM-YYYY': this.formatEaziPayDate(date, 'DD-MMM-YYYY'),
      'DD/MM/YYYY': this.formatEaziPayDate(date, 'DD/MM/YYYY'),
    };
  }
}
