import { describe, expect, it } from 'vitest';
import { JsonValue, McpRouter } from './router';

const echoParams = {
    type: 'object',
    properties: { x: { type: 'number' } },
    required: ['x'],
    additionalProperties: false,
} as const;
const echoResult = {
    type: 'object',
    properties: { y: { type: 'number' } },
    required: ['y'],
    additionalProperties: false,
} as const;

function isObj(v: JsonValue): v is Record<string, JsonValue> {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}

describe('McpRouter', () => {
    it('invokes a registered tool when params/result validate', async () => {
        const r = new McpRouter();
        r.register({
            name: 'echo',
            paramsSchema: echoParams,
            resultSchema: echoResult,
            handler: async (p: JsonValue) => {
                if (isObj(p) && typeof p.x === 'number') {
                    return { y: p.x } as JsonValue;
                }
                throw new Error('bad params');
            },
        });
        const out = await r.invoke('echo', { x: 42 } as unknown as JsonValue);
        expect(out).toEqual({ y: 42 });
    });

    it('throws on invalid params', async () => {
        const r = new McpRouter();
        r.register({
            name: 'echo',
            paramsSchema: echoParams,
            resultSchema: echoResult,
            handler: async (p: JsonValue) => {
                if (isObj(p) && typeof p.x === 'number') {
                    return { y: p.x } as JsonValue;
                }
                throw new Error('bad params');
            },
        });
        await expect(r.invoke('echo', { bad: true } as unknown as JsonValue)).rejects.toThrow(
            /Invalid params/,
        );
    });

    it('throws on invalid result', async () => {
        const r = new McpRouter();
        r.register({
            name: 'echo',
            paramsSchema: echoParams,
            resultSchema: echoResult,
            handler: async () => ({ bad: true } as unknown as JsonValue),
        });
        await expect(r.invoke('echo', { x: 1 } as unknown as JsonValue)).rejects.toThrow(
            /Invalid result/,
        );
    });
});
