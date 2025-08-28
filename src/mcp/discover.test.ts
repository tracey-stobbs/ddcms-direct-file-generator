import { describe, expect, it } from 'vitest';
import { createDefaultMcpRouter, handleMcpRequest, type McpRequest } from './server';

describe('mcp.discover', () => {
  it('returns tools array matching discover.result schema', async () => {
    const router = createDefaultMcpRouter();
    const req: McpRequest = { id: 'test-1', method: 'mcp.discover', params: {} };
    const res = await handleMcpRequest(router, req);
    expect(res).toBeDefined();
  // handleMcpRequest returns an envelope { id, result }
  const envelope = res as unknown as { id: unknown; result?: unknown };
  const maybe = envelope.result;
  // expect an object with tools array
  expect(typeof maybe === 'object' && maybe !== null).toBe(true);
  const obj = maybe as Record<string, unknown>;
  const tools = obj.tools as unknown;
  expect(Array.isArray(tools)).toBe(true);
  for (const t of tools as Array<Record<string, unknown>>) {
      expect(typeof t.name).toBe('string');
      // paramsSchema and resultSchema may be null or a string ($id). Accept string|null|undefined
      const ps = t.paramsSchema as unknown;
      const rs = t.resultSchema as unknown;
      expect(ps === null || typeof ps === 'string' || typeof ps === 'undefined').toBe(true);
      expect(rs === null || typeof rs === 'string' || typeof rs === 'undefined').toBe(true);
    }
  });
});
