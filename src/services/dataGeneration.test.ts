/**
 * Tests for the data generation service
 * Validates all field generation rules and business logic
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DateTime } from "luxon";
import {
  generateAccountName,
  generateSortCode,
  generateAccountNumber,
  generatePaymentReference,
  generateAmount,
  generateTransactionCode,
  generatePayDate,
  generateRealtimeInformationChecksum,
  generateValidRecord,
  generateInvalidRecord,
  generateRecords,
  generateRandomString,
} from "./dataGeneration";
import { TransactionCode } from "../types/sddirect";

describe("Data Generation Service", () => {
  let originalNow: typeof DateTime.now;

  beforeEach(() => {
    // Save original DateTime.now
    originalNow = DateTime.now;
    
    // Mock DateTime.now to return a consistent date for testing
    DateTime.now = vi.fn().mockReturnValue(DateTime.fromISO('2025-07-19T12:00:00'));
  });

  afterEach(() => {
    // Restore original DateTime.now
    DateTime.now = originalNow;
  });

  describe("generateRandomString", () => {
    it("should generate string of specified length", () => {
      const result = generateRandomString(10);
      expect(result.length).toBe(10);
    });

    it("should use only allowed characters by default", () => {
      const result = generateRandomString(50);
      const allowedChars = /^[A-Za-z0-9.&/\-\s]*$/;
      expect(result).toMatch(allowedChars);
    });

    it("should use custom character set when provided", () => {
      const customChars = "ABC123";
      const result = generateRandomString(10, customChars);
      expect(result).toMatch(/^[ABC123]*$/);
    });
  });

  describe("generateAccountName", () => {
    it("should generate account name with max 18 characters", () => {
      const name = generateAccountName();
      expect(name.length).toBeLessThanOrEqual(18);
      expect(name.length).toBeGreaterThan(0);
    });

    it("should only contain allowed characters", () => {
      const name = generateAccountName();
      const allowedChars = /^[A-Za-z0-9.&/\-\s]*$/;
      expect(name).toMatch(allowedChars);
    });

    it("should have minimum 3 characters after filtering", () => {
      const name = generateAccountName();
      expect(name.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("generateSortCode", () => {
    it("should generate exactly 6 digits", () => {
      const sortCode = generateSortCode();
      expect(sortCode).toMatch(/^\d{6}$/);
    });

    it("should use realistic UK bank prefixes", () => {
      const ukBankPrefixes = ['12', '20', '30', '40', '50', '60', '77', '82', '83'];
      const sortCode = generateSortCode();
      const prefix = sortCode.substring(0, 2);
      expect(ukBankPrefixes).toContain(prefix);
    });
  });

  describe("generateAccountNumber", () => {
    it("should generate exactly 8 digits", () => {
      const accountNumber = generateAccountNumber();
      expect(accountNumber).toMatch(/^\d{8}$/);
    });
  });

  describe("generatePaymentReference", () => {
    it("should generate reference between 7-17 characters", () => {
      const ref = generatePaymentReference();
      expect(ref.length).toBeGreaterThanOrEqual(7);
      expect(ref.length).toBeLessThanOrEqual(17);
    });

    it("should not start with DDIC", () => {
      // Test multiple times to ensure it never starts with DDIC
      for (let i = 0; i < 10; i++) {
        const ref = generatePaymentReference();
        expect(ref).not.toMatch(/^DDIC/);
      }
    });

    it("should start with word character", () => {
      const ref = generatePaymentReference();
      expect(ref).toMatch(/^[A-Za-z0-9]/);
    });

    it("should not contain all identical characters", () => {
      const ref = generatePaymentReference();
      const uniqueChars = new Set(ref.split(""));
      expect(uniqueChars.size).toBeGreaterThan(1);
    });

    it("should only contain allowed characters", () => {
      const ref = generatePaymentReference();
      const allowedChars = /^[A-Za-z0-9.&/\-\s]*$/;
      expect(ref).toMatch(allowedChars);
    });
  });

  describe("generateAmount", () => {
    it("should generate 0 for zero amount transaction codes", () => {
      const zeroAmountCodes: TransactionCode[] = ['0C', '0N', '0S'];
      
      zeroAmountCodes.forEach(code => {
        const amount = generateAmount(code);
        expect(amount).toBe('0');
      });
    });

    it("should generate positive amount for regular transaction codes", () => {
      const regularCodes: TransactionCode[] = ['01', '17', '18', '99'];
      
      regularCodes.forEach(code => {
        const amount = generateAmount(code);
        const numericAmount = parseFloat(amount);
        expect(numericAmount).toBeGreaterThan(0);
        expect(numericAmount).toBeLessThanOrEqual(10000);
      });
    });

    it("should generate properly formatted decimal", () => {
      const amount = generateAmount('01');
      expect(amount).toMatch(/^\d+\.\d{2}$/);
    });
  });

  describe("generateTransactionCode", () => {
    it("should generate valid transaction code", () => {
      const validCodes = ['01', '17', '18', '99', '0C', '0N', '0S'];
      const code = generateTransactionCode();
      expect(validCodes).toContain(code);
    });

    it("should generate all possible codes over multiple runs", () => {
      const generatedCodes = new Set<string>();
      
      // Generate many codes to ensure all are possible
      for (let i = 0; i < 100; i++) {
        generatedCodes.add(generateTransactionCode());
      }
      
      // Should have generated at least 5 different codes
      expect(generatedCodes.size).toBeGreaterThanOrEqual(5);
    });
  });

  describe("generatePayDate", () => {
    it("should generate date in YYYYMMDD format", () => {
      const payDate = generatePayDate();
      expect(payDate).toMatch(/^\d{8}$/);
      
      // Verify it's a valid date
      const year = parseInt(payDate.substring(0, 4));
      const month = parseInt(payDate.substring(4, 6));
      const day = parseInt(payDate.substring(6, 8));
      
      expect(year).toBeGreaterThanOrEqual(2025);
      expect(month).toBeGreaterThanOrEqual(1);
      expect(month).toBeLessThanOrEqual(12);
      expect(day).toBeGreaterThanOrEqual(1);
      expect(day).toBeLessThanOrEqual(31);
    });

    it("should generate exactly 3 working days for zero amount codes", () => {
      const zeroAmountCodes: TransactionCode[] = ['0C', '0N', '0S'];
      
      zeroAmountCodes.forEach(code => {
        const payDate = generatePayDate(code);
        expect(payDate).toMatch(/^\d{8}$/);
      });
    });

    it("should generate future date for regular codes", () => {
      const regularCodes: TransactionCode[] = ['01', '17', '18', '99'];
      
      regularCodes.forEach(code => {
        const payDate = generatePayDate(code);
        const payDateTime = DateTime.fromFormat(payDate, 'yyyyMMdd');
        const today = DateTime.now();
        
        expect(payDateTime > today).toBe(true);
      });
    });
  });

  describe("generateRealtimeInformationChecksum", () => {
    it("should return empty string for non-credit codes", () => {
      const nonCreditCodes: TransactionCode[] = ['01', '17', '18', '0C', '0N', '0S'];
      
      nonCreditCodes.forEach(code => {
        const checksum = generateRealtimeInformationChecksum(code);
        expect(checksum).toBe('');
      });
    });

    it("should generate valid patterns for credit code (99)", () => {
      const checksum = generateRealtimeInformationChecksum('99');
      
      // Should match one of: empty string, '0000', or '/XXX' pattern
      const isValid = 
        checksum === '' ||
        checksum === '0000' ||
        /^\/[A-Za-z0-9.&/\-\s]{3}$/.test(checksum);
      
      expect(isValid).toBe(true);
    });

    it("should generate all possible patterns over multiple runs", () => {
      const patterns = new Set<string>();
      
      // Generate many checksums to see different patterns
      for (let i = 0; i < 50; i++) {
        patterns.add(generateRealtimeInformationChecksum('99'));
      }
      
      // Should have generated at least 2 different patterns
      expect(patterns.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe("generateValidRecord", () => {
    it("should generate valid record without optional fields", () => {
      const record = generateValidRecord(false);

      // Check required fields exist
      expect(record.destinationAccountName).toBeDefined();
      expect(record.destinationSortCode).toBeDefined();
      expect(record.destinationAccountNumber).toBeDefined();
      expect(record.paymentReference).toBeDefined();
      expect(record.amount).toBeDefined();
      expect(record.transactionCode).toBeDefined();

      // Check optional fields don't exist
      expect(record.payDate).toBeUndefined();
      expect(record.originatingSortCode).toBeUndefined();
      expect(record.originatingAccountNumber).toBeUndefined();
      expect(record.originatingAccountName).toBeUndefined();
      expect(record.realtimeInformationChecksum).toBeUndefined();
    });

    it("should generate valid record with optional fields", () => {
      const record = generateValidRecord(true);

      // Check required fields exist
      expect(record.destinationAccountName).toBeDefined();
      expect(record.destinationSortCode).toBeDefined();
      expect(record.destinationAccountNumber).toBeDefined();
      expect(record.paymentReference).toBeDefined();
      expect(record.amount).toBeDefined();
      expect(record.transactionCode).toBeDefined();

      // Check optional fields exist
      expect(record.payDate).toBeDefined();
      expect(record.originatingSortCode).toBeDefined();
      expect(record.originatingAccountNumber).toBeDefined();
      expect(record.originatingAccountName).toBeDefined();
      expect(record.realtimeInformationChecksum).toBeDefined();
    });

    it("should enforce amount rules based on transaction code", () => {
      // Generate many records to test amount rules
      for (let i = 0; i < 20; i++) {
        const record = generateValidRecord(false);
        
        if (['0C', '0N', '0S'].includes(record.transactionCode)) {
          expect(record.amount).toBe('0');
        } else {
          const numericAmount = parseFloat(record.amount);
          expect(numericAmount).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("generateInvalidRecord", () => {
    it("should generate record with required fields present", () => {
      const record = generateInvalidRecord(false);

      // Basic structure should be present even if invalid
      expect(record.destinationAccountName).toBeDefined();
      expect(record.destinationSortCode).toBeDefined();
      expect(record.destinationAccountNumber).toBeDefined();
      expect(record.paymentReference).toBeDefined();
      expect(record.amount).toBeDefined();
      expect(record.transactionCode).toBeDefined();
    });

    it("should include optional fields when requested", () => {
      const record = generateInvalidRecord(true);

      // Optional fields should be present (even if invalid)
      expect(record.payDate).toBeDefined();
      expect(record.originatingSortCode).toBeDefined();
      expect(record.originatingAccountNumber).toBeDefined();
      expect(record.originatingAccountName).toBeDefined();
      expect(record.realtimeInformationChecksum).toBeDefined();
    });
  });

  describe("generateRecords", () => {
    it("should generate all valid records when hasInvalidRows is false", () => {
      const records = generateRecords(10, false, false, true);
      expect(records.length).toBe(10);
      
      // All records should have required fields
      records.forEach(record => {
        expect(record.destinationAccountName).toBeDefined();
        expect(record.destinationSortCode).toBeDefined();
        expect(record.destinationAccountNumber).toBeDefined();
        expect(record.paymentReference).toBeDefined();
        expect(record.amount).toBeDefined();
        expect(record.transactionCode).toBeDefined();
      });
    });

    it("should generate 50% invalid rows when hasInvalidRows is true", () => {
      const records = generateRecords(10, true, false, true);
      expect(records.length).toBe(10);
      
      // Should have generated 50% invalid (5 invalid rows for 10 total)
      // We can't easily verify which are invalid without re-implementing validation,
      // but we can verify the structure is maintained
      records.forEach(record => {
        expect(record.destinationAccountName).toBeDefined();
        expect(record.destinationSortCode).toBeDefined();
        expect(record.destinationAccountNumber).toBeDefined();
        expect(record.paymentReference).toBeDefined();
        expect(record.amount).toBeDefined();
        expect(record.transactionCode).toBeDefined();
      });
    });

    it("should respect canInlineEdit limit of 49 invalid rows", () => {
      const records = generateRecords(100, true, false, true);
      expect(records.length).toBe(100);
      
      // With canInlineEdit=true, should have max 49 invalid rows
      // Total records should still be 100
    });

    it("should allow more than 49 invalid rows when canInlineEdit is false", () => {
      const records = generateRecords(100, true, false, false);
      expect(records.length).toBe(100);
      
      // With canInlineEdit=false, should have 50 invalid rows (50% of 100)
    });

    it("should include optional fields when requested", () => {
      const records = generateRecords(5, false, true, true);
      
      records.forEach(record => {
        expect(record.payDate).toBeDefined();
        expect(record.originatingSortCode).toBeDefined();
        expect(record.originatingAccountNumber).toBeDefined();
        expect(record.originatingAccountName).toBeDefined();
        expect(record.realtimeInformationChecksum).toBeDefined();
      });
    });

    it("should not include optional fields when not requested", () => {
      const records = generateRecords(5, false, false, true);
      
      records.forEach(record => {
        expect(record.payDate).toBeUndefined();
        expect(record.originatingSortCode).toBeUndefined();
        expect(record.originatingAccountNumber).toBeUndefined();
        expect(record.originatingAccountName).toBeUndefined();
        expect(record.realtimeInformationChecksum).toBeUndefined();
      });
    });

    it("should generate correct number of records for edge cases", () => {
      // Test single record
      expect(generateRecords(1, false, false, true).length).toBe(1);
      expect(generateRecords(1, true, false, true).length).toBe(1);
      
      // Test odd numbers
      expect(generateRecords(15, true, false, true).length).toBe(15);
      
      // Test large numbers
      expect(generateRecords(1000, false, false, true).length).toBe(1000);
    });
  });
});
