/*
 Tiny structured logger: JSON-per-line, minimal API.
 - logger.info/warn/error/debug(message, context?)
 - Context is merged into the JSON; include traceId when present.
 - No external deps; safe for tests (can be spied/mocked).
*/

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
    traceId?: string;
    [key: string]: unknown;
}

export interface Logger {
    debug: (message: string, context?: LogContext) => void;
    info: (message: string, context?: LogContext) => void;
    warn: (message: string, context?: LogContext) => void;
    error: (message: string, context?: LogContext) => void;
}

function log(level: LogLevel, message: string, context?: LogContext): void {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...context,
    };
    // Use console methods to surface in Node tooling; keep one-line JSON.
    // eslint-disable-next-line no-console
    console[level](JSON.stringify(entry));
}

// Default implementation that writes JSON to console
const defaultLogger: Logger = {
    debug: (message, context) => log('debug', message, context),
    info: (message, context) => log('info', message, context),
    warn: (message, context) => log('warn', message, context),
    error: (message, context) => log('error', message, context),
};

let current: Logger = defaultLogger;

// Exported delegating logger stays stable for importers; implementation is swappable.
export const logger: Logger = {
    debug: (message, context) => current.debug(message, context),
    info: (message, context) => current.info(message, context),
    warn: (message, context) => current.warn(message, context),
    error: (message, context) => current.error(message, context),
};

export function setLogger(newLogger: Logger): void {
    current = newLogger;
}

export function resetLogger(): void {
    current = defaultLogger;
}
