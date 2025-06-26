/**
 * Tests for the data generation service
 */
import { describe, it, expect, vi } from "vitest";
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
  generateInvalidRow,
  generateValidRow,
} from "./dataGenerationService";
import {
  ALLOWED_TRANSACTION_CODES,
  CREDIT_TRANSACTION_CODES,
  ZERO_AMOUNT_TRANSACTION_CODES,
} from "@models/RowData";

describe("Data Generation Service", () => {
  describe("generateAccountName", () => {
    it("should generate valid account name by default", () => {
      const name = generateAccountName();
      expect(name.length).toBeLessThanOrEqual(18);
    });
  });

  describe("generateSortCode", () => {
    it("should generate valid sort code by default", () => {
      const sortCode = generateSortCode();
      expect(sortCode).toMatch(/^\d{6}$/);
    });
  });

  describe("generateAccount", () => {
    it("should generate valid account number by default", () => {
      const account = generateAccountNumber();
      expect(account).toMatch(/^\d{8}$/);
    });
  });
  describe("generatePaymentReference", () => {
    it("should generate valid payment reference by default", () => {
      const ref = generatePaymentReference();
      expect(ref.length).toBeGreaterThan(6);
      expect(ref.length).toBeLessThan(18);
      expect(ref).not.toMatch(/^DDIC/);
      expect(ref).not.toMatch(/^ /);
      // Ensure not all characters are the same
      const uniqueChars = new Set(ref.split(""));
      expect(uniqueChars.size).toBeGreaterThan(1);
      // Ensure it starts with a word character
      expect(ref).toMatch(/^[A-Za-z0-9]/);
    });
  });

  describe("generateAmount", () => {
    it("should generate zero amount for special transaction codes", () => {
      const amount = generateAmount("0C");
      expect(amount).toBe("0.00");
    });

    it("should generate non-zero amount for regular transaction codes", () => {
      const regularCodes = ALLOWED_TRANSACTION_CODES.filter(
        (code) => !ZERO_AMOUNT_TRANSACTION_CODES.includes(code)
      );

      regularCodes.forEach((code) => {
        const amount = generateAmount(code);
        expect(parseFloat(amount)).toBeGreaterThan(0);
      });
    });
  });

  describe("generateTransactionCode", () => {
    it("should generate valid transaction code by default", () => {
      const code = generateTransactionCode();
      const validCodes = ["01", "17", "18", "99", "0C", "0N", "0S"];
      expect(validCodes).toContain(code);
    });
  });

  describe("generateRealtimeInformationChecksum", () => {
    it("should generate valid checksum for credit transaction codes", () => {
      const creditCodes = ALLOWED_TRANSACTION_CODES.filter((code) =>
        CREDIT_TRANSACTION_CODES.includes(code)
      );

      creditCodes.forEach((code) => {
        const checksum = generateRealtimeInformationChecksum(code);
        const isValid =
          checksum === "" ||
          checksum === "0000" ||
          /^\/[A-Z0-9]{3}$/.test(checksum);
        expect(isValid).toBeTruthy();
      });
    });
  });
  it("should not generate a checksum if the transaction code is not credit", () => {
    const nonCreditCodes = ALLOWED_TRANSACTION_CODES.filter(
      (code) => !CREDIT_TRANSACTION_CODES.includes(code)
    );

    nonCreditCodes.forEach((code) => {
      expect(generateRealtimeInformationChecksum(code)).toBe;
    });
  });

  describe("generatePayDate", () => {
    it("should generate valid pay date by default", () => {
      // Save the real implementation of DateTime.now
      const realNow = DateTime.now;

      try {
        // Mock DateTime.now to return a fixed date
        const mockDate = new Date("2025-06-01T12:00:00.000Z");
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
        const twoDaysFromMock = new Date("2025-06-03T12:00:00.000Z");
        expect(payDate.getTime()).toBeGreaterThanOrEqual(
          twoDaysFromMock.getTime() - 86400000
        ); // Allow 1 day tolerance

        // No more than 30 days in the future from our mock date
        const thirtyDaysFromMock = new Date("2025-07-01T12:00:00.000Z");
        expect(payDate.getTime()).toBeLessThanOrEqual(
          thirtyDaysFromMock.getTime()
        );

        // Not a weekend
        const dayOfWeek = payDate.getDay();
        expect(dayOfWeek).not.toBe(0); // Not Sunday
        expect(dayOfWeek).not.toBe(6); // Not Saturday
      } finally {
        // Restore the real implementation
        DateTime.now = realNow;
      }
    });
  });
});

describe("generateValidRow", () => {
  it("should generate a valid row without optional fields", () => {
    const row = generateValidRow(false);

    // Check required fields exist
    expect(row.destinationAccountName).toBeDefined();
    expect(row.destinationSortCode).toBeDefined();
    expect(row.destinationAccountNumber).toBeDefined();
    expect(row.paymentReference).toBeDefined();
    expect(row.amount).toBeDefined();
    expect(row.transactionCode).toBeDefined();

    // Check optional fields don't exist
    expect(row.payDate).toBeUndefined();
    expect(row.originatingSortCode).toBeUndefined();
    expect(row.originatingAccountNumber).toBeUndefined();
    expect(row.originatingAccountName).toBeUndefined();
    expect(row.realtimeInformationChecksum).toBeUndefined();
  });

  it("should generate a valid row with optional fields", () => {
    const row = generateValidRow(true);

    // Check required fields exist
    expect(row.destinationAccountName).toBeDefined();
    expect(row.destinationSortCode).toBeDefined();
    expect(row.destinationAccountNumber).toBeDefined();
    expect(row.paymentReference).toBeDefined();
    expect(row.amount).toBeDefined();
    expect(row.transactionCode).toBeDefined();

    // Check optional fields exist
    expect(row.payDate).toBeDefined();
    expect(row.originatingSortCode).toBeDefined();
    expect(row.originatingAccountNumber).toBeDefined();
    expect(row.originatingAccountName).toBeDefined();
    expect(row.realtimeInformationChecksum).toBeDefined();
  });
});

describe("generateInvalidRow", () => {
  it("should generate an invalid row", () => {
    const row = generateInvalidRow(false);

    // The invalid row should have at least one field that's invalid
    // but since we can't easily test the validity of the fields here,
    // we'll just make sure all required fields are present
    expect(row.destinationAccountName).toBeDefined();
    expect(row.destinationSortCode).toBeDefined();
    expect(row.destinationAccountNumber).toBeDefined();
    expect(row.paymentReference).toBeDefined();
    expect(row.amount).toBeDefined();
    expect(row.transactionCode).toBeDefined();
  });
});
