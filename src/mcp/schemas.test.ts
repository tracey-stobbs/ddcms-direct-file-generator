import { describe, expect, it } from 'vitest';
import { JsonRpcErrorCodes, JsonRpcRouter } from './jsonrpc';
import { zEazipayGetRowParams, zSDDirectGenerateFileParams } from './schemas';
import { parseOrInvalidParams } from './validation';

describe('MCP zod schemas', () => {
  it('validates EaziPay get row params (ok)', () => {
    const parsed = parseOrInvalidParams(zEazipayGetRowParams, {
      sun: '123456',
      rowCount: 2,
      dateFormat: 'YYYY-MM-DD',
    });
    expect(parsed.sun).toBe('123456');
  });

  it('throws InvalidParams via helper for bad sun', async () => {
    const router = new JsonRpcRouter();
    router.register('test', (params: unknown) => {
      parseOrInvalidParams(zEazipayGetRowParams, params);
      return 'ok';
    });
    const res = await router.handle({
      jsonrpc: '2.0',
      id: 1,
      method: 'test',
      params: { sun: 'abc' },
    });
    expect(res).toBeTruthy();
    type Err = { error: { code: number } };
    if (res && Object.prototype.hasOwnProperty.call(res as object, 'error')) {
      const errRes = res as Err;
      expect(errRes.error.code).toBe(JsonRpcErrorCodes.InvalidParams);
    } else {
      throw new Error('Expected error response');
    }
  });

  it('validates SDDirect generate file params (ok)', () => {
    const parsed = parseOrInvalidParams(zSDDirectGenerateFileParams, {
      sun: '654321',
      numberOfRows: 10,
      includeHeaders: true,
    });
    expect(parsed.numberOfRows).toBe(10);
  });
});
