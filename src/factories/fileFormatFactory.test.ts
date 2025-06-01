/**
 * Tests for the file format factory
 */
import { describe, it, expect } from 'vitest';
import { getFileFormat } from './fileFormatFactory';
import { SDDirectFileFormat } from '../models/file-formats/SDDirectFileFormat';
import { Bacs18PaymentLinesFileFormat } from '../models/file-formats/Bacs18PaymentLinesFileFormat';
import { Bacs18StandardFileFormat } from '../models/file-formats/Bacs18StandardFileFormat';

describe('File Format Factory', () => {
  it('should return SDDirectFileFormat for SDDirect file type', () => {
    const fileFormat = getFileFormat('SDDirect');
    expect(fileFormat).toBe(SDDirectFileFormat);
  });
  
  it('should return Bacs18PaymentLinesFileFormat for Bacs18PaymentLines file type', () => {
    const fileFormat = getFileFormat('Bacs18PaymentLines');
    expect(fileFormat).toBe(Bacs18PaymentLinesFileFormat);
  });
  
  it('should return Bacs18StandardFileFormat for Bacs18StandardFile file type', () => {
    const fileFormat = getFileFormat('Bacs18StandardFile');
    expect(fileFormat).toBe(Bacs18StandardFileFormat);
  });
  
  it('should throw error for unsupported file type', () => {
    expect(() => getFileFormat('UnsupportedType')).toThrow('Unsupported file type: UnsupportedType');
  });
});
