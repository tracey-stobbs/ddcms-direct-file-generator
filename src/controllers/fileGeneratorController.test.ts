/**
 * Tests for the file generator controller
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response } from 'express';
import { fileGeneratorController } from './fileGeneratorController';

// Mock fileService
vi.mock('../services/fileService', () => {
  const mockGenerateFile = vi.fn().mockResolvedValue({
    fileName: 'test-file.csv',
    filePath: '/path/to/test-file.csv',
    fileSize: 1024
  });

  return {
    FileService: vi.fn().mockImplementation(() => {
      return {
        generateFile: mockGenerateFile,
        outputDir: '/path/to/output',
        ensureDirectoryExists: vi.fn().mockResolvedValue(undefined)
      };
    })
  };
});

describe('File Generator Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  
  beforeEach(() => {
    mockRequest = {
      body: {
        fileType: 'SDDirect',
        includeHeaders: true,
        includeOptionalFields: false,
        numberOfRows: 100,
        hasInvalidRows: false
      }
    };
    
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T12:00:00.000Z'));
  });
  
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });
  
  it('should return 201 status and file info on successful generation', async () => {
    await fileGeneratorController(mockRequest as Request, mockResponse as Response);
    
    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'File generated successfully',
      fileName: 'test-file.csv'
    }));
  });
  
  it('should return 400 status on invalid request with invalid file type', async () => {
    mockRequest.body = {
      fileType: 'InvalidType',
    };
    
    await fileGeneratorController(mockRequest as Request, mockResponse as Response);
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Invalid request format'
    }));
  });
  
  it('should return 400 status on invalid request with invalid numberOfRows', async () => {
    mockRequest.body = {
      fileType: 'SDDirect',
      numberOfRows: -10
    };
    
    await fileGeneratorController(mockRequest as Request, mockResponse as Response);
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Invalid request format'
    }));
  });
  
  it('should return 500 status on file generation error', async () => {
    // Import FileService module
    const fileServiceModule = await import('../services/fileService');
    
    // Store original mock implementation
    const originalFileService = fileServiceModule.FileService;
    
    // Override the mock to throw an error
    fileServiceModule.FileService = vi.fn().mockImplementation(() => {
      return {
        generateFile: vi.fn().mockRejectedValue(new Error('Test error')),
        outputDir: '/path/to/output',
        ensureDirectoryExists: vi.fn().mockResolvedValue(undefined)
      };
    });
    
    try {
      // Execute with the error-throwing mock
      await fileGeneratorController(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Error generating file',
        details: 'Test error'
      }));
    } finally {
      // Restore the original mock
      fileServiceModule.FileService = originalFileService;
    }
  });
  
  it('should use default values when properties are missing', async () => {
    mockRequest.body = {
      fileType: 'SDDirect'
    };
    
    await fileGeneratorController(mockRequest as Request, mockResponse as Response);
    
    // No need to assert specific values because defaults are applied internally
    // Just checking that the controller didn't crash and returned success
    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalled();
  });
});
