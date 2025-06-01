/**
 * Tests for the data generation service
 */
import { describe, it, expect, vi } from 'vitest';
import { DateTime } from 'luxon';
import { 
  generateAccountName, 
  generateSortCode,
  generateAccount, 
  generatePaymentReference,
  generateAmount,
  generateTransactionCode,
  generateChecksum,
  generatePayDate
} from './dataGenerationService';

describe('Data Generation Service', () => {
  describe('generateAccountName', () => {
    it('should generate valid account name by default', () => {
      const name = generateAccountName();
      expect(name.length).toBeLessThanOrEqual(18);
    });

    it('should generate invalid account name when forced', () => {
      const name = generateAccountName(true);
      // Test will pass if any of the validation rules are broken
      const isInvalid = name.length > 18;
      expect(isInvalid).toBeTruthy();
    });
  });

  describe('generateSortCode', () => {
    it('should generate valid sort code by default', () => {
      const sortCode = generateSortCode();
      expect(sortCode).toMatch(/^\d{6}$/);
    });

    it('should generate invalid sort code when forced', () => {
      const sortCode = generateSortCode(true);
      // Test will pass if any of the validation rules are broken
      const isInvalid = !/^\d{6}$/.test(sortCode);
      expect(isInvalid).toBeTruthy();
    });
  });

  describe('generateAccount', () => {
    it('should generate valid account number by default', () => {
      const account = generateAccount();
      expect(account).toMatch(/^\d{8}$/);
    });

    it('should generate invalid account number when forced', () => {
      const account = generateAccount(true);
      // Test will pass if any of the validation rules are broken
      const isInvalid = !/^\d{8}$/.test(account);
      expect(isInvalid).toBeTruthy();
    });
  });
  describe('generatePaymentReference', () => {
    it('should generate valid payment reference by default', () => {
      const ref = generatePaymentReference();
      expect(ref.length).toBeGreaterThan(6);
      expect(ref.length).toBeLessThan(18);
      expect(ref).not.toMatch(/^DDIC/);
      expect(ref).not.toMatch(/^ /);
      // Ensure not all characters are the same
      const uniqueChars = new Set(ref.split(''));
      expect(uniqueChars.size).toBeGreaterThan(1);
      // Ensure it starts with a word character
      expect(ref).toMatch(/^[A-Za-z0-9]/);
    });

    it('should generate invalid payment reference when forced', () => {
      const ref = generatePaymentReference(true);
      // Test will pass if any of the validation rules are broken
      const isInvalid = 
        ref.length <= 6 || 
        ref.length >= 18 || 
        /^DDIC/.test(ref) || 
        /^ /.test(ref) || 
        new Set(ref.split('')).size === 1 ||
        !/^[A-Za-z0-9]/.test(ref);
        
      expect(isInvalid).toBeTruthy();
    });
  });

  describe('generateAmount', () => {
    it('should generate zero amount for special transaction codes', () => {
      const amount = generateAmount('0C');
      expect(amount).toBe('0.00');
    });

    it('should generate non-zero amount for normal transaction codes', () => {
      const amount = generateAmount('01');
      expect(amount).not.toBe('0.00');
      // Should be a number with no separator characters
      expect(amount).toMatch(/^\d+$/);
    });

    it('should generate invalid amount when forced', () => {
      const amount = generateAmount('01', true);
      // Test will pass if any of the validation rules are broken
      // For normal transaction codes, having separator characters is invalid
      expect(amount).toMatch(/[.,]/);
    });
  });

  describe('generateTransactionCode', () => {
    it('should generate valid transaction code by default', () => {
      const code = generateTransactionCode();
      const validCodes = ['01', '17', '18', '99', '0C', '0N', '0S'];
      expect(validCodes).toContain(code);
    });

    it('should generate invalid transaction code when forced', () => {
      const code = generateTransactionCode(true);
      const validCodes = ['01', '17', '18', '99', '0C', '0N', '0S'];
      expect(validCodes).not.toContain(code);
    });
  });

  describe('generateChecksum', () => {    it('should generate valid checksum by default', () => {
      const checksum = generateChecksum();
      const isValid = 
        checksum === '' || 
        checksum === '0000' || 
        /^\/[A-Z0-9]{3}$/.test(checksum);
      expect(isValid).toBeTruthy();
    });
    
    it('should generate invalid checksum when forced', () => {
      const checksum = generateChecksum(true);
      // Check that the result is one of our expected invalid formats
      const invalidFormats = ['/XX', '/XXXX', '000', '00000', 'ABC123'];
      expect(invalidFormats).toContain(checksum);
    });
  });
  describe('generatePayDate', () => {
    it('should generate valid pay date by default', () => {
      // Save the real implementation of DateTime.now
      const realNow = DateTime.now;
      
      try {
        // Mock DateTime.now to return a fixed date
        const mockDate = new Date('2025-06-01T12:00:00.000Z');
        DateTime.now = vi.fn().mockReturnValue(DateTime.fromJSDate(mockDate));
        
        const date = generatePayDate();
        // Should match YYYYMMDD format
        expect(date).toMatch(/^20\d{6}$/);
        
        // Convert to Date for validation
        const year = parseInt(date.substring(0, 4));
        const month = parseInt(date.substring(4, 6)) - 1; // JS months are 0-indexed
        const day = parseInt(date.substring(6, 8));
        const payDate = new Date(year, month, day);
        
        // At least 2 days in the future from our mock date
        const twoDaysFromMock = new Date('2025-06-03T12:00:00.000Z');
        expect(payDate.getTime()).toBeGreaterThanOrEqual(twoDaysFromMock.getTime() - 86400000); // Allow 1 day tolerance
        
        // No more than 30 days in the future from our mock date
        const thirtyDaysFromMock = new Date('2025-07-01T12:00:00.000Z');
        expect(payDate.getTime()).toBeLessThanOrEqual(thirtyDaysFromMock.getTime());
        
        // Not a weekend
        const dayOfWeek = payDate.getDay();
        expect(dayOfWeek).not.toBe(0); // Not Sunday
        expect(dayOfWeek).not.toBe(6); // Not Saturday
      } finally {
        // Restore the real implementation
        DateTime.now = realNow;
      }
    });

    it('should generate invalid pay date when forced', () => {
      const date = generatePayDate(true);
      
      // If it's not in YYYYMMDD format, it's invalid
      if (!/^20\d{6}$/.test(date)) {
        expect(true).toBeTruthy(); // Test passes
        return;
      }
      
      // If it's in the right format, check if it violates other rules
      const year = parseInt(date.substring(0, 4));
      const month = parseInt(date.substring(4, 6)) - 1;
      const day = parseInt(date.substring(6, 8));
      const payDate = new Date(year, month, day);
      const now = new Date();
      
      const twoDaysFromNow = new Date();
      twoDaysFromNow.setDate(now.getDate() + 2);
      
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);
      
      const isInvalid = 
        payDate.getTime() < twoDaysFromNow.getTime() || // Too soon
        payDate.getTime() > thirtyDaysFromNow.getTime(); // Too far
        
      expect(isInvalid).toBeTruthy();
    });
  });
});
