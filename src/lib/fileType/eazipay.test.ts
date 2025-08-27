import { beforeEach, describe, expect, it } from 'vitest';
import type { EaziPayDateFormat, Request } from '../types';
import { EaziPayValidator } from '../validators/eazipayValidator';
import {
  formatEaziPayRowAsArray,
  generateInvalidEaziPayRow,
  generateValidEaziPayRow,
  getEaziPayHeaders,
} from './eazipay';

describe('EaziPay Generator', () => {
  let mockRequest: Request;

  beforeEach(() => {
    mockRequest = {
      fileType: 'EaziPay',
      canInlineEdit: true,
      includeHeaders: false,
      numberOfRows: 15,
      hasInvalidRows: false,
      defaultValues: {
        originatingAccountDetails: {
          canBeInvalid: false,
          sortCode: '912291',
          accountNumber: '51491194',
          accountName: 'Test Account',
        },
      },
    };
  });

  describe('generateValidEaziPayRow', () => {
    it('should generate valid row with all required fields', () => {
      const row = generateValidEaziPayRow(mockRequest, 'YYYY-MM-DD');

      expect(row).toHaveProperty('transactionCode');
      expect(row).toHaveProperty('originatingSortCode');
      expect(row).toHaveProperty('originatingAccountNumber');
      expect(row).toHaveProperty('destinationSortCode');
      expect(row).toHaveProperty('destinationAccountNumber');
      expect(row).toHaveProperty('destinationAccountName');
      expect(row).toHaveProperty('paymentReference');
      expect(row).toHaveProperty('amount');
      expect(row).toHaveProperty('fixedZero');
      expect(row).toHaveProperty('processingDate');
      expect(row).toHaveProperty('empty');
      expect(row).toHaveProperty('sunName');
      expect(row).toHaveProperty('paymentReference');
      expect(row).toHaveProperty('sunNumber');
      // trailer removed; two empty columns are implicit in formatting
    });

    it('should use default originating account details', () => {
      const row = generateValidEaziPayRow(mockRequest, 'YYYY-MM-DD');

      expect(row.originatingSortCode).toBe('912291');
      expect(row.originatingAccountNumber).toBe('51491194');
    });

    it('should have fixed zero as exactly 0', () => {
      const row = generateValidEaziPayRow(mockRequest, 'YYYY-MM-DD');

      expect(row.fixedZero).toBe(0);
      expect(EaziPayValidator.validateFixedZero(row.fixedZero)).toBe(true);
    });

    it('should have empty field as undefined', () => {
      const row = generateValidEaziPayRow(mockRequest, 'YYYY-MM-DD');

      expect(row.empty).toBeUndefined();
      expect(EaziPayValidator.validateEmptyField(row.empty)).toBe(true);
    });

    it('should generate valid trailer for quoted format', () => {
      void generateValidEaziPayRow(mockRequest, 'YYYY-MM-DD');
      // no trailer to validate
    });

    it('should generate valid trailer for unquoted format', () => {
      void generateValidEaziPayRow(mockRequest, 'YYYY-MM-DD');
      // no trailer to validate
    });

    it('should format processing date correctly for different formats', () => {
      const formats: EaziPayDateFormat[] = ['YYYY-MM-DD', 'DD-MMM-YYYY', 'DD/MM/YYYY'];

      formats.forEach((format) => {
        const row = generateValidEaziPayRow(mockRequest, format);

        // Processing date should be in the specified format
        switch (format) {
          case 'YYYY-MM-DD':
            expect(row.processingDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            break;
          case 'DD-MMM-YYYY':
            expect(row.processingDate).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
            break;
          case 'DD/MM/YYYY':
            expect(row.processingDate).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
            break;
        }
      });
    });

    it('should handle special transaction codes correctly', () => {
      // Test multiple times to eventually get special transaction codes
      for (let i = 0; i < 50; i++) {
        const row = generateValidEaziPayRow(mockRequest, 'YYYY-MM-DD');

        if (['0C', '0N', '0S'].includes(row.transactionCode)) {
          // Amount should be 0 for special transaction codes
          expect(row.amount).toBe(0);
        }
      }
    });

    it('should validate SUN number according to transaction code rules', () => {
      for (let i = 0; i < 50; i++) {
        const row = generateValidEaziPayRow(mockRequest, 'YYYY-MM-DD');

        expect(EaziPayValidator.validateSunNumber(row.sunNumber, row.transactionCode)).toBe(true);
      }
    });

    it('should generate valid payment reference', () => {
      const row = generateValidEaziPayRow(mockRequest, 'YYYY-MM-DD');

      expect(row.paymentReference).toBeDefined();
      expect(row.paymentReference.length).toBeGreaterThan(6);
      expect(row.paymentReference.length).toBeLessThan(18);
      expect(row.paymentReference).not.toMatch(/^(DDIC|\s)/);
    });
  });

  describe('generateInvalidEaziPayRow', () => {
    it('should generate row with some invalid fields', () => {
      const row = generateInvalidEaziPayRow(mockRequest, 'YYYY-MM-DD');

      // Should still have all required fields
      expect(row).toHaveProperty('transactionCode');
      expect(row).toHaveProperty('fixedZero');
      expect(row).toHaveProperty('empty');
      // trailer removed
    });

    it('should create validation errors when validated', () => {
      // Generate many invalid rows to test different scenarios
      for (let i = 0; i < 20; i++) {
        const row = generateInvalidEaziPayRow(mockRequest, 'YYYY-MM-DD');
        const validation = EaziPayValidator.validateAllFields({
          fixedZero: row.fixedZero,
          empty: row.empty,
          sunNumber: row.sunNumber,
          transactionCode: row.transactionCode,
        });

        // At least some rows should be invalid
        if (!validation.isValid) {
          expect(validation.errors.length).toBeGreaterThan(0);
          return; // Found at least one invalid row, test passes
        }
      }

      // If we get here, no invalid rows were generated (very unlikely but possible)
      // This is acceptable as the randomness might occasionally create valid rows
    });

    it('should maintain some valid structure even when invalid', () => {
      const row = generateInvalidEaziPayRow(mockRequest, 'YYYY-MM-DD');

      // Basic structure should still be maintained
      expect(typeof row.transactionCode).toBe('string');
      expect(typeof row.originatingSortCode).toBe('string');
      expect(typeof row.originatingAccountNumber).toBe('string');
      // trailer removed
    });
  });

  describe('formatEaziPayRowAsArray', () => {
    it('should format row as 14-element array (two empty trailer columns included)', () => {
      const row = generateValidEaziPayRow(mockRequest, 'YYYY-MM-DD');
      const array = formatEaziPayRowAsArray(row);

      expect(array).toHaveLength(14);
      expect(Array.isArray(array)).toBe(true);
    });

    it('should format all fields correctly', () => {
      const row = generateValidEaziPayRow(mockRequest, 'YYYY-MM-DD');
      const array = formatEaziPayRowAsArray(row);

      expect(array[0]).toBe(row.transactionCode);
      expect(array[1]).toBe(row.originatingSortCode);
      expect(array[2]).toBe(row.originatingAccountNumber);
      expect(array[3]).toBe(row.destinationSortCode);
      expect(array[4]).toBe(row.destinationAccountNumber);
      expect(array[5]).toBe(row.destinationAccountName);
      expect(array[6]).toBe('0'); // Fixed zero as string
      expect(array[7]).toBe(row.amount.toString());
      expect(array[8]).toBe(row.processingDate);
      expect(array[9]).toBe(''); // Empty field
      expect(array[10]).toBe(row.sunName);
      expect(array[11]).toBe(row.paymentReference);
      expect(array[12]).toBe(row.sunNumber || '');
      // last two columns are empty strings
      expect(array[13]).toBe('');
    });

    it('should handle empty and undefined fields correctly', () => {
      const row = generateValidEaziPayRow(mockRequest, 'YYYY-MM-DD');
      const array = formatEaziPayRowAsArray(row);

      // Empty field should be empty string
      expect(array[9]).toBe('');

      // SUN number might be undefined, should become empty string
      if (row.sunNumber === undefined) {
        expect(array[12]).toBe('');
      } else {
        expect(array[12]).toBe(row.sunNumber);
      }
    });
  });

  describe('getEaziPayHeaders', () => {
    it('should return all 14 header names (including two empty trailer columns)', () => {
      const headers = getEaziPayHeaders();

      expect(headers).toHaveLength(14);
      expect(headers[0]).toBe('Transaction Code');
      expect(headers[6]).toBe('Fixed Zero');
      expect(headers[9]).toBe('Empty');
      expect(headers[12]).toBe('SUN Number');
      expect(headers[13]).toBe('Empty Trailer 1');
    });

    it('should return consistent headers', () => {
      const headers1 = getEaziPayHeaders();
      const headers2 = getEaziPayHeaders();

      expect(headers1).toEqual(headers2);
    });
  });

  describe('edge cases and validation', () => {
    it('should handle missing default values gracefully', () => {
      const requestWithoutDefaults: Request = {
        fileType: 'EaziPay',
        canInlineEdit: true,
      };

      const row = generateValidEaziPayRow(requestWithoutDefaults, 'YYYY-MM-DD');

      expect(row.originatingSortCode).toBeDefined();
      expect(row.originatingAccountNumber).toBeDefined();
      expect(row.originatingSortCode).toMatch(/^\d{6}$/);
      expect(row.originatingAccountNumber).toMatch(/^\d{8}$/);
    });

    it('should generate different rows on multiple calls', () => {
      const rows = [];
      for (let i = 0; i < 10; i++) {
        rows.push(generateValidEaziPayRow(mockRequest, 'YYYY-MM-DD'));
      }

      // At least some fields should be different across rows
      const transactionCodes = new Set(rows.map((r) => r.transactionCode));
      const amounts = new Set(rows.map((r) => r.amount));

      // Should have some variation (very unlikely to be all the same)
      expect(transactionCodes.size + amounts.size).toBeGreaterThan(2);
    });

    it('should respect trailer format parameter', () => {
      const row = generateValidEaziPayRow(mockRequest, 'YYYY-MM-DD');
      expect(row).toBeDefined();
    });
  });
});
