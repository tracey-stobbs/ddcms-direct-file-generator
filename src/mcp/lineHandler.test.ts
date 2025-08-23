import { describe, expect, it } from 'vitest';
import { JsonRpcErrorCodes, JsonRpcRouter, type JsonRpcResponse } from './jsonrpc';
import { processJsonRpcLine } from './lineHandler';

function makeRouter(): JsonRpcRouter {
    const r = new JsonRpcRouter();
    r.register('echo', (params) => params);
    return r;
}

describe('processJsonRpcLine', () => {
    it('returns ParseError (-32700) for invalid JSON with id:null', async () => {
        const writes: unknown[] = [];
        await processJsonRpcLine('{not json', makeRouter(), (res) => writes.push(res));
        expect(writes).toHaveLength(1);
        const resp = writes[0] as JsonRpcResponse;
        expect(resp.jsonrpc).toBe('2.0');
        expect(resp.id).toBeNull();
        expect(resp.error?.code).toBe(JsonRpcErrorCodes.ParseError);
    });

    it('ignores empty lines', async () => {
        const writes: unknown[] = [];
        await processJsonRpcLine('   ', makeRouter(), (res) => writes.push(res));
        expect(writes).toHaveLength(0);
    });

    it('dispatches valid requests to the router', async () => {
        const writes: unknown[] = [];
        const req = { jsonrpc: '2.0', id: 1, method: 'echo', params: { x: 1 } };
        await processJsonRpcLine(JSON.stringify(req), makeRouter(), (res) => writes.push(res));
        expect(writes).toHaveLength(1);
        const resp = writes[0] as JsonRpcResponse;
        expect('result' in resp && !('error' in resp)).toBe(true);
        if ('result' in resp) {
            expect(resp.result).toEqual({ x: 1 });
        }
    });

    it('produces MethodNotFound for unknown method via router', async () => {
        const writes: unknown[] = [];
        const req = { jsonrpc: '2.0', id: 2, method: 'no.such.method' };
        await processJsonRpcLine(JSON.stringify(req), makeRouter(), (res) => writes.push(res));
        expect(writes).toHaveLength(1);
        const resp = writes[0] as JsonRpcResponse;
        expect(resp.error?.code).toBe(JsonRpcErrorCodes.MethodNotFound);
    });
});
