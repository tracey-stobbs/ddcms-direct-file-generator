import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { JsonRpcErrorCodes, JsonRpcRouter } from './jsonrpc';
import { parseOrInvalidParams, parseOrInvalidParamsAsync } from './validation';

const zSimple = z.object({ a: z.number(), b: z.string() });
const zAsync = z.object({
    id: z.string().uuid(),
    n: z.number().refine(async (v) => v % 2 === 0, 'must be even'),
});

describe('mcp/validation helpers', () => {
    it('parseOrInvalidParams - ok', () => {
        const v = parseOrInvalidParams(zSimple, { a: 1, b: 'ok' });
        expect(v.a).toBe(1);
    });

    it('parseOrInvalidParams - throws InvalidParams for root and field errors', async () => {
        const router = new JsonRpcRouter();
        router.register('t', (params: unknown) => {
            parseOrInvalidParams(zSimple, params);
            return 'ok';
        });
        const res = await router.handle({ jsonrpc: '2.0', id: 1, method: 't', params: { a: 'x' } });
        type Err = { error: { code: number; data?: { details?: string[] } } };
        const err = res as Err;
        expect(err.error.code).toBe(JsonRpcErrorCodes.InvalidParams);
        expect(err.error.data?.details?.some((d) => d.includes('a'))).toBe(true);
    });

    it('parseOrInvalidParamsAsync - ok', async () => {
        const v = await parseOrInvalidParamsAsync(zAsync, { id: crypto.randomUUID(), n: 2 });
        expect(v.n).toBe(2);
    });

    it('parseOrInvalidParamsAsync - InvalidParams for async refine', async () => {
        const router = new JsonRpcRouter();
        router.register('t', async (params: unknown) => {
            await parseOrInvalidParamsAsync(zAsync, params);
            return 'ok';
        });
        const res = await router.handle({
            jsonrpc: '2.0',
            id: 1,
            method: 't',
            params: { id: crypto.randomUUID(), n: 3 },
        });
        type Err = { error: { code: number; data?: { details?: string[] } } };
        const err = res as Err;
        expect(err.error.code).toBe(JsonRpcErrorCodes.InvalidParams);
        expect(err.error.data?.details?.some((d) => d.includes('n'))).toBe(true);
    });
});
