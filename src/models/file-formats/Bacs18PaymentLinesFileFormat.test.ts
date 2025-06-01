/**
 * Tests for Bacs18PaymentLines file format
 */
import { describe, it, expect } from 'vitest';
import { Bacs18PaymentLinesFileFormat } from './Bacs18PaymentLinesFileFormat';

describe('Bacs18PaymentLines File Format', () => {
  describe('generateFileName', () => {
    it('should generate file name with correct format', () => {
      const filename = Bacs18PaymentLinesFileFormat.generateFileName(false, false, false);
      expect(filename).toMatch(/^Bacs18PaymentLines_Basic_Valid_\d{8}_\d{6}\.txt$/);
    });
    
    it('should indicate optional fields in filename', () => {
      const filename = Bacs18PaymentLinesFileFormat.generateFileName(true, false, false);
      expect(filename).toMatch(/^Bacs18PaymentLines_Full_Valid_\d{8}_\d{6}\.txt$/);
    });
    
    it('should indicate validity in filename', () => {
      const filename = Bacs18PaymentLinesFileFormat.generateFileName(false, false, true);
      expect(filename).toMatch(/^Bacs18PaymentLines_Basic_Invalid_\d{8}_\d{6}\.txt$/);
    });
    
    it('should indicate both options in filename', () => {
      const filename = Bacs18PaymentLinesFileFormat.generateFileName(true, false, true);
      expect(filename).toMatch(/^Bacs18PaymentLines_Full_Invalid_\d{8}_\d{6}\.txt$/);
    });
  });
  
  describe('generateData', () => {
    it('should never include headers', () => {
      // Bacs18PaymentLines doesn't use headers, even when requested
      const contentWithHeaders = Bacs18PaymentLinesFileFormat.generateData({
        includeHeaders: true,
        includeOptionalFields: false,
        numberOfRows: 1,
        hasInvalidRows: false
      });
      
      const contentWithoutHeaders = Bacs18PaymentLinesFileFormat.generateData({
        includeHeaders: false,
        includeOptionalFields: false,
        numberOfRows: 1,
        hasInvalidRows: false
      });
      
      // Both should have the same number of rows
      expect(contentWithHeaders.split('\n').filter(line => line.trim() !== '').length)
        .toBe(contentWithoutHeaders.split('\n').filter(line => line.trim() !== '').length);
    });
    
    it('should generate the requested number of data rows', () => {
      const content = Bacs18PaymentLinesFileFormat.generateData({
        includeHeaders: false,
        includeOptionalFields: false,
        numberOfRows: 5,
        hasInvalidRows: false
      });
      
      // Count the number of rows (non-empty lines)
      const rowCount = content.split('\n').filter(line => line.trim() !== '').length;
      expect(rowCount).toBe(5);
    });
    
    it('should use fixed width format', () => {
      const content = Bacs18PaymentLinesFileFormat.generateData({
        includeHeaders: false,
        includeOptionalFields: false,
        numberOfRows: 1,
        hasInvalidRows: false
      });
      
      // The first row should have a consistent length based on required fields
      const firstRow = content.split('\n')[0];
      
      // Basic row should be fixed width format (not CSV)
      expect(firstRow).not.toContain(',');
      
      // Check if the basic row has the expected minimum length
      // 6 (sort code) + 8 (account) + 6 (sort code) + 8 (account) + 18 (ref) + 11 (amount) + 2 (code) = 59
      expect(firstRow.length).toBeGreaterThanOrEqual(59);
    });
    
    it('should include optional fields when requested', () => {
      const basicContent = Bacs18PaymentLinesFileFormat.generateData({
        includeHeaders: false,
        includeOptionalFields: false,
        numberOfRows: 1,
        hasInvalidRows: false
      });
      
      const fullContent = Bacs18PaymentLinesFileFormat.generateData({
        includeHeaders: false,
        includeOptionalFields: true,
        numberOfRows: 1,
        hasInvalidRows: false
      });
      
      // Full content should be longer than basic content (has extra fields)
      expect(fullContent.split('\n')[0].length).toBeGreaterThan(basicContent.split('\n')[0].length);
      
      // The difference should account for the optional fields
      // At minimum: 18 (source name) + 18 (dest name) + 8 (date) = 44 additional characters
      expect(fullContent.split('\n')[0].length - basicContent.split('\n')[0].length).toBeGreaterThanOrEqual(44);
    });
  });
});
