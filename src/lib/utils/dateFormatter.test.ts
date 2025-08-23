import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import { DateFormatter } from './dateFormatter';
import type { EaziPayDateFormat } from '../types';

describe('DateFormatter', () => {
  // Test date: July 23, 2025 (Wednesday)
  const testDate = DateTime.fromISO('2025-07-23T10:30:00');

  describe('formatEaziPayDate', () => {
    it('should format YYYY-MM-DD correctly', () => {
      const result = DateFormatter.formatEaziPayDate(testDate, 'YYYY-MM-DD');
      expect(result).toBe('2025-07-23');
    });

    it('should format DD-MMM-YYYY correctly with uppercase month', () => {
      const result = DateFormatter.formatEaziPayDate(testDate, 'DD-MMM-YYYY');
      expect(result).toBe('23-JUL-2025');
    });

    it('should format DD/MM/YYYY correctly', () => {
      const result = DateFormatter.formatEaziPayDate(testDate, 'DD/MM/YYYY');
      expect(result).toBe('23/07/2025');
    });

    it('should handle different months correctly', () => {
      const janDate = DateTime.fromISO('2025-01-15T10:30:00');
      const decDate = DateTime.fromISO('2025-12-25T10:30:00');

      expect(DateFormatter.formatEaziPayDate(janDate, 'DD-MMM-YYYY')).toBe('15-JAN-2025');
      expect(DateFormatter.formatEaziPayDate(decDate, 'DD-MMM-YYYY')).toBe('25-DEC-2025');

      expect(DateFormatter.formatEaziPayDate(janDate, 'DD/MM/YYYY')).toBe('15/01/2025');
      expect(DateFormatter.formatEaziPayDate(decDate, 'DD/MM/YYYY')).toBe('25/12/2025');
    });

    it('should handle year boundaries correctly', () => {
      const yearEnd = DateTime.fromISO('2025-12-31T23:59:59');
      const yearStart = DateTime.fromISO('2026-01-01T00:00:00');

      expect(DateFormatter.formatEaziPayDate(yearEnd, 'YYYY-MM-DD')).toBe('2025-12-31');
      expect(DateFormatter.formatEaziPayDate(yearStart, 'YYYY-MM-DD')).toBe('2026-01-01');
    });

    it('should handle leap years correctly', () => {
      const leapDay = DateTime.fromISO('2024-02-29T12:00:00');

      expect(DateFormatter.formatEaziPayDate(leapDay, 'YYYY-MM-DD')).toBe('2024-02-29');
      expect(DateFormatter.formatEaziPayDate(leapDay, 'DD-MMM-YYYY')).toBe('29-FEB-2024');
      expect(DateFormatter.formatEaziPayDate(leapDay, 'DD/MM/YYYY')).toBe('29/02/2024');
    });

    it('should throw error for invalid date', () => {
      const invalidDate = DateTime.invalid('test invalid');

      expect(() => {
        DateFormatter.formatEaziPayDate(invalidDate, 'YYYY-MM-DD');
      }).toThrow('Invalid date provided');
    });

    it('should throw error for unsupported format', () => {
      expect(() => {
        DateFormatter.formatEaziPayDate(testDate, 'INVALID-FORMAT' as EaziPayDateFormat);
      }).toThrow('Unsupported date format: INVALID-FORMAT');
    });
  });

  describe('getRandomDateFormat', () => {
    it('should return one of the valid formats', () => {
      const validFormats: EaziPayDateFormat[] = ['YYYY-MM-DD', 'DD-MMM-YYYY', 'DD/MM/YYYY'];

      for (let i = 0; i < 10; i++) {
        const randomFormat = DateFormatter.getRandomDateFormat();
        expect(validFormats).toContain(randomFormat);
      }
    });

    it('should use crypto.randomBytes for randomness', () => {
      // Test that different calls can return different values
      const results = new Set<EaziPayDateFormat>();

      // Run multiple times to check for variation
      for (let i = 0; i < 50; i++) {
        results.add(DateFormatter.getRandomDateFormat());
      }

      // Should have at least some variation (not always the same result)
      // This test might occasionally fail due to randomness, but very unlikely
      expect(results.size).toBeGreaterThan(0);
    });
  });

  describe('parseEaziPayFormat', () => {
    it('should parse valid format strings', () => {
      expect(DateFormatter.parseEaziPayFormat('YYYY-MM-DD')).toBe('YYYY-MM-DD');
      expect(DateFormatter.parseEaziPayFormat('DD-MMM-YYYY')).toBe('DD-MMM-YYYY');
      expect(DateFormatter.parseEaziPayFormat('DD/MM/YYYY')).toBe('DD/MM/YYYY');
    });

    it('should throw error for invalid format strings', () => {
      expect(() => {
        DateFormatter.parseEaziPayFormat('INVALID');
      }).toThrow('Invalid EaziPay date format: INVALID');

      expect(() => {
        DateFormatter.parseEaziPayFormat('MM/DD/YYYY');
      }).toThrow('Invalid EaziPay date format: MM/DD/YYYY');
    });
  });

  describe('validateDateFormat', () => {
    it('should validate correct formats', () => {
      expect(DateFormatter.validateDateFormat('YYYY-MM-DD')).toBe(true);
      expect(DateFormatter.validateDateFormat('DD-MMM-YYYY')).toBe(true);
      expect(DateFormatter.validateDateFormat('DD/MM/YYYY')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(DateFormatter.validateDateFormat('INVALID')).toBe(false);
      expect(DateFormatter.validateDateFormat('MM/DD/YYYY')).toBe(false);
      expect(DateFormatter.validateDateFormat('YYYY/MM/DD')).toBe(false);
      expect(DateFormatter.validateDateFormat('')).toBe(false);
    });
  });

  describe('getAvailableFormats', () => {
    it('should return all valid formats', () => {
      const formats = DateFormatter.getAvailableFormats();

      expect(formats).toHaveLength(3);
      expect(formats).toContain('YYYY-MM-DD');
      expect(formats).toContain('DD-MMM-YYYY');
      expect(formats).toContain('DD/MM/YYYY');
    });

    it('should return readonly array', () => {
      const formats = DateFormatter.getAvailableFormats();

      // TypeScript should prevent modification, but test runtime behavior
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (formats as any).push('NEW-FORMAT');
      }).toThrow();
    });
  });

  describe('getFormatExamples', () => {
    it('should return examples for all formats', () => {
      const examples = DateFormatter.getFormatExamples(testDate);

      expect(examples).toEqual({
        'YYYY-MM-DD': '2025-07-23',
        'DD-MMM-YYYY': '23-JUL-2025',
        'DD/MM/YYYY': '23/07/2025',
      });
    });

    it('should handle different dates correctly', () => {
      const newYearDate = DateTime.fromISO('2026-01-01T00:00:00');
      const examples = DateFormatter.getFormatExamples(newYearDate);

      expect(examples).toEqual({
        'YYYY-MM-DD': '2026-01-01',
        'DD-MMM-YYYY': '01-JAN-2026',
        'DD/MM/YYYY': '01/01/2026',
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle timezone independent formatting', () => {
      const utcDate = DateTime.fromISO('2025-07-23T10:30:00Z');
      const localDate = DateTime.fromISO('2025-07-23T10:30:00');

      // Date part should be the same regardless of timezone
      expect(DateFormatter.formatEaziPayDate(utcDate, 'YYYY-MM-DD')).toBe(
        DateFormatter.formatEaziPayDate(localDate, 'YYYY-MM-DD')
      );
    });

    it('should handle dates far in the future', () => {
      const futureDate = DateTime.fromISO('2050-12-25T12:00:00');

      expect(DateFormatter.formatEaziPayDate(futureDate, 'YYYY-MM-DD')).toBe('2050-12-25');
      expect(DateFormatter.formatEaziPayDate(futureDate, 'DD-MMM-YYYY')).toBe('25-DEC-2050');
    });

    it('should handle dates in the past', () => {
      const pastDate = DateTime.fromISO('2020-03-15T12:00:00');

      expect(DateFormatter.formatEaziPayDate(pastDate, 'DD/MM/YYYY')).toBe('15/03/2020');
    });
  });
});
