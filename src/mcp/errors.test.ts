import { describe, expect, it } from 'vitest';
import { internalError, invalidParams, methodNotFound, serverError } from './errors';
import { JsonRpcErrorCodes, JsonRpcRouter, type JsonRpcRequest } from './jsonrpc';

describe('mcp/errors helpers', () => {
    it('invalidParams produces -32602 via router', async () => {
        const r = new JsonRpcRouter();
        r.register('boom.invalid', () => invalidParams('bad input', { field: 'x' }));
        const req: JsonRpcRequest = { jsonrpc: '2.0', id: 1, method: 'boom.invalid', params: {} };
        const resp = await r.handle(req);
        function hasError(
            x: unknown,
        ): x is { error: { code: number; message: string; data?: unknown } } {
            return typeof x === 'object' && x !== null && 'error' in x;
        }
        expect(hasError(resp)).toBe(true);
        if (hasError(resp)) {
            expect(resp.error.code).toBe(JsonRpcErrorCodes.InvalidParams);
            expect(resp.error.message).toContain('bad input');
        }
    });

    it('internalError produces -32603', async () => {
        const r = new JsonRpcRouter();
        r.register('boom.internal', () => internalError(new Error('explode')));
        const req: JsonRpcRequest = { jsonrpc: '2.0', id: 2, method: 'boom.internal' };
        const resp = await r.handle(req);
        function hasError(x: unknown): x is { error: { code: number; message: string } } {
            return typeof x === 'object' && x !== null && 'error' in x;
        }
        expect(hasError(resp)).toBe(true);
        if (hasError(resp)) {
            expect(resp.error.code).toBe(JsonRpcErrorCodes.InternalError);
            expect(resp.error.message).toContain('explode');
        }
    });

    it('methodNotFound helper throws -32601 when used inside a method', async () => {
        const r = new JsonRpcRouter();
        r.register('boom.notfound', () => methodNotFound('missingMethod'));
        const req: JsonRpcRequest = { jsonrpc: '2.0', id: 3, method: 'boom.notfound' };
        const resp = await r.handle(req);
        function hasError(x: unknown): x is { error: { code: number; message: string } } {
            return typeof x === 'object' && x !== null && 'error' in x;
        }
        expect(hasError(resp)).toBe(true);
        if (hasError(resp)) {
            expect(resp.error.code).toBe(JsonRpcErrorCodes.MethodNotFound);
            expect(resp.error.message).toContain('missingMethod');
        }
    });

    it('serverError produces -32000', async () => {
        const r = new JsonRpcRouter();
        r.register('boom.server', () => serverError('generic failure'));
        const req: JsonRpcRequest = { jsonrpc: '2.0', id: 4, method: 'boom.server' };
        const resp = await r.handle(req);
        function hasError(x: unknown): x is { error: { code: number; message: string } } {
            return typeof x === 'object' && x !== null && 'error' in x;
        }
        expect(hasError(resp)).toBe(true);
        if (hasError(resp)) {
            expect(resp.error.code).toBe(JsonRpcErrorCodes.ServerError);
            expect(resp.error.message).toContain('generic failure');
        }
    });
});
