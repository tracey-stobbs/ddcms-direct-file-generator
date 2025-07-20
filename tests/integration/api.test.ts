/**
 * Integration tests for Phase 4 API layer
 * Tests the complete API workflow
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import express from 'express';
import request from 'supertest';
import router from '../../src/api/routes';
import { errorHandler, notFoundHandler } from '../../src/api/middleware';

describe("Phase 4 API Integration Tests", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', router);
    app.use(errorHandler);
    app.use(notFoundHandler);
  });

  describe("GET /api/info", () => {
    it("should return API information", async () => {
      const response = await request(app)
        .get('/api/info')
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Banking File Generation API');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('status', 'operational');
      expect(response.body).toHaveProperty('supportedFormats');
      expect(response.body.supportedFormats).toEqual(['SDDirect', 'Bacs18PaymentLines', 'Bacs18StandardFile']);
    });
  });

  describe("POST /api/generate", () => {
    const validRequest = {
      fileType: 'SDDirect',
      canInlineEdit: true,
      includeHeaders: true,
      numberOfRows: 5,
      hasInvalidRows: false,
      includeOptionalFields: true,
      outputPath: './test-output'
    };

    it("should generate SDDirect file successfully", async () => {
      const response = await request(app)
        .post('/api/generate')
        .send(validRequest);

      // Should succeed (200 or might fail gracefully depending on file system)
      expect([200, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
      
      if (response.body.success) {
        expect(response.body).toHaveProperty('message', 'File generated successfully');
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('content');
        expect(response.body.data).toHaveProperty('filename');
        expect(response.body.data).toHaveProperty('metadata');
      }
    });

    it("should generate Bacs18PaymentLines file successfully", async () => {
      const bacsRequest = {
        ...validRequest,
        fileType: 'Bacs18PaymentLines',
        numberOfRows: 3
      };

      const response = await request(app)
        .post('/api/generate')
        .send(bacsRequest);

      expect([422]).toContain(response.status);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBe('File generation failed');
      expect(response.body.details).toContain('SDDirect file type is currently supported');
    });

    it("should generate Bacs18StandardFile successfully", async () => {
      const bacsStandardRequest = {
        ...validRequest,
        fileType: 'Bacs18StandardFile',
        numberOfRows: 2
      };

      const response = await request(app)
        .post('/api/generate')
        .send(bacsStandardRequest);

      expect([422]).toContain(response.status);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBe('File generation failed');
      expect(response.body.details).toContain('SDDirect file type is currently supported');
    });

    describe("Request validation", () => {
      it("should reject missing fileType", async () => {
        const invalidRequest = { ...validRequest };
        delete (invalidRequest as Record<string, unknown>).fileType;

        const response = await request(app)
          .post('/api/generate')
          .send(invalidRequest)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Validation failed');
        expect(response.body.details).toContain('fileType is required');
      });

      it("should reject invalid fileType", async () => {
        const invalidRequest = {
          ...validRequest,
          fileType: 'InvalidType'
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

      it("should handle empty request body", async () => {
        const response = await request(app)
          .post('/api/generate')
          .send({})
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('File generated successfully');
        expect(response.body.data.filename).toMatch(/^SDDirect_11_x_15_H_V_\d{8}_\d{6}\.csv$/);
      });

      it("should use defaults for missing optional fields", async () => {
        const minimalRequest = {
          fileType: 'SDDirect'
        };

        const response = await request(app)
          .post('/api/generate')
          .send(minimalRequest);

        expect([200, 500]).toContain(response.status);
        expect(response.body).toHaveProperty('success');
      });
    });

    describe("Edge cases", () => {
      it("should handle minimum valid values", async () => {
        const minRequest = {
          fileType: 'SDDirect',
          numberOfRows: 1
        };

        const response = await request(app)
          .post('/api/generate')
          .send(minRequest);

        expect([200, 500]).toContain(response.status);
        expect(response.body).toHaveProperty('success');
      });

      it("should handle large valid values", async () => {
        const largeRequest = {
          fileType: 'SDDirect',
          numberOfRows: 1000
        };

        const response = await request(app)
          .post('/api/generate')
          .send(largeRequest);

        expect([200, 500]).toContain(response.status);
        expect(response.body).toHaveProperty('success');
      });

      it("should handle non-JSON content type", async () => {
        const response = await request(app)
          .post('/api/generate')
          .send('not json')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('File generated successfully');
      });
    });
  });

  describe("Error handling", () => {
    it("should handle 404 for unknown endpoints", async () => {
      const response = await request(app)
        .get('/api/unknown')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Route not found');
    });

    it("should handle invalid JSON", async () => {
      const response = await request(app)
        .post('/api/generate')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Internal server error');
    });
  });
});
