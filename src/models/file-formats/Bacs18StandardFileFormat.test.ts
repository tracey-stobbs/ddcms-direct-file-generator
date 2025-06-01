/**
 * Tests for Bacs18StandardFile format
 */
import { describe, it, expect } from 'vitest';
import { Bacs18StandardFileFormat } from './Bacs18StandardFileFormat';

describe('Bacs18StandardFile Format', () => {
  describe('generateFileName', () => {
    it('should generate file name with correct format', () => {
      const filename = Bacs18StandardFileFormat.generateFileName(false, false, false);
      expect(filename).toMatch(/^Bacs18StandardFile_Standard_NoHeaders_Valid_\d{8}_\d{6}\.bacs$/);
    });
    
    it('should indicate optional fields in filename', () => {
      const filename = Bacs18StandardFileFormat.generateFileName(true, false, false);
      expect(filename).toMatch(/^Bacs18StandardFile_Extended_NoHeaders_Valid_\d{8}_\d{6}\.bacs$/);
    });
    
    it('should indicate headers in filename', () => {
      const filename = Bacs18StandardFileFormat.generateFileName(false, true, false);
      expect(filename).toMatch(/^Bacs18StandardFile_Standard_WithHeaders_Valid_\d{8}_\d{6}\.bacs$/);
    });
    
    it('should indicate validity in filename', () => {
      const filename = Bacs18StandardFileFormat.generateFileName(false, false, true);
      expect(filename).toMatch(/^Bacs18StandardFile_Standard_NoHeaders_Invalid_\d{8}_\d{6}\.bacs$/);
    });
    
    it('should indicate all options in filename', () => {
      const filename = Bacs18StandardFileFormat.generateFileName(true, true, true);
      expect(filename).toMatch(/^Bacs18StandardFile_Extended_WithHeaders_Invalid_\d{8}_\d{6}\.bacs$/);
    });
  });
  
  describe('generateData', () => {
    it('should include headers when requested', () => {
      const contentWithHeaders = Bacs18StandardFileFormat.generateData({
        includeHeaders: true,
        includeOptionalFields: false,
        numberOfRows: 1,
        hasInvalidRows: false
      });
      
      const contentWithoutHeaders = Bacs18StandardFileFormat.generateData({
        includeHeaders: false,
        includeOptionalFields: false,
        numberOfRows: 1,
        hasInvalidRows: false
      });
      
      // Content with headers should have one more line than without headers
      const rowsWithHeaders = contentWithHeaders.split('\n').filter(line => line.trim() !== '').length;
      const rowsWithoutHeaders = contentWithoutHeaders.split('\n').filter(line => line.trim() !== '').length;
      expect(rowsWithHeaders).toBe(rowsWithoutHeaders + 1);
      
      // Content with headers should start with VOL1
      expect(contentWithHeaders.startsWith('VOL1')).toBe(true);
    });
    
    it('should include full headers when optional fields are requested', () => {
      const content = Bacs18StandardFileFormat.generateData({
        includeHeaders: true,
        includeOptionalFields: true,
        numberOfRows: 1,
        hasInvalidRows: false
      });
      
      const lines = content.split('\n').filter(line => line.trim() !== '');
      
      // Should have VOL1 and HDR1 headers, plus data row and footer
      expect(lines.length).toBe(4);
      expect(lines[0].startsWith('VOL1')).toBe(true);
      expect(lines[1].startsWith('HDR1')).toBe(true);
      expect(lines[3].startsWith('EOF1')).toBe(true);
    });
    
    it('should generate the requested number of data rows', () => {
      const content = Bacs18StandardFileFormat.generateData({
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
      const content = Bacs18StandardFileFormat.generateData({
        includeHeaders: false,
        includeOptionalFields: false,
        numberOfRows: 1,
        hasInvalidRows: false
      });
      
      // The first row should have a consistent length and shouldn't have commas
      const firstRow = content.split('\n')[0];
      expect(firstRow).not.toContain(',');
      
      // Each row should start with the record type indicator
      expect(firstRow[0]).toBe('1');
    });
    
    it('should include optional fields when requested', () => {
      const basicContent = Bacs18StandardFileFormat.generateData({
        includeHeaders: false,
        includeOptionalFields: false,
        numberOfRows: 1,
        hasInvalidRows: false
      });
      
      const fullContent = Bacs18StandardFileFormat.generateData({
        includeHeaders: false,
        includeOptionalFields: true,
        numberOfRows: 1,
        hasInvalidRows: false
      });
      
      // Full content should be longer than basic content (has extra fields)
      expect(fullContent.split('\n')[0].length).toBeGreaterThan(basicContent.split('\n')[0].length);
      
      // The difference should account for the optional fields
      // 4 (checksum) + 8 (pay date) + 6 (sort code) + 8 (account) + 18 (name) = 44 additional characters minimum
      const diff = fullContent.split('\n')[0].length - basicContent.split('\n')[0].length;
      expect(diff).toBeGreaterThanOrEqual(44);
    });
  });
});
