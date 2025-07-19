/**
 * Tests for the API routes
 * Validates request handling, validation, and error responses
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import express from 'express';
import request from 'supertest';
import router from './routes';
import * as fileGenerator from '../services/fileGenerator';

// Mock dependencies
vi.mock('../services/fileGenerator');

const mockGenerateFile = vi.mocked(fileGenerator.generateFile);

describe("API Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', router);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("GET /api/info", () => {
    it("should return API information", async () => {
      const response = await request(app)
        .get('/api/info')
        .expect(200);

      expect(response.body).toEqual({
        name: 'Banking File Generation API',
        version: '1.0.0',
        status: 'operational',
        supportedFormats: ['SDDirect', 'Bacs18PaymentLines', 'Bacs18StandardFile'],
        endpoints: {
          generate: 'POST /api/generate',
          health: 'GET /health',
          info: 'GET /api/info'
        },
        defaults: fileGenerator.DEFAULT_REQUEST
      });
    });
  });

  describe("POST /api/generate", () => {
    const validRequest = {
      fileType: 'SDDirect' as const,
      canInlineEdit: true,
      includeHeaders: true,
      numberOfRows: 100,
      hasInvalidRows: false,
      includeOptionalFields: true,
      outputPath: './output'
    };

    it("should generate file successfully", async () => {
      const mockGenerationResult = {
        content: 'CSV content here...',
        filename: 'SDDirect_20250120_001.csv',
        metadata: {
          recordCount: 100,
          validRecords: 100,
          invalidRecords: 0,
          columnCount: 15,
          hasHeaders: true
        }
      };

      mockGenerateFile.mockReturnValue(mockGenerationResult);

      const response = await request(app)
        .post('/api/generate')
        .send(validRequest)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'File generated successfully',
        data: {
          content: 'CSV content here...',
          filename: 'SDDirect_20250120_001.csv',
          metadata: {
            recordCount: 100,
            validRecords: 100,
            invalidRecords: 0,
            columnCount: 15,
            hasHeaders: true
          }
        }
      });

      expect(mockGenerateFile).toHaveBeenCalledWith(validRequest);
    });

    it("should handle file generation errors", async () => {
      mockGenerateFile.mockImplementation(() => {
        throw new Error('Invalid payment data');
      });

      const response = await request(app)
        .post('/api/generate')
        .send(validRequest)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'File generation failed',
        message: 'Invalid payment data'
      });
    });

    describe("Request validation", () => {
      it("should reject invalid fileType", async () => {
        const invalidRequest = {
          ...validRequest,
          fileType: 'invalid'
        };

        const response = await request(app)
          .post('/api/generate')
          .send(invalidRequest)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Validation failed');
        expect(response.body.details).toContain('fileType must be one of: SDDirect, Bacs18PaymentLines, Bacs18StandardFile');
      });

      it("should reject invalid numberOfRows", async () => {
        const invalidRequest = {
          ...validRequest,
          numberOfRows: -1
        };

        const response = await request(app)
          .post('/api/generate')
          .send(invalidRequest)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Validation failed');
        expect(response.body.details).toContain('numberOfRows must be at least 1');
      });

      it("should reject numberOfRows exceeding maximum", async () => {
        const invalidRequest = {
          ...validRequest,
          numberOfRows: 100001
        };

        const response = await request(app)
          .post('/api/generate')
          .send(invalidRequest)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Validation failed');
        expect(response.body.details).toContain('numberOfRows must be at most 100000');
      });

      it("should accept valid Bacs18PaymentLines request", async () => {
        const bacsRequest = {
          fileType: 'Bacs18PaymentLines' as const,
          canInlineEdit: true,
          includeHeaders: false,
          numberOfRows: 50,
          hasInvalidRows: true,
          includeOptionalFields: false,
          outputPath: './output'
        };

        mockGenerateFile.mockReturnValue({
          content: 'BACS payment lines content...',
          filename: 'Bacs18PaymentLines_20250120_001.csv',
          metadata: {
            recordCount: 50,
            validRecords: 45,
            invalidRecords: 5,
            columnCount: 10,
            hasHeaders: false
          }
        });

        const response = await request(app)
          .post('/api/generate')
          .send(bacsRequest)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(mockGenerateFile).toHaveBeenCalledWith(bacsRequest);
      });

      it("should accept valid Bacs18StandardFile request", async () => {
        const bacsStandardRequest = {
          fileType: 'Bacs18StandardFile' as const,
          canInlineEdit: false,
          includeHeaders: true,
          numberOfRows: 25,
          hasInvalidRows: false,
          includeOptionalFields: true,
          outputPath: './output'
        };

        mockGenerateFile.mockReturnValue({
          content: 'BACS standard file content...',
          filename: 'Bacs18StandardFile_20250120_001.txt',
          metadata: {
            recordCount: 25,
            validRecords: 25,
            invalidRecords: 0,
            columnCount: 20,
            hasHeaders: true
          }
        });

        const response = await request(app)
          .post('/api/generate')
          .send(bacsStandardRequest)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(mockGenerateFile).toHaveBeenCalledWith(bacsStandardRequest);
      });
    });

    describe("Edge cases", () => {
      it("should handle minimum valid values", async () => {
        const minRequest = {
          fileType: 'SDDirect' as const,
          canInlineEdit: true,
          includeHeaders: false,
          numberOfRows: 1,
          hasInvalidRows: false,
          includeOptionalFields: false,
          outputPath: './output'
        };

        mockGenerateFile.mockReturnValue({
          content: 'Minimal CSV content',
          filename: 'SDDirect_minimal.csv',
          metadata: {
            recordCount: 1,
            validRecords: 1,
            invalidRecords: 0,
            columnCount: 5,
            hasHeaders: false
          }
        });

        const response = await request(app)
          .post('/api/generate')
          .send(minRequest)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it("should handle maximum valid values", async () => {
        const maxRequest = {
          fileType: 'SDDirect' as const,
          canInlineEdit: true,
          includeHeaders: true,
          numberOfRows: 100000,
          hasInvalidRows: true,
          includeOptionalFields: true,
          outputPath: './output'
        };

        mockGenerateFile.mockReturnValue({
          content: 'Maximum CSV content...',
          filename: 'SDDirect_maximum.csv',
          metadata: {
            recordCount: 100000,
            validRecords: 95000,
            invalidRecords: 5000,
            columnCount: 15,
            hasHeaders: true
          }
        });

        const response = await request(app)
          .post('/api/generate')
          .send(maxRequest)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it("should use defaults for missing optional fields", async () => {
        const minimalRequest = {
          fileType: 'SDDirect' as const
        };

        mockGenerateFile.mockReturnValue({
          content: 'Default CSV content...',
          filename: 'SDDirect_default.csv',
          metadata: {
            recordCount: 15,
            validRecords: 15,
            invalidRecords: 0,
            columnCount: 15,
            hasHeaders: true
          }
        });

        const response = await request(app)
          .post('/api/generate')
          .send(minimalRequest)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(mockGenerateFile).toHaveBeenCalledWith({
          fileType: 'SDDirect',
          canInlineEdit: true,
          includeHeaders: true,
          numberOfRows: 15,
          hasInvalidRows: false,
          includeOptionalFields: true,
          outputPath: './output'
        });
      });

      it("should handle empty request body", async () => {
        const response = await request(app)
          .post('/api/generate')
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Validation failed');
        expect(response.body.details).toContain('fileType is required');
      });

      it("should handle non-JSON content type", async () => {
        const response = await request(app)
          .post('/api/generate')
          .send('not json')
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });
  });
});
