import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { logRequest, logError, logResponse } from "./lib/utils/logger.js";
import { Request as FileRequest, SuccessResponse, ErrorResponse } from "./lib/types.js";
import app from "./index.js";

// Mock logger to avoid noisy output
vi.mock("./lib/utils/logger", () => ({
  logRequest: vi.fn((req, res, next) => next()),
  logError: vi.fn(),
  logResponse: vi.fn()
}));


describe("API: /api/generate", () => {
  // const app: express.Express = app; // Directly use the imported app

  it("should return a success response with a filePath", async () => {
    const res = await request(app)
      .post("/api/generate")
      .send({ fileType: "SDDirect", canInlineEdit: true });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.filePath).toMatch(/output\/SDDirect_11_x_15_H_V_\d{8}_\d{6}\.csv/);
  });

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
});
