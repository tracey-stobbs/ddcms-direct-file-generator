import fs from 'fs/promises';
import path from 'path';
import { describe, expect, it } from 'vitest';
import type { JsonValue } from './router';
import { createDefaultMcpRouter, handleJsonRpcRequest, type JsonRpcRequest } from './server';

describe('MCP integration (schemas + services)', () => {
    it('file.preview (EaziPay) happy path', async () => {
        const router = createDefaultMcpRouter();
        const req: JsonRpcRequest = {
            jsonrpc: '2.0',
            id: 1,
            method: 'file.preview',
            params: { sun: '123456', fileType: 'EaziPay', numberOfRows: 2 } as unknown as JsonValue,
        };
        const res = await handleJsonRpcRequest(router, req);
        expect(res.error).toBeUndefined();
        expect(res.result).toBeDefined();
        const r = res.result as unknown as {
            content: string;
            meta: { fileType: string; rows: number; columns: number };
        };
        expect(typeof r.content).toBe('string');
        expect(r.meta.fileType).toBe('EaziPay');
        expect(r.meta.rows).toBe(2);
        expect(r.meta.columns).toBeGreaterThan(0);
    });

    it('file.preview (SDDirect) respects includeHeaders=false (NH)', async () => {
        const router = createDefaultMcpRouter();
        const req: JsonRpcRequest = {
            jsonrpc: '2.0',
            id: 101,
            method: 'file.preview',
            params: {
                sun: '123456',
                fileType: 'SDDirect',
                numberOfRows: 2,
                includeHeaders: false,
            } as unknown as JsonValue,
        };
        const res = await handleJsonRpcRequest(router, req);
        expect(res.error).toBeUndefined();
        const r = res.result as unknown as { meta: { fileType: string; header: 'H' | 'NH' } };
        expect(r.meta.fileType).toBe('SDDirect');
        expect(r.meta.header).toBe('NH');
    });

    it('file.preview (SDDirect) respects includeHeaders=true (H)', async () => {
        const router = createDefaultMcpRouter();
        const req: JsonRpcRequest = {
            jsonrpc: '2.0',
            id: 102,
            method: 'file.preview',
            params: {
                sun: '123456',
                fileType: 'SDDirect',
                numberOfRows: 2,
                includeHeaders: true,
            } as unknown as JsonValue,
        };
        const res = await handleJsonRpcRequest(router, req);
        expect(res.error).toBeUndefined();
        const r = res.result as unknown as { meta: { fileType: string; header: 'H' | 'NH' } };
        expect(r.meta.fileType).toBe('SDDirect');
        expect(r.meta.header).toBe('H');
    });

    it('row.generate (SDDirect) happy path', async () => {
        const router = createDefaultMcpRouter();
        const req: JsonRpcRequest = {
            jsonrpc: '2.0',
            id: 2,
            method: 'row.generate',
            params: {
                sun: '123456',
                fileType: 'SDDirect',
                validity: 'valid',
            } as unknown as JsonValue,
        };
        const res = await handleJsonRpcRequest(router, req);
        expect(res.error).toBeUndefined();
        const r = res.result as unknown as { row: { fields: unknown[]; asLine: string } };
        expect(Array.isArray(r.row.fields)).toBe(true);
        expect(typeof r.row.asLine).toBe('string');
    });

    it('calendar.nextWorkingDay happy path', async () => {
        const router = createDefaultMcpRouter();
        const req: JsonRpcRequest = {
            jsonrpc: '2.0',
            id: 3,
            method: 'calendar.nextWorkingDay',
            params: { offsetDays: 2 } as unknown as JsonValue,
        };
        const res = await handleJsonRpcRequest(router, req);
        expect(res.error).toBeUndefined();
        const r = res.result as unknown as { date: string };
        expect(typeof r.date).toBe('string');
    });

    it('calendar.isWorkingDay happy path', async () => {
        const router = createDefaultMcpRouter();
        const req: JsonRpcRequest = {
            jsonrpc: '2.0',
            id: 31,
            method: 'calendar.isWorkingDay',
            params: { date: '2025-01-08' } as unknown as JsonValue,
        };
        const res = await handleJsonRpcRequest(router, req);
        expect(res.error).toBeUndefined();
        const r = res.result as unknown as { isWorkingDay: boolean };
        expect(typeof r.isWorkingDay).toBe('boolean');
    });

    it('file.preview invalid params (missing fileType)', async () => {
        const router = createDefaultMcpRouter();
        const req: JsonRpcRequest = {
            jsonrpc: '2.0',
            id: 4,
            method: 'file.preview',
            params: { sun: '123456' } as unknown as JsonValue,
        };
        const res = await handleJsonRpcRequest(router, req);
        expect(res.error).toBeDefined();
        expect(res.error?.code).toBe(-32602);
        expect(String(res.error?.message)).toMatch(/Invalid params/);
    });

    it('file.generate persists file when requested', async () => {
        const router = createDefaultMcpRouter();
        const req: JsonRpcRequest = {
            jsonrpc: '2.0',
            id: 10,
            method: 'file.generate',
            params: { sun: '999999', fileType: 'EaziPay', persist: true } as unknown as JsonValue,
        };
        const res = await handleJsonRpcRequest(router, req);
        // previously had diagnostic logging here; removed now that validation issues are fixed
        expect(res.error).toBeUndefined();
        const r = res.result as {
            filePath?: string;
            fileContent?: string;
            persisted?: boolean;
            persistedPath?: string;
        };
        expect(r.persisted).toBe(true);
        expect(typeof r.persistedPath).toBe('string');

        // Check file exists on disk
        const fs = await import('fs/promises');
        const path = r.persistedPath as string;
        const stat = await fs.stat(path);
        expect(stat.isFile()).toBe(true);

        // cleanup
        await fs.unlink(path);
    });

    it('file.generate (SDDirect) includeHeaders=false yields NH in meta', async () => {
        const router = createDefaultMcpRouter();
        const req: JsonRpcRequest = {
            jsonrpc: '2.0',
            id: 103,
            method: 'file.generate',
            params: {
                sun: '555555',
                fileType: 'SDDirect',
                includeHeaders: false,
            } as unknown as JsonValue,
        };
        const res = await handleJsonRpcRequest(router, req);
        expect(res.error).toBeUndefined();
        const r = res.result as unknown as { meta: { header: 'H' | 'NH'; fileType: string } };
        expect(r.meta.fileType).toBe('SDDirect');
        expect(r.meta.header).toBe('NH');
    });

    it('file.estimateFilename returns deterministic filename', async () => {
        const router = createDefaultMcpRouter();
        const req: JsonRpcRequest = {
            jsonrpc: '2.0',
            id: 11,
            method: 'file.estimateFilename',
            params: {
                fileType: 'EaziPay',
                columns: 14,
                rows: 1,
                header: 'NH',
                validity: 'V',
            } as unknown as JsonValue,
        };
        const res = await handleJsonRpcRequest(router, req);
        expect(res.error).toBeUndefined();
        const r = res.result as unknown as { filename?: string };
        expect(typeof r.filename).toBe('string');
    });

    it('row.validate happy path', async () => {
        const router = createDefaultMcpRouter();
        const reqParams: JsonValue = {
            fileType: 'EaziPay',
            // Ensure no undefined entries; schema allows string|number|boolean
            row: {
                fields: [
                    '01',
                    '123456',
                    '12345678',
                    '123456',
                    '12345678',
                    'Name',
                    0,
                    1,
                    '2025-10-01',
                    '',
                    'Sun Name',
                    'REF12345',
                    '',
                    '',
                ],
            },
        } as unknown as JsonValue;
        const req: JsonRpcRequest = {
            jsonrpc: '2.0',
            id: 20,
            method: 'row.validate',
            params: reqParams,
        };
        const res = await handleJsonRpcRequest(router, req);
        expect(res.error).toBeUndefined();
        const r = res.result as unknown as { valid: boolean };
        expect(typeof r.valid).toBe('boolean');
    });

    it('eazipay.pickOptions returns options', async () => {
        const router = createDefaultMcpRouter();
        const req: JsonRpcRequest = {
            jsonrpc: '2.0',
            id: 21,
            method: 'eazipay.pickOptions',
            params: {} as unknown as JsonValue,
        };
        const res = await handleJsonRpcRequest(router, req);
        expect(res.error).toBeUndefined();
        const r = res.result as unknown as {
            options: { dateFormats: string[]; trailerFormats: string[] };
        };
        expect(Array.isArray(r.options.dateFormats)).toBe(true);
    });

    it('runtime.health returns status', async () => {
        const router = createDefaultMcpRouter();
        const req: JsonRpcRequest = {
            jsonrpc: '2.0',
            id: 22,
            method: 'runtime.health',
            params: {} as unknown as JsonValue,
        };
        const res = await handleJsonRpcRequest(router, req);
        expect(res.error).toBeUndefined();
        const r = res.result as unknown as { status: string; uptime: number };
        expect(r.status).toBe('ok');
        expect(typeof r.uptime).toBe('number');
    });

    it('fs.read/list/delete basic flow', async () => {
        const router = createDefaultMcpRouter();
        // create a temp file under sandbox
        const sandbox = path.resolve(process.cwd(), 'output');
        const rel = 'test/fs-demo.txt';
        const full = path.resolve(sandbox, rel);
        await fs.mkdir(path.dirname(full), { recursive: true });
        await fs.writeFile(full, 'hello world');

        const list = await handleJsonRpcRequest(router, {
            jsonrpc: '2.0',
            id: 23,
            method: 'fs.list',
            params: { path: 'test' } as unknown as JsonValue,
        });
        expect(list.error).toBeUndefined();
        const names = (list.result as unknown as { names: string[] }).names;
        expect(Array.isArray(names)).toBe(true);

        const read = await handleJsonRpcRequest(router, {
            jsonrpc: '2.0',
            id: 24,
            method: 'fs.read',
            params: { path: rel, offset: 0, length: 5 } as unknown as JsonValue,
        });
        expect(read.error).toBeUndefined();
        const r = read.result as unknown as { content: string; eof: boolean };
        expect(r.content).toBe('hello');
        expect(typeof r.eof).toBe('boolean');

        const del = await handleJsonRpcRequest(router, {
            jsonrpc: '2.0',
            id: 25,
            method: 'fs.delete',
            params: { path: rel } as unknown as JsonValue,
        });
        expect(del.error).toBeUndefined();
        const d = del.result as unknown as { success: boolean };
        expect(d.success).toBe(true);
    });

    it('file.parseAndValidate returns summary and rows', async () => {
        const router = createDefaultMcpRouter();
        // create a small EaziPay file and then parse it
        const gen = await handleJsonRpcRequest(router, {
            jsonrpc: '2.0',
            id: 26,
            method: 'file.generate',
            params: { sun: '777777', fileType: 'EaziPay' } as unknown as JsonValue,
        });
        expect(gen.error).toBeUndefined();
        const content = (gen.result as unknown as { fileContent: string }).fileContent;
        const sandbox = path.resolve(process.cwd(), 'output');
        const rel = 'parse-validate/demo.csv';
        const full = path.resolve(sandbox, rel);
        await fs.mkdir(path.dirname(full), { recursive: true });
        await fs.writeFile(full, content);

        const res = await handleJsonRpcRequest(router, {
            jsonrpc: '2.0',
            id: 27,
            method: 'file.parseAndValidate',
            params: { filePath: full, fileType: 'EaziPay' } as unknown as JsonValue,
        });
        expect(res.error).toBeUndefined();
        const pv = res.result as unknown as {
            summary: { total: number; valid: number; invalid: number };
        };
        expect(pv.summary.total).toBeGreaterThan(0);
    });
});
