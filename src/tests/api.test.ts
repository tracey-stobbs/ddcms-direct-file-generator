/**
 * Integration tests for the API endpoints
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import app from '../index';
import { FileService } from '../services/fileService';

// Mock the FileService to avoid actual file operations
vi.mock('../services/fileService', () => {
  return {
    FileService: vi.fn().mockImplementation(() => {
      return {
        generateFile: vi.fn().mockResolvedValue({
          fileName: 'SDDirect_06_H__V_20250101_120000.csv',
          filePath: '/path/to/file.csv',
          fileSize: 1024
        })
      };
    })
  };
});

// Create a test server
let server: ReturnType<typeof app.listen>;

describe('API Endpoints', () => {
  beforeAll(() => {
    // Start the server
    const PORT = 3099; // Use a different port for tests
    server = app.listen(PORT);
  });
  
  afterAll(() => {
    // Close the server after tests
    server.close();
  });
  
  it('should respond with 201 for a valid file generation request', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send({
        fileType: 'SDDirect',
        includeHeaders: true,
        includeOptionalFields: false,
        numberOfRows: 100,
        hasInvalidRows: false
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      message: 'File generated successfully',
      fileName: 'SDDirect_06_H__V_20250101_120000.csv'
    });
  });
  
  it('should respond with 400 for an invalid file generation request', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send({
        fileType: 'UnsupportedType'
      });
    
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: 'Invalid request format'
    });
  });
  
  it('should respond with 201 when using default values', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send({
        fileType: 'SDDirect'
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      message: 'File generated successfully'
    });
  });
  
  it('should respond with 200 for health check', async () => {
    const response = await request(app)
      .get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'ok'
    });
  });
});
