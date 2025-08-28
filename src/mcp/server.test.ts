import { describe, expect, it, vi } from 'vitest';
import { JsonValue } from './router';
import { createMcpRouter, handleJsonRpcRequest, type JsonRpcRequest, McpServices } from './server';

vi.mock('./schemaLoader', () => {
    return {
        loadSchema: (rel: string): object => {
            switch (rel) {
                case 'file/preview.params.json':
                    return {
                        type: 'object',
                        properties: { count: { type: 'number' } },
                        required: ['count'],
                        additionalProperties: false,
                    };
                case 'file/preview.result.json':
                    return {
                        type: 'object',
                        properties: { preview: { type: 'array', items: { type: 'string' } } },
                        required: ['preview'],
                        additionalProperties: false,
                    };
                case 'row/generate.params.json':
                    return {
                        type: 'object',
                        properties: { n: { type: 'number' } },
                        required: ['n'],
                        additionalProperties: false,
                    };
                case 'row/generate.result.json':
                    return {
                        type: 'object',
                        properties: { rows: { type: 'array', items: { type: 'number' } } },
                        required: ['rows'],
                        additionalProperties: false,
                    };
                case 'calendar/nextWorkingDay.params.json':
                    return {
                        type: 'object',
                        properties: { date: { type: 'string' } },
                        required: ['date'],
                        additionalProperties: false,
                    };
                case 'calendar/nextWorkingDay.result.json':
                    return {
                        type: 'object',
                        properties: { date: { type: 'string' } },
                        required: ['date'],
                        additionalProperties: false,
                    };
                default:
                    throw new Error(`Unexpected schema path: ${rel}`);
            }
        },
    };
});

const services: McpServices = {
    file: {
        preview: async (params: JsonValue): Promise<JsonValue> => {
            if (typeof params === 'object' && params && !Array.isArray(params)) {
                const count = (params as Record<string, JsonValue>).count;
                if (typeof count === 'number') {
                    return {
                        preview: Array.from({ length: count }, (_, i) => `row-${i + 1}`),
                    } as unknown as JsonValue;
                }
            }
            throw new Error('bad params');
        },
    },
    row: {
        generate: async (params: JsonValue): Promise<JsonValue> => {
            if (typeof params === 'object' && params && !Array.isArray(params)) {
                const n = (params as Record<string, JsonValue>).n;
                if (typeof n === 'number') {
                    return {
                        rows: Array.from({ length: n }, (_, i) => i + 1),
                    } as unknown as JsonValue;
                }
            }
            throw new Error('bad params');
        },
    },
    calendar: {
        nextWorkingDay: async (params: JsonValue): Promise<JsonValue> => {
            if (typeof params === 'object' && params && !Array.isArray(params)) {
                const d = (params as Record<string, JsonValue>).date;
                if (typeof d === 'string') {
                    return { date: d } as unknown as JsonValue;
                }
            }
            throw new Error('bad params');
        },
    },
};

// Legacy MCP envelope removed; tests now cover the JSON-RPC adapter only.

describe('JSON-RPC 2.0 adapter', () => {
    it('returns jsonrpc 2.0 success envelope', async () => {
        const router = createMcpRouter(services);
        const req: JsonRpcRequest = {
            jsonrpc: '2.0',
            id: 10,
            method: 'file.preview',
            params: { count: 1 } as unknown as JsonValue,
        };
        const res = await handleJsonRpcRequest(router, req);
        expect(res.jsonrpc).toBe('2.0');
        expect(res.id).toBe(10);
        expect(res.result).toEqual({ preview: ['row-1'] });
        expect(res.error).toBeUndefined();
    });

    it('maps validation errors to -32602', async () => {
        const router = createMcpRouter(services);
        const req: JsonRpcRequest = {
            jsonrpc: '2.0',
            id: 'v1',
            method: 'file.preview',
            params: {} as unknown as JsonValue,
        };
        const res = await handleJsonRpcRequest(router, req);
        expect(res.jsonrpc).toBe('2.0');
        expect(res.id).toBe('v1');
        expect(res.error?.code).toBe(-32602);
        expect(res.error?.message).toBe('Invalid params');
        // data should include traceId
        // @ts-expect-error runtime check
        expect(typeof res.error?.data?.traceId).toBe('string');
    });

    it('maps unknown method to -32601', async () => {
        const router = createMcpRouter(services);
        const req: JsonRpcRequest = {
            jsonrpc: '2.0',
            id: 99,
            method: 'no.such.method',
            params: null,
        };
        const res = await handleJsonRpcRequest(router, req);
        expect(res.jsonrpc).toBe('2.0');
        expect(res.id).toBe(99);
        expect(res.error?.code).toBe(-32601);
        expect(res.error?.message).toBe('Method not found');
    });
});
