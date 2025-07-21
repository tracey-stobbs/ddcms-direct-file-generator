import { describe, it, expect } from 'vitest';
import { EaziPayValidator } from './eazipayValidator';
import type { EaziPayTrailerFormat } from '../types';

describe('EaziPayValidator', () => {
  describe('validateFixedZero', () => {
    it('should accept exactly 0', () => {
      expect(EaziPayValidator.validateFixedZero(0)).toBe(true);
    });

    it('should reject non-zero numbers', () => {
      expect(EaziPayValidator.validateFixedZero(1)).toBe(false);
      expect(EaziPayValidator.validateFixedZero(-1)).toBe(false);
      expect(EaziPayValidator.validateFixedZero(0.1)).toBe(false);
      expect(EaziPayValidator.validateFixedZero(100)).toBe(false);
    });

    it('should reject string "0"', () => {
      expect(EaziPayValidator.validateFixedZero('0')).toBe(false);
    });

    it('should reject null and undefined', () => {
      expect(EaziPayValidator.validateFixedZero(null)).toBe(false);
      expect(EaziPayValidator.validateFixedZero(undefined)).toBe(false);
    });

    it('should reject boolean false', () => {
      expect(EaziPayValidator.validateFixedZero(false)).toBe(false);
    });

    it('should reject objects and arrays', () => {
      expect(EaziPayValidator.validateFixedZero({})).toBe(false);
      expect(EaziPayValidator.validateFixedZero([])).toBe(false);
      expect(EaziPayValidator.validateFixedZero([0])).toBe(false);
    });
  });

  describe('validateEmptyField', () => {
    it('should accept exactly undefined', () => {
      expect(EaziPayValidator.validateEmptyField(undefined)).toBe(true);
    });

    it('should reject null', () => {
      expect(EaziPayValidator.validateEmptyField(null)).toBe(false);
    });

    it('should reject empty string', () => {
      expect(EaziPayValidator.validateEmptyField('')).toBe(false);
    });

    it('should reject whitespace strings', () => {
      expect(EaziPayValidator.validateEmptyField(' ')).toBe(false);
      expect(EaziPayValidator.validateEmptyField('\\t')).toBe(false);
      expect(EaziPayValidator.validateEmptyField('\\n')).toBe(false);
    });

    it('should reject numbers', () => {
      expect(EaziPayValidator.validateEmptyField(0)).toBe(false);
      expect(EaziPayValidator.validateEmptyField(1)).toBe(false);
    });

    it('should reject boolean values', () => {
      expect(EaziPayValidator.validateEmptyField(false)).toBe(false);
      expect(EaziPayValidator.validateEmptyField(true)).toBe(false);
    });

    it('should reject objects and arrays', () => {
      expect(EaziPayValidator.validateEmptyField({})).toBe(false);
      expect(EaziPayValidator.validateEmptyField([])).toBe(false);
    });
  });

  describe('validateSunNumber', () => {
    describe('with SUN-allowed transaction codes', () => {
      const allowedCodes = ['0C', '0N', '0S'];

      it('should allow SUN number to be present', () => {
        allowedCodes.forEach(code => {
          expect(EaziPayValidator.validateSunNumber('12345', code)).toBe(true);
          expect(EaziPayValidator.validateSunNumber('SUN123', code)).toBe(true);
        });
      });

      it('should allow SUN number to be null or undefined', () => {
        allowedCodes.forEach(code => {
          expect(EaziPayValidator.validateSunNumber(null, code)).toBe(true);
          expect(EaziPayValidator.validateSunNumber(undefined, code)).toBe(true);
        });
      });

      it('should allow empty string SUN number', () => {
        allowedCodes.forEach(code => {
          expect(EaziPayValidator.validateSunNumber('', code)).toBe(true);
        });
      });
    });

    describe('with non-SUN transaction codes', () => {
      const nonAllowedCodes = ['01', '17', '18', '99'];

      it('should require SUN number to be null or undefined', () => {
        nonAllowedCodes.forEach(code => {
          expect(EaziPayValidator.validateSunNumber(null, code)).toBe(true);
          expect(EaziPayValidator.validateSunNumber(undefined, code)).toBe(true);
        });
      });

      it('should reject present SUN number', () => {
        nonAllowedCodes.forEach(code => {
          expect(EaziPayValidator.validateSunNumber('12345', code)).toBe(false);
          expect(EaziPayValidator.validateSunNumber('SUN123', code)).toBe(false);
          expect(EaziPayValidator.validateSunNumber('', code)).toBe(false);
          expect(EaziPayValidator.validateSunNumber('0', code)).toBe(false);
        });
      });
    });

    describe('edge cases', () => {
      it('should handle case-sensitive transaction codes', () => {
        expect(EaziPayValidator.validateSunNumber('12345', '0c')).toBe(false); // lowercase
        expect(EaziPayValidator.validateSunNumber('12345', '0C')).toBe(true);  // uppercase
      });

      it('should handle unknown transaction codes', () => {
        expect(EaziPayValidator.validateSunNumber('12345', 'UNKNOWN')).toBe(false);
        expect(EaziPayValidator.validateSunNumber(null, 'UNKNOWN')).toBe(true);
      });
    });
  });

  describe('validateEaziPayTrailer', () => {
    it('should validate quoted trailer format', () => {
      const quotedTrailer = '",,,,,,,,"';
      expect(EaziPayValidator.validateEaziPayTrailer(quotedTrailer)).toBe('quoted');
    });

    it('should validate unquoted trailer format', () => {
      const unquotedTrailer = ',,,,,,,,,';
      expect(EaziPayValidator.validateEaziPayTrailer(unquotedTrailer)).toBe('unquoted');
    });

    it('should reject invalid trailer formats', () => {
      const invalidTrailers = [
        ',,,,,,,,',   // 8 commas instead of 9
        ',,,,,,,,,,', // 10 commas instead of 9
        '",,,,,,,,',  // Missing closing quote
        ',,,,,,,,"',  // Missing opening quote
        '","',        // Wrong content
        '',           // Empty string
        'invalid',    // Random string
        '",,,,,,,,,,"' // Too many commas in quotes
      ];

      invalidTrailers.forEach(trailer => {
        expect(() => {
          EaziPayValidator.validateEaziPayTrailer(trailer);
        }).toThrow(`Invalid EaziPayTrailer format`);
      });
    });
  });

  describe('generateValidTrailer', () => {
    it('should generate quoted trailer', () => {
      const trailer = EaziPayValidator.generateValidTrailer('quoted');
      expect(trailer).toBe('",,,,,,,,"');
      expect(EaziPayValidator.validateEaziPayTrailer(trailer)).toBe('quoted');
    });

    it('should generate unquoted trailer', () => {
      const trailer = EaziPayValidator.generateValidTrailer('unquoted');
      expect(trailer).toBe(',,,,,,,,,');
      expect(EaziPayValidator.validateEaziPayTrailer(trailer)).toBe('unquoted');
    });

    it('should throw error for unknown format', () => {
      expect(() => {
        EaziPayValidator.generateValidTrailer('invalid' as EaziPayTrailerFormat);
      }).toThrow('Unknown trailer format: invalid');
    });
  });

  describe('getColumnCount', () => {
    it('should return 15 for quoted format', () => {
      expect(EaziPayValidator.getColumnCount('quoted')).toBe(15);
    });

    it('should return 23 for unquoted format', () => {
      expect(EaziPayValidator.getColumnCount('unquoted')).toBe(23);
    });

    it('should throw error for unknown format', () => {
      expect(() => {
        EaziPayValidator.getColumnCount('invalid' as EaziPayTrailerFormat);
      }).toThrow('Unknown trailer format: invalid');
    });
  });

  describe('isSunNumberAllowed', () => {
    it('should return true for allowed transaction codes', () => {
      expect(EaziPayValidator.isSunNumberAllowed('0C')).toBe(true);
      expect(EaziPayValidator.isSunNumberAllowed('0N')).toBe(true);
      expect(EaziPayValidator.isSunNumberAllowed('0S')).toBe(true);
    });

    it('should return false for non-allowed transaction codes', () => {
      expect(EaziPayValidator.isSunNumberAllowed('01')).toBe(false);
      expect(EaziPayValidator.isSunNumberAllowed('17')).toBe(false);
      expect(EaziPayValidator.isSunNumberAllowed('18')).toBe(false);
      expect(EaziPayValidator.isSunNumberAllowed('99')).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(EaziPayValidator.isSunNumberAllowed('0c')).toBe(false);
      expect(EaziPayValidator.isSunNumberAllowed('0n')).toBe(false);
      expect(EaziPayValidator.isSunNumberAllowed('0s')).toBe(false);
    });
  });

  describe('getSunAllowedTransactionCodes', () => {
    it('should return all allowed codes', () => {
      const codes = EaziPayValidator.getSunAllowedTransactionCodes();
      expect(codes).toEqual(['0C', '0N', '0S']);
    });

    it('should return immutable array', () => {
      const codes = EaziPayValidator.getSunAllowedTransactionCodes();
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (codes as any).push('NEW');
      }).toThrow();
    });
  });

  describe('validateAllFields', () => {
    const validFields = {
      fixedZero: 0,
      empty: undefined,
      sunNumber: undefined,
      transactionCode: '17',
      eaziPayTrailer: '",,,,,,,,"'
    };

    it('should validate all valid fields', () => {
      const result = EaziPayValidator.validateAllFields(validFields);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should catch fixed zero errors', () => {
      const result = EaziPayValidator.validateAllFields({
        ...validFields,
        fixedZero: 1
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Fixed Zero must be exactly 0, got: 1');
    });

    it('should catch empty field errors', () => {
      const result = EaziPayValidator.validateAllFields({
        ...validFields,
        empty: null
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Empty field must be undefined, got: null');
    });

    it('should catch SUN number errors', () => {
      const result = EaziPayValidator.validateAllFields({
        ...validFields,
        sunNumber: '12345',
        transactionCode: '17' // Not allowed
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('SUN Number invalid for transaction code 17. Must be null/undefined for codes other than 0C, 0N, 0S');
    });

    it('should catch trailer errors', () => {
      const result = EaziPayValidator.validateAllFields({
        ...validFields,
        eaziPayTrailer: 'invalid'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Invalid EaziPayTrailer format'))).toBe(true);
    });

    it('should catch multiple errors', () => {
      const result = EaziPayValidator.validateAllFields({
        fixedZero: 1,
        empty: null,
        sunNumber: '12345',
        transactionCode: '17',
        eaziPayTrailer: 'invalid'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(4);
    });

    it('should validate fields with SUN number allowed', () => {
      const result = EaziPayValidator.validateAllFields({
        ...validFields,
        sunNumber: '12345',
        transactionCode: '0C'
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
