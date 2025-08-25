import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { logError, logRequest, logResponse } from "./lib/utils/logger.js";

// eslint-disable-next-line @typescript-eslint/no-require-imports
import app from "./index.js";

// Mock logger to avoid noisy output
vi.mock("./lib/utils/logger", () => ({
  logRequest: vi.fn((req, res, next) => next()),
  logError: vi.fn(),
  logResponse: vi.fn()
}));


describe("API: new endpoints", () => {
  // const app: express.Express = app; // Directly use the imported app

  describe("SDDirect generate", () => {
    it("should return file content for generate", async () => {
      const res = await request(app)
        .post("/api/TESTSUN/SDDirect/generate")
        .send({ forInlineEditing: true });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.fileContent).toBeDefined();
      expect(typeof res.body.fileContent).toBe("string");
    });
  });

  describe("EaziPay endpoints", () => {
    it("should return file content for EaziPay generate", async () => {
      const res = await request(app)
        .post("/api/TESTSUN/EaziPay/generate")
        .send({ forInlineEditing: true, numberOfRows: 3 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.fileContent).toBe("string");
    });

    it("should return structured valid rows", async () => {
      const res = await request(app)
        .post("/api/TESTSUN/EaziPay/valid-row")
        .send({ numberOfRows: 2 });
      expect(res.status).toBe(200);
      expect(res.body.headers?.length).toBeGreaterThan(0);
      expect(res.body.rows?.length).toBe(2);
    });

    it("should return structured invalid rows", async () => {
      const res = await request(app)
        .post("/api/TESTSUN/EaziPay/invalid-row")
        .send({ numberOfRows: 2 });
      expect(res.status).toBe(200);
      expect(res.body.headers?.length).toBeGreaterThan(0);
      expect(res.body.rows?.length).toBe(2);
    });
  });

  describe("Error handling and logging", () => {
    it("should log requests and responses", async () => {
      await request(app).post("/api/TESTSUN/SDDirect/generate").send({ forInlineEditing: true });
      expect(logRequest).toHaveBeenCalled();
      expect(logResponse).toHaveBeenCalled();
    });

    it("should handle errors and log them", async () => {
      // Simulate error by sending invalid JSON (triggers express.json() error handler)
      const res = await request(app)
        .post("/api/TESTSUN/SDDirect/generate")
        .set("Content-Type", "application/json")
        .send("{ invalid json }");
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
      expect(logError).toHaveBeenCalled();
    });

    // Unknown file type handling now occurs via route param; keep 500 on unknown
    it("should handle unknown file types", async () => {
      const res = await request(app)
        .post("/api/TESTSUN/UnknownType/generate")
        .send({ forInlineEditing: true });
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
});
