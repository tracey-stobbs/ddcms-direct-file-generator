import { describe, expect, it } from 'vitest';
import { JsonRpcErrorCodes, JsonRpcRouter, type JsonRpcRequest } from './jsonrpc';

describe('JsonRpcRouter', () => {
    it('returns method not found for unknown methods', async () => {
        const r = new JsonRpcRouter();
        const req: JsonRpcRequest = { jsonrpc: '2.0', id: 1, method: 'unknown' };
        const resp = await r.handle(req);
        function hasError(x: unknown): x is { error: { code: number } } {
            return typeof x === 'object' && x !== null && 'error' in x;
        }
        const code = hasError(resp) ? resp.error.code : undefined;
        expect(code).toBe(JsonRpcErrorCodes.MethodNotFound);
    });

    it('dispatches to registered handler', async () => {
        const r = new JsonRpcRouter();
        r.register('echo', (params) => ({ params }));
        const req: JsonRpcRequest = {
            jsonrpc: '2.0',
            id: 'a',
            method: 'echo',
            params: { ok: true },
        };
        const resp = await r.handle(req);
        function hasResult(x: unknown): x is { result: unknown } {
            return (
                typeof x === 'object' &&
                x !== null &&
                Object.prototype.hasOwnProperty.call(x, 'result')
            );
        }
        expect(hasResult(resp)).toBe(true);
    });
});
