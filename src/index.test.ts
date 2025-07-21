import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { logRequest, logError, logResponse } from "./lib/utils/logger.js";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const app = require("./index.js");

// Mock logger to avoid noisy output
vi.mock("./lib/utils/logger", () => ({
  logRequest: vi.fn((req, res, next) => next()),
  logError: vi.fn(),
  logResponse: vi.fn()
}));


describe("API: /api/generate", () => {
  // const app: express.Express = app; // Directly use the imported app

  describe("SDDirect file generation", () => {
    it("should return a success response with a filePath", async () => {
      const res = await request(app)
        .post("/api/generate")
        .send({ fileType: "SDDirect", canInlineEdit: true });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.filePath).toMatch(/output\/SDDirect_11_x_15_H_V_\d{8}_\d{6}\.csv/);
    });
  });

  describe("EaziPay file generation", () => {
    it("should generate EaziPay file with default settings", async () => {
      const res = await request(app)
        .post("/api/generate")
        .send({ fileType: "EaziPay", canInlineEdit: true });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.filePath).toMatch(/output\/EaziPay_(15|23)_x_15_NH_V_\d{8}_\d{6}\.(csv|txt)/);
    });

    it("should generate EaziPay file with specific date format", async () => {
      const res = await request(app)
        .post("/api/generate")
        .send({ 
          fileType: "EaziPay", 
          canInlineEdit: true,
          dateFormat: "YYYY-MM-DD",
          numberOfRows: 5
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.filePath).toMatch(/output\/EaziPay_(15|23)_x_5_NH_V_\d{8}_\d{6}\.(csv|txt)/);
    });

    it("should ignore includeHeaders for EaziPay", async () => {
      const res = await request(app)
        .post("/api/generate")
        .send({ 
          fileType: "EaziPay", 
          canInlineEdit: true,
          includeHeaders: true  // Should be ignored
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Should still show NH (no headers) in filename
      expect(res.body.filePath).toMatch(/output\/EaziPay_(15|23)_x_15_NH_V_\d{8}_\d{6}\.(csv|txt)/);
    });

    it("should generate invalid data when requested", async () => {
      const res = await request(app)
        .post("/api/generate")
        .send({ 
          fileType: "EaziPay", 
          canInlineEdit: true,
          hasInvalidRows: true,
          numberOfRows: 10
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Should show I (invalid) in filename
      expect(res.body.filePath).toMatch(/output\/EaziPay_(15|23)_x_10_NH_I_\d{8}_\d{6}\.(csv|txt)/);
    });
  });

  describe("Error handling and logging", () => {
    it("should log requests and responses", async () => {
      await request(app).post("/api/generate").send({ fileType: "SDDirect", canInlineEdit: true });
      expect(logRequest).toHaveBeenCalled();
      expect(logResponse).toHaveBeenCalled();
    });

    it("should handle errors and log them", async () => {
      // Simulate error by sending invalid JSON (triggers express.json() error handler)
      const res = await request(app)
        .post("/api/generate")
        .set("Content-Type", "application/json")
        .send("{ invalid json }");
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
      expect(logError).toHaveBeenCalled();
    });

    it("should handle unknown file types", async () => {
      const res = await request(app)
        .post("/api/generate")
        .send({ fileType: "UnknownType", canInlineEdit: true });
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("An error occurred while generating the file.");
    });
  });
});
