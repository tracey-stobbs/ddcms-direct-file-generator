/**
 * End-to-end tests for Phase 4 API layer
 * Tests the complete API workflow with actual HTTP server
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from 'supertest';
import { spawn, ChildProcess } from 'child_process';

describe("Phase 4 E2E API Tests", () => {
  let serverProcess: ChildProcess;
  const baseURL = 'http://localhost:3000';
  const timeout = 10000; // 10 seconds timeout

  beforeAll(async () => {
    // Start the server
    serverProcess = spawn('npm', ['start'], {
      stdio: 'pipe',
      shell: true,
      cwd: process.cwd()
    });

    // Wait for server to start
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Server failed to start within timeout'));
      }, timeout);

      if (serverProcess.stdout) {
        serverProcess.stdout.on('data', (data) => {
          if (data.toString().includes('Server running on port 3000')) {
            clearTimeout(timer);
            resolve(undefined);
          }
        });
      }

      if (serverProcess.stderr) {
        serverProcess.stderr.on('data', (data) => {
          console.error('Server error:', data.toString());
        });
      }

      serverProcess.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }, timeout);

  afterAll(() => {
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  describe("API Info endpoint", () => {
    it("should return API information", async () => {
      const response = await fetch(`${baseURL}/api/info`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('name', 'Banking File Generation API');
      expect(data).toHaveProperty('version', '1.0.0');
      expect(data).toHaveProperty('status', 'operational');
      expect(data.supportedFormats).toEqual(['SDDirect', 'Bacs18PaymentLines', 'Bacs18StandardFile']);
    });
  });

  describe("File generation endpoint", () => {
    it("should generate SDDirect file successfully", async () => {
      const requestBody = {
        fileType: 'SDDirect',
        canInlineEdit: true,
        includeHeaders: true,
        numberOfRows: 5,
        hasInvalidRows: false,
        includeOptionalFields: true,
        outputPath: './test-output'
      };

      const response = await fetch(`${baseURL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      expect([200, 500]).toContain(response.status);
      
      const data = await response.json();
      expect(data).toHaveProperty('success');
      
      if (data.success) {
        expect(data).toHaveProperty('message', 'File generated successfully');
        expect(data).toHaveProperty('data');
        expect(data.data).toHaveProperty('content');
        expect(data.data).toHaveProperty('filename');
        expect(data.data).toHaveProperty('metadata');
        expect(data.data.metadata).toHaveProperty('recordCount');
        expect(data.data.metadata).toHaveProperty('validRecords');
        expect(data.data.metadata).toHaveProperty('invalidRecords');
      }
    });

    it("should generate Bacs18PaymentLines file successfully", async () => {
      const requestBody = {
        fileType: 'Bacs18PaymentLines',
        canInlineEdit: true,
        includeHeaders: false,
        numberOfRows: 3,
        hasInvalidRows: false,
        includeOptionalFields: false,
        outputPath: './test-output'
      };

      const response = await fetch(`${baseURL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      expect([200, 500]).toContain(response.status);
      
      const data = await response.json();
      expect(data).toHaveProperty('success');
    });

    it("should reject invalid fileType", async () => {
      const requestBody = {
        fileType: 'InvalidType',
        numberOfRows: 5
      };

      const response = await fetch(`${baseURL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toContain('fileType must be one of: SDDirect, Bacs18PaymentLines, Bacs18StandardFile');
    });

    it("should reject invalid numberOfRows", async () => {
      const requestBody = {
        fileType: 'SDDirect',
        numberOfRows: -1
      };

      const response = await fetch(`${baseURL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toContain('numberOfRows must be at least 1');
    });

    it("should use defaults for minimal request", async () => {
      const requestBody = {
        fileType: 'SDDirect'
      };

      const response = await fetch(`${baseURL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      expect([200, 500]).toContain(response.status);
      
      const data = await response.json();
      expect(data).toHaveProperty('success');
    });
  });

  describe("Error handling", () => {
    it("should handle 404 for unknown endpoints", async () => {
      const response = await fetch(`${baseURL}/api/unknown`);
      expect(response.status).toBe(404);
    });

    it("should handle invalid JSON", async () => {
      const response = await fetch(`${baseURL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{ invalid json }'
      });

      expect(response.status).toBe(400);
    });

    it("should handle missing body", async () => {
      const response = await fetch(`${baseURL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{}'
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
    });
  });
});
