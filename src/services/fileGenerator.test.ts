/**
 * Tests for the file generator service
 * Validates CSV generation, filename creation, and metadata calculation
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  generateFileName,
  recordToCsvRow,
  generateCsvHeader,
  generateCsvContent,
  calculateMetadata,
  generateFile,
  DEFAULT_REQUEST,
  type FileGenerationRequest
} from "./fileGenerator";
import { SDDirectRecord } from "../types/sddirect";

describe("File Generator Service", () => {
  // Sample records for testing
  const sampleRecord: SDDirectRecord = {
    destinationAccountName: "Test Account",
    destinationSortCode: "123456",
    destinationAccountNumber: "12345678",
    paymentReference: "REF123456",
    amount: "100.50",
    transactionCode: "01",
    realtimeInformationChecksum: "/ABC",
    payDate: "20250825",
    originatingSortCode: "654321",
    originatingAccountNumber: "87654321",
    originatingAccountName: "Origin Account"
  };

  const sampleRecordMinimal: SDDirectRecord = {
    destinationAccountName: "Simple Account",
    destinationSortCode: "111111",
    destinationAccountNumber: "11111111",
    paymentReference: "SIMPLE123",
    amount: "50.00",
    transactionCode: "17"
  };

  beforeEach(() => {
    // Mock Date for consistent filename generation
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-07-19T15:30:45Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("generateFileName", () => {
    it("should generate correct filename with all components", () => {
      const filename = generateFileName("SDDirect", true, 15, true, false);
      expect(filename).toBe("SDDirect_11_x_15_H_V_20250719_153045.csv");
    });

    it("should use 06 columns when optional fields not included", () => {
      const filename = generateFileName("SDDirect", false, 10, true, false);
      expect(filename).toBe("SDDirect_06_x_10_H_V_20250719_153045.csv");
    });

    it("should use NH when headers not included", () => {
      const filename = generateFileName("SDDirect", true, 20, false, false);
      expect(filename).toBe("SDDirect_11_x_20_NH_V_20250719_153045.csv");
    });

    it("should use I when invalid rows included", () => {
      const filename = generateFileName("SDDirect", true, 25, true, true);
      expect(filename).toBe("SDDirect_11_x_25_H_I_20250719_153045.csv");
    });

    it("should handle different file types", () => {
      const filename = generateFileName("Bacs18PaymentLines", false, 5, true, false);
      expect(filename).toBe("Bacs18PaymentLines_06_x_5_H_V_20250719_153045.csv");
    });
  });

  describe("recordToCsvRow", () => {
    it("should convert record to CSV row without optional fields", () => {
      const row = recordToCsvRow(sampleRecord, false);
      expect(row).toBe("Test Account,123456,12345678,REF123456,100.50,01");
    });

    it("should convert record to CSV row with optional fields", () => {
      const row = recordToCsvRow(sampleRecord, true);
      expect(row).toBe("Test Account,123456,12345678,REF123456,100.50,01,/ABC,20250825,654321,87654321,Origin Account");
    });

    it("should handle empty optional fields", () => {
      const row = recordToCsvRow(sampleRecordMinimal, true);
      expect(row).toBe("Simple Account,111111,11111111,SIMPLE123,50.00,17,,,,,");
    });

    it("should escape fields containing commas", () => {
      const recordWithComma: SDDirectRecord = {
        ...sampleRecordMinimal,
        destinationAccountName: "Test, Account"
      };
      const row = recordToCsvRow(recordWithComma, false);
      expect(row).toBe('"Test, Account",111111,11111111,SIMPLE123,50.00,17');
    });

    it("should escape fields containing quotes", () => {
      const recordWithQuote: SDDirectRecord = {
        ...sampleRecordMinimal,
        destinationAccountName: 'Test "Account"'
      };
      const row = recordToCsvRow(recordWithQuote, false);
      expect(row).toBe('"Test ""Account""",111111,11111111,SIMPLE123,50.00,17');
    });

    it("should escape fields containing newlines", () => {
      const recordWithNewline: SDDirectRecord = {
        ...sampleRecordMinimal,
        paymentReference: "REF\nNEWLINE"
      };
      const row = recordToCsvRow(recordWithNewline, false);
      expect(row).toBe('Simple Account,111111,11111111,"REF\nNEWLINE",50.00,17');
    });
  });

  describe("generateCsvHeader", () => {
    it("should generate header without optional fields", () => {
      const header = generateCsvHeader(false);
      expect(header).toBe("Destination Account Name,Destination Sort Code,Destination Account Number,Payment Reference,Amount,Transaction code");
    });

    it("should generate header with optional fields", () => {
      const header = generateCsvHeader(true);
      expect(header).toBe("Destination Account Name,Destination Sort Code,Destination Account Number,Payment Reference,Amount,Transaction code,Realtime Information Checksum,Pay Date,Originating Sort Code,Originating Account Number,Originating Account Name");
    });
  });

  describe("generateCsvContent", () => {
    const records = [sampleRecord, sampleRecordMinimal];

    it("should generate CSV without headers", () => {
      const content = generateCsvContent(records, false, false);
      const lines = content.split('\n');
      expect(lines).toHaveLength(2);
      expect(lines[0]).toBe("Test Account,123456,12345678,REF123456,100.50,01");
      expect(lines[1]).toBe("Simple Account,111111,11111111,SIMPLE123,50.00,17");
    });

    it("should generate CSV with headers", () => {
      const content = generateCsvContent(records, true, false);
      const lines = content.split('\n');
      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe("Destination Account Name,Destination Sort Code,Destination Account Number,Payment Reference,Amount,Transaction code");
      expect(lines[1]).toBe("Test Account,123456,12345678,REF123456,100.50,01");
      expect(lines[2]).toBe("Simple Account,111111,11111111,SIMPLE123,50.00,17");
    });

    it("should generate CSV with optional fields", () => {
      const content = generateCsvContent(records, true, true);
      const lines = content.split('\n');
      expect(lines).toHaveLength(3);
      expect(lines[0]).toContain("Realtime Information Checksum");
      expect(lines[1]).toContain("/ABC,20250825");
      expect(lines[2]).toContain(",,,,"); // Empty optional fields
    });

    it("should handle empty records array", () => {
      const content = generateCsvContent([], true, false);
      expect(content).toBe("Destination Account Name,Destination Sort Code,Destination Account Number,Payment Reference,Amount,Transaction code");
    });

    it("should handle single record", () => {
      const content = generateCsvContent([sampleRecord], false, false);
      expect(content).toBe("Test Account,123456,12345678,REF123456,100.50,01");
    });
  });

  describe("calculateMetadata", () => {
    const records = [sampleRecord, sampleRecordMinimal];

    it("should calculate metadata for valid records", () => {
      const metadata = calculateMetadata(records, false, false, true, true);
      expect(metadata).toEqual({
        recordCount: 2,
        validRecords: 2,
        invalidRecords: 0,
        columnCount: 6,
        hasHeaders: true
      });
    });

    it("should calculate metadata for mixed valid/invalid records", () => {
      const metadata = calculateMetadata(records, true, false, true, true);
      expect(metadata).toEqual({
        recordCount: 2,
        validRecords: 1, // 2 - 1 invalid (50% rounded down)
        invalidRecords: 1,
        columnCount: 6,
        hasHeaders: true
      });
    });

    it("should calculate metadata with optional fields", () => {
      const metadata = calculateMetadata(records, false, true, false, true);
      expect(metadata).toEqual({
        recordCount: 2,
        validRecords: 2,
        invalidRecords: 0,
        columnCount: 11,
        hasHeaders: false
      });
    });

    it("should handle empty records", () => {
      const metadata = calculateMetadata([], false, false, true, true);
      expect(metadata).toEqual({
        recordCount: 0,
        validRecords: 0,
        invalidRecords: 0,
        columnCount: 6,
        hasHeaders: true
      });
    });

    it("should handle large record sets", () => {
      const manyRecords = Array(100).fill(sampleRecord);
      const metadata = calculateMetadata(manyRecords, true, true, false, false); // canInlineEdit false
      expect(metadata).toEqual({
        recordCount: 100,
        validRecords: 50, // 50% of 100
        invalidRecords: 50,
        columnCount: 11,
        hasHeaders: false
      });
    });
  });

  describe("generateFile", () => {
    it("should generate file with default settings", () => {
      const result = generateFile({});
      
      expect(result.filename).toMatch(/^SDDirect_11_x_15_H_V_\d{8}_\d{6}\.csv$/);
      expect(result.content).toContain("Destination Account Name"); // Has headers
      expect(result.content.split('\n')).toHaveLength(16); // Header + 15 rows
      expect(result.metadata.recordCount).toBe(15);
      expect(result.metadata.validRecords).toBe(15);
      expect(result.metadata.columnCount).toBe(11);
    });

    it("should generate file with custom settings", () => {
      const request: Partial<FileGenerationRequest> = {
        numberOfRows: 5,
        includeHeaders: false,
        includeOptionalFields: false,
        hasInvalidRows: true
      };

      const result = generateFile(request);
      
      expect(result.filename).toMatch(/^SDDirect_06_x_5_NH_I_\d{8}_\d{6}\.csv$/);
      expect(result.content).not.toContain("Destination Account Name"); // No headers
      expect(result.content.split('\n')).toHaveLength(5); // 5 rows, no header
      expect(result.metadata.recordCount).toBe(5);
      expect(result.metadata.validRecords).toBe(3); // 5 - 2 invalid (50% rounded down)
      expect(result.metadata.invalidRecords).toBe(2);
      expect(result.metadata.columnCount).toBe(6);
    });

    it("should handle minimum row count", () => {
      const result = generateFile({ numberOfRows: 1 });
      
      expect(result.metadata.recordCount).toBe(1);
      expect(result.content.split('\n')).toHaveLength(2); // Header + 1 row
    });

    it("should handle large row count", () => {
      const result = generateFile({ numberOfRows: 1000 });
      
      expect(result.metadata.recordCount).toBe(1000);
      expect(result.content.split('\n')).toHaveLength(1001); // Header + 1000 rows
    });

    it("should throw error for invalid file type", () => {
      expect(() => {
        generateFile({ fileType: 'InvalidType' as 'SDDirect' });
      }).toThrow("Unsupported file type: InvalidType");
    });

    it("should throw error for invalid row count", () => {
      expect(() => {
        generateFile({ numberOfRows: 0 });
      }).toThrow("Number of rows must be greater than 0");

      expect(() => {
        generateFile({ numberOfRows: -5 });
      }).toThrow("Number of rows must be greater than 0");
    });

    it("should respect canInlineEdit limit", () => {
      const result = generateFile({ 
        numberOfRows: 100, 
        hasInvalidRows: true, 
        canInlineEdit: true 
      });
      
      // Should have max 49 invalid records due to canInlineEdit
      expect(result.metadata.invalidRecords).toBe(49);
      expect(result.metadata.validRecords).toBe(51);
    });

    it("should ignore canInlineEdit when false", () => {
      const result = generateFile({ 
        numberOfRows: 100, 
        hasInvalidRows: true, 
        canInlineEdit: false 
      });
      
      // Should have 50 invalid records (50% of 100)
      expect(result.metadata.invalidRecords).toBe(50);
      expect(result.metadata.validRecords).toBe(50);
    });

    it("should generate consistent structure", () => {
      const result = generateFile({ numberOfRows: 3, includeHeaders: true });
      const lines = result.content.split('\n');
      
      // Should have header + 3 data rows
      expect(lines).toHaveLength(4);
      
      // Each data row should have same number of columns
      const headerColumns = lines[0]?.split(',').length || 0;
      for (let i = 1; i < lines.length; i++) {
        const dataColumns = lines[i]?.split(',').length || 0;
        expect(dataColumns).toBe(headerColumns);
      }
    });
  });

  describe("DEFAULT_REQUEST", () => {
    it("should have correct default values", () => {
      expect(DEFAULT_REQUEST).toEqual({
        fileType: 'SDDirect',
        canInlineEdit: true,
        includeHeaders: true,
        numberOfRows: 15,
        hasInvalidRows: false,
        includeOptionalFields: true,
        outputPath: './output'
      });
    });
  });
});
