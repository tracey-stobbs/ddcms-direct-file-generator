/**
 * Tests for the file format factory
 */
import { describe, it, expect } from 'vitest';
import { getFileFormat } from './fileFormatFactory';
import { SDDirectFileFormat } from '../models/file-formats/SDDirectFileFormat';

describe('File Format Factory',  () => {
  it('should return SDDirectFileFormat for SDDirect file type',  () => {
    const fileFormat =  getFileFormat('SDDirect');
    expect(fileFormat).toBe(SDDirectFileFormat);
  });
  
  it('should return Bacs18PaymentLinesFileFormat for Bacs18PaymentLines file type',  () => {
    expect( () =>  getFileFormat('Bacs18PaymentLines')).toThrowError('File type Bacs18PaymentLines is not yet implemented');
  });
  
  it('should return Bacs18StandardFileFormat for Bacs18StandardFile file type',  () => {
    expect(() => getFileFormat("Bacs18StandardFile")).toThrowError(
      "File type Bacs18StandardFile is not yet implemented"
    );
  });
  
  it('should throw error for unsupported file type',  () => {
    expect(() => getFileFormat("UnsupportedType")).toThrowError(
      "Unsupported file type: UnsupportedType"
    );
  });
});
