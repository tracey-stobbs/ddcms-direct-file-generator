/**
 * Tests for the file service
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { FileService } from './fileService';
import { getFileFormat } from '../factories/fileFormatFactory';
import { FileGenerationRequest } from '../models/FileGenerationRequest';

// Mock the fs module
vi.mock('fs', () => {
  return {
    default: {
      writeFile: vi.fn((path, content, cb) => cb(null)),
      mkdir: vi.fn((path, options, cb) => cb(null)),
      statSync: vi.fn(() => ({ size: 1024 }))
    }
  };
});

// Mock the file format factory
vi.mock('../factories/fileFormatFactory', () => {
  return {
    getFileFormat: vi.fn().mockReturnValue({
      generateData: vi.fn().mockReturnValue('generated content'),
      generateFileName: vi.fn().mockReturnValue('generated_file.csv'),
      fileType: 'SDDirect',
      fileExtension: 'csv'
    })
  };
});

describe('File Service', () => {
  let fileService: FileService;
  
  beforeEach(() => {
    fileService = new FileService('/test/output/dir');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T12:00:00.000Z'));
  });
  
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });
  
  it('should generate file with correct parameters', async () => {
    const request: FileGenerationRequest = {
      fileType: 'SDDirect',
      includeHeaders: true,
      includeOptionalFields: false,
      numberOfRows: 100,
      hasInvalidRows: false
    };
    
    await fileService.generateFile(request);
    
    // Verify that getFileFormat was called with the correct file type
    expect(getFileFormat).toHaveBeenCalledWith('SDDirect');
    
    // Verify that generateData was called with correct parameters
    const mockFormat = getFileFormat('SDDirect');
    expect(mockFormat.generateData).toHaveBeenCalledWith({
      includeHeaders: true,
      includeOptionalFields: false,
      numberOfRows: 100,
      hasInvalidRows: false
    });
    
    // Verify that generateFileName was called with correct parameters
    expect(mockFormat.generateFileName).toHaveBeenCalledWith(false, true, false);
    
    // Verify that writeFile was called
    expect(fs.writeFile).toHaveBeenCalled();
  });
  
  it('should create output directory if it does not exist', async () => {
    const request: FileGenerationRequest = {
      fileType: 'SDDirect'
    };
    
    await fileService.generateFile(request);
    
    // Verify that mkdir was called with the output directory
    expect(fs.mkdir).toHaveBeenCalledWith(
      '/test/output/dir', 
      { recursive: true }, 
      expect.any(Function)
    );
  });
  
  it('should return file info after successful generation', async () => {
    const request: FileGenerationRequest = {
      fileType: 'SDDirect'
    };
    
    const result = await fileService.generateFile(request);
    
    expect(result).toEqual({
      filePath: path.join('/test/output/dir', 'generated_file.csv'),
      fileName: 'generated_file.csv',
      fileSize: 1024
    });
  });
  
  it('should handle file generation errors', async () => {
    // Set up fs.writeFile to fail
    (fs.writeFile as unknown as ReturnType<typeof vi.fn>)
      .mockImplementationOnce((_path, _content, cb) => cb(new Error('Write failed')));
    
    const request: FileGenerationRequest = {
      fileType: 'SDDirect'
    };
    
    await expect(fileService.generateFile(request)).rejects.toThrow('Error generating file');
  });
});
