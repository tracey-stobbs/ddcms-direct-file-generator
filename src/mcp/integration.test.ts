import { describe, expect, it } from "vitest";
import type { JsonValue } from "./router";
import { createDefaultMcpRouter, handleMcpRequest } from "./server";

describe("MCP integration (schemas + services)", () => {
  it("file.preview (EaziPay) happy path", async () => {
    const router = createDefaultMcpRouter();
    const res = await handleMcpRequest(router, {
      id: 1,
      method: "file.preview",
      params: { sun: "123456", fileType: "EaziPay", numberOfRows: 2 },
    });
    expect(res.error).toBeUndefined();
    expect(res.result).toBeDefined();
  const r = res.result as { content: string; meta: { fileType: string; rows: number; columns: number } };
    expect(typeof r.content).toBe("string");
    expect(r.meta.fileType).toBe("EaziPay");
    expect(r.meta.rows).toBe(2);
    expect(r.meta.columns).toBeGreaterThan(0);
  });

  it("row.generate (SDDirect) happy path", async () => {
    const router = createDefaultMcpRouter();
    const res = await handleMcpRequest(router, {
      id: 2,
      method: "row.generate",
      params: { sun: "123456", fileType: "SDDirect", validity: "valid" },
    });
    expect(res.error).toBeUndefined();
  const r = res.result as { row: { fields: unknown[]; asLine: string } };
    expect(Array.isArray(r.row.fields)).toBe(true);
    expect(typeof r.row.asLine).toBe("string");
  });

  it("calendar.nextWorkingDay happy path", async () => {
    const router = createDefaultMcpRouter();
    const res = await handleMcpRequest(router, {
      id: 3,
      method: "calendar.nextWorkingDay",
      params: { offsetDays: 2 },
    });
    expect(res.error).toBeUndefined();
  const r = res.result as { date: string };
    expect(typeof r.date).toBe("string");
  });

  it("file.preview invalid params (missing fileType)", async () => {
    const router = createDefaultMcpRouter();
    const res = await handleMcpRequest(router, {
      id: 4,
      method: "file.preview",
  params: { sun: "123456" } as unknown as JsonValue,
    });
    expect(res.error).toBeDefined();
    expect(String(res.error?.message)).toMatch(/Invalid params/);
  });
});
