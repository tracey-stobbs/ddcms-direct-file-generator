import { afterEach, describe, expect, it, vi } from 'vitest';
import { logger, resetLogger, setLogger, type Logger } from './logger';

const calls: Array<{ level: keyof Logger; message: string; context?: Record<string, unknown> }> =
    [];

const fake: Logger = {
    debug: (m, c) => calls.push({ level: 'debug', message: m, context: c }),
    info: (m, c) => calls.push({ level: 'info', message: m, context: c }),
    warn: (m, c) => calls.push({ level: 'warn', message: m, context: c }),
    error: (m, c) => calls.push({ level: 'error', message: m, context: c }),
};

afterEach(() => {
    calls.length = 0;
    resetLogger();
});

describe('logger injection', () => {
    it('delegates to injected implementation', () => {
        setLogger(fake);
        logger.info('hello', { traceId: 't1', foo: 1 });
        expect(calls.length).toBe(1);
        expect(calls[0]).toEqual({
            level: 'info',
            message: 'hello',
            context: { traceId: 't1', foo: 1 },
        });
    });

    it('restores default via resetLogger', () => {
        const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
        setLogger(fake);
        resetLogger();
        logger.info('hi');
        expect(calls.length).toBe(0); // not captured by fake anymore
        expect(spy).toHaveBeenCalledTimes(1);
        const arg = spy.mock.calls[0]?.[0];
        expect(typeof arg).toBe('string'); // JSON line
        spy.mockRestore();
    });
});
