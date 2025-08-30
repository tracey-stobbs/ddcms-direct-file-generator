import { NextFunction, Request, Response } from 'express';
import { DateTime } from 'luxon';
import { getConfig } from '../../config/index.js';

export enum LogLevel {
    INFO = 'INFO',
    ERROR = 'ERROR',
    WARN = 'WARN',
}

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    meta?: Record<string, unknown>;
}

export function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const entry: LogEntry = {
        timestamp: DateTime.now().toISO(),
        level,
        message,
        meta,
    };

    console.log(JSON.stringify(entry));
}

export function logRequest(req: Request, _res: Response, next: NextFunction): void {
    const cfg = getConfig();
    const meta: Record<string, unknown> = {
        method: req.method,
        url: req.originalUrl,
    };
    if (cfg.logging.requestBody) {
        meta.body = req.body;
    }
    log(LogLevel.INFO, 'Incoming request', meta);
    next();
}

export function logError(err: Error, req: Request): void {
    log(LogLevel.ERROR, err.message, {
        stack: err.stack,
        url: req.originalUrl,
    });
}

export function logResponse(res: Response, body: unknown): void {
    log(LogLevel.INFO, 'API response', {
        status: res.statusCode,
        body,
    });
}
