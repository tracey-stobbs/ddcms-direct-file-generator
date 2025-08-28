import fs from 'fs/promises';
import path from 'path';
import type { JsonValue } from '../mcp/router';

const SANDBOX = path.resolve(process.cwd(), 'output');

function safePath(p: string): string {
    const resolved = path.resolve(SANDBOX, p);
    if (!resolved.startsWith(SANDBOX)) throw new Error('Path outside sandbox');
    return resolved;
}

export async function read(params: JsonValue): Promise<JsonValue> {
    const obj = (params as unknown as Record<string, unknown>) ?? {};
    const p = obj.path as string | undefined;
    const offset = typeof obj.offset === 'number' ? (obj.offset as number) : 0;
    const length = typeof obj.length === 'number' ? (obj.length as number) : undefined;
    if (!p) return { content: '', eof: true } as JsonValue;
    const full = safePath(p);
    const contentFull = await fs.readFile(full, 'utf8');
    const start = Math.max(0, offset);
    const slice =
        length && length > 0 ? contentFull.slice(start, start + length) : contentFull.slice(start);
    const eof = start + (length ?? contentFull.length) >= contentFull.length;
    return { content: slice, eof } as JsonValue;
}

export async function list(params: JsonValue): Promise<JsonValue> {
    const p = (params as unknown as Record<string, unknown>)?.path as string | undefined;
    const rel = p || '.';
    const full = safePath(rel);
    const names = await fs.readdir(full);
    return { names } as JsonValue;
}

export async function deleteFile(params: JsonValue): Promise<JsonValue> {
    const p = (params as unknown as Record<string, unknown>)?.path as string | undefined;
    if (!p) return { success: false } as JsonValue;
    const full = safePath(p);
    await fs.unlink(full);
    return { success: true } as JsonValue;
}

export async function write(params: JsonValue): Promise<JsonValue> {
    const p = (params as unknown as Record<string, unknown>)?.path as string | undefined;
    const content = (params as unknown as Record<string, unknown>)?.content as string | undefined;
    if (!p || typeof content !== 'string') return { success: false } as JsonValue;
    const full = safePath(p);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, content, 'utf8');
    return { success: true, path: full } as JsonValue;
}
