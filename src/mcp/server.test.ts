import { describe, expect, it, vi } from 'vitest';
import { JsonValue } from './router';
import { createMcpRouter, handleMcpRequest, McpServices } from './server';

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

describe('MCP server envelope', () => {
    it('wraps successful result', async () => {
        const router = createMcpRouter(services);
        const res = await handleMcpRequest(router, {
            id: 1,
            method: 'file.preview',
            params: { count: 2 } as unknown as JsonValue,
        });
        expect(res).toEqual({ id: 1, result: { preview: ['row-1', 'row-2'] } });
    });

    it('wraps validation errors', async () => {
        const router = createMcpRouter(services);
        const res = await handleMcpRequest(router, {
            id: 'a',
            method: 'file.preview',
            params: {} as unknown as JsonValue,
        });
        expect(res.id).toBe('a');
        // Standard envelope properties
        expect(res.error?.message).toMatch(/Invalid params/);
        expect(res.error && 'code' in res.error ? res.error.code : undefined).toBe('VALIDATION_ERROR');
        expect(res.error && 'traceId' in res.error).toBe(true);
    });

    it('wraps internal errors with traceId', async () => {
        const router = createMcpRouter({
            ...services,
            file: {
                preview: async () => {
                    throw new Error('boom');
                },
            },
        });
        const res = await handleMcpRequest(router, {
            id: 2,
            method: 'file.preview',
            params: { count: 1 } as unknown as JsonValue,
        });
        expect(res.id).toBe(2);
    const err = res.error as unknown as Record<string, unknown>;
    expect(err && err['code']).toBe('INTERNAL_ERROR');
    expect(typeof err['message']).toBe('string');
    expect('traceId' in err).toBe(true);
    });
});
