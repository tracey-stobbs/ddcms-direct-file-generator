/**
 * Tests for the SDDirect file format
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SDDirectFileFormat } from './SDDirectFileFormat';

describe('SDDirect File Format', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T12:00:00.000Z'));
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });
  
  describe('generateFileName', () => {
    it('should generate correct file name with only required columns', () => {
      const fileName = SDDirectFileFormat.generateFileName(false, true, false);
      expect(fileName).toBe('SDDirect_06_H__V_20250101_120000.csv');
    });
    
    it('should generate correct file name with all columns', () => {
      const fileName = SDDirectFileFormat.generateFileName(true, true, false);
      expect(fileName).toBe('SDDirect_11_H__V_20250101_120000.csv');
    });
    
    it('should indicate no headers in the file name', () => {
      const fileName = SDDirectFileFormat.generateFileName(false, false, false);
      expect(fileName).toBe('SDDirect_06_NH_V_20250101_120000.csv');
    });
    
    it('should indicate invalid rows in the file name', () => {
      const fileName = SDDirectFileFormat.generateFileName(false, true, true);
      expect(fileName).toBe('SDDirect_06_H__I_20250101_120000.csv');
    });
  });
  
  describe('generateData', () => {
    it('should include headers when requested', () => {
      const content = SDDirectFileFormat.generateData({
        includeHeaders: true,
        includeOptionalFields: false,
        numberOfRows: 1,
        hasInvalidRows: false
      });
      
      // Content should start with the required headers
      expect(content).toContain(SDDirectFileFormat.requiredHeaders);
    });
    
    it('should include full headers when optional fields are requested', () => {
      const content = SDDirectFileFormat.generateData({
        includeHeaders: true,
        includeOptionalFields: true,
        numberOfRows: 1,
        hasInvalidRows: false
      });
      
      // Content should start with the full headers
      expect(content).toContain(SDDirectFileFormat.fullHeaders);
    });
    
    it('should generate the requested number of data rows', () => {
      const content = SDDirectFileFormat.generateData({
        includeHeaders: false,
        includeOptionalFields: false,
        numberOfRows: 5,
        hasInvalidRows: false
      });
      
      // Count the number of rows (non-empty lines)
      const rowCount = content.split('\n').filter(line => line.trim() !== '').length;
      expect(rowCount).toBe(5);
    });    it('should include optional fields when requested', () => {
      const content = SDDirectFileFormat.generateData({
        includeHeaders: false,
        includeOptionalFields: true,
        numberOfRows: 1,
        hasInvalidRows: false
      });
      
      // Count the number of comma-separated values in the first row
      const firstRow = content.split('\n')[0];
      const fieldCount = firstRow.split(',').length;
        // Should include required + optional fields (6 required + 5 optional = 11)
      expect(fieldCount).toBe(11);
      
      // Make sure we have the expected number of commas (fields - 1)
      expect(firstRow.split(',').length - 1).toBe(10); // 11 fields means 10 commas
    });
      it('should only include required fields by default', () => {
      const content = SDDirectFileFormat.generateData({
        includeHeaders: false,
        includeOptionalFields: false,
        numberOfRows: 1,
        hasInvalidRows: false
      });
      
      // Count the number of comma-separated values in the first row
      const firstRow = content.split('\n')[0];
      const fieldCount = firstRow.split(',').length;
      
      // Should include only required fields (6)
      expect(fieldCount).toBe(6);
    });
  });
});
