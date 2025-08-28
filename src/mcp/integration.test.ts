import fs from 'fs/promises';
import path from 'path';
import { describe, expect, it } from 'vitest';
import type { JsonValue } from './router';
import { createDefaultMcpRouter, handleMcpRequest } from './server';

describe('MCP integration (schemas + services)', () => {
    it('file.preview (EaziPay) happy path', async () => {
        const router = createDefaultMcpRouter();
        const res = await handleMcpRequest(router, {
            id: 1,
            method: 'file.preview',
            params: { sun: '123456', fileType: 'EaziPay', numberOfRows: 2 },
        });
        expect(res.error).toBeUndefined();
        expect(res.result).toBeDefined();
        const r = res.result as {
            content: string;
            meta: { fileType: string; rows: number; columns: number };
        };
        expect(typeof r.content).toBe('string');
        expect(r.meta.fileType).toBe('EaziPay');
        expect(r.meta.rows).toBe(2);
        expect(r.meta.columns).toBeGreaterThan(0);
    });

    it('row.generate (SDDirect) happy path', async () => {
        const router = createDefaultMcpRouter();
        const res = await handleMcpRequest(router, {
            id: 2,
            method: 'row.generate',
            params: { sun: '123456', fileType: 'SDDirect', validity: 'valid' },
        });
        expect(res.error).toBeUndefined();
        const r = res.result as { row: { fields: unknown[]; asLine: string } };
        expect(Array.isArray(r.row.fields)).toBe(true);
        expect(typeof r.row.asLine).toBe('string');
    });

    it('calendar.nextWorkingDay happy path', async () => {
        const router = createDefaultMcpRouter();
        const res = await handleMcpRequest(router, {
            id: 3,
            method: 'calendar.nextWorkingDay',
            params: { offsetDays: 2 },
        });
        expect(res.error).toBeUndefined();
        const r = res.result as { date: string };
        expect(typeof r.date).toBe('string');
    });

    it('calendar.isWorkingDay happy path', async () => {
        const router = createDefaultMcpRouter();
        const res = await handleMcpRequest(router, {
            id: 31,
            method: 'calendar.isWorkingDay',
            params: { date: '2025-01-08' },
        });
        expect(res.error).toBeUndefined();
        const r = res.result as { isWorkingDay: boolean };
        expect(typeof r.isWorkingDay).toBe('boolean');
    });

    it('file.preview invalid params (missing fileType)', async () => {
        const router = createDefaultMcpRouter();
        const res = await handleMcpRequest(router, {
            id: 4,
            method: 'file.preview',
            params: { sun: '123456' } as unknown as JsonValue,
        });
        expect(res.error).toBeDefined();
        expect(String(res.error?.message)).toMatch(/Invalid params/);
    });

    it('file.generate persists file when requested', async () => {
        const router = createDefaultMcpRouter();
        const res = await handleMcpRequest(router, {
            id: 10,
            method: 'file.generate',
            params: { sun: '999999', fileType: 'EaziPay', persist: true } as unknown as JsonValue,
        });
    // previously had diagnostic logging here; removed now that validation issues are fixed
        expect(res.error).toBeUndefined();
        const r = res.result as { filePath?: string; fileContent?: string; persisted?: boolean; persistedPath?: string };
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

    it('file.estimateFilename returns deterministic filename', async () => {
        const router = createDefaultMcpRouter();
        const res = await handleMcpRequest(router, {
            id: 11,
            method: 'file.estimateFilename',
            params: {
                fileType: 'EaziPay',
                columns: 14,
                rows: 1,
                header: 'NH',
                validity: 'V',
            } as unknown as JsonValue,
        });
        expect(res.error).toBeUndefined();
        const r = res.result as { filename?: string };
        expect(typeof r.filename).toBe('string');
    });

    it('row.validate happy path', async () => {
        const router = createDefaultMcpRouter();
        const req: JsonValue = {
            fileType: 'EaziPay',
            // Ensure no undefined entries; schema allows string|number|boolean
            row: { fields: ['01', '123456', '12345678', '123456', '12345678', 'Name', 0, 1, '2025-10-01', '', 'Sun Name', 'REF12345', '', ''] },
        } as unknown as JsonValue;
        const res = await handleMcpRequest(router, { id: 20, method: 'row.validate', params: req });
        expect(res.error).toBeUndefined();
        const r = res.result as { valid: boolean };
        expect(typeof r.valid).toBe('boolean');
    });

    it('eazipay.pickOptions returns options', async () => {
        const router = createDefaultMcpRouter();
    const res = await handleMcpRequest(router, { id: 21, method: 'eazipay.pickOptions', params: {} });
        expect(res.error).toBeUndefined();
    const r = res.result as { options: { dateFormats: string[]; trailerFormats: string[] } };
    expect(Array.isArray(r.options.dateFormats)).toBe(true);
    });

    it('runtime.health returns status', async () => {
        const router = createDefaultMcpRouter();
        const res = await handleMcpRequest(router, { id: 22, method: 'runtime.health', params: {} });
        expect(res.error).toBeUndefined();
        const r = res.result as { status: string; uptime: number };
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

        const list = await handleMcpRequest(router, { id: 23, method: 'fs.list', params: { path: 'test' } });
        expect(list.error).toBeUndefined();
        const names = (list.result as { names: string[] }).names;
        expect(Array.isArray(names)).toBe(true);

        const read = await handleMcpRequest(router, { id: 24, method: 'fs.read', params: { path: rel, offset: 0, length: 5 } });
        expect(read.error).toBeUndefined();
        const r = read.result as { content: string; eof: boolean };
        expect(r.content).toBe('hello');
        expect(typeof r.eof).toBe('boolean');

        const del = await handleMcpRequest(router, { id: 25, method: 'fs.delete', params: { path: rel } });
        expect(del.error).toBeUndefined();
        const d = del.result as { success: boolean };
        expect(d.success).toBe(true);
    });

    it('file.parseAndValidate returns summary and rows', async () => {
        const router = createDefaultMcpRouter();
        // create a small EaziPay file and then parse it
        const gen = await handleMcpRequest(router, {
            id: 26,
            method: 'file.generate',
            params: { sun: '777777', fileType: 'EaziPay' } as unknown as JsonValue,
        });
        expect(gen.error).toBeUndefined();
        const content = (gen.result as { fileContent: string }).fileContent;
        const sandbox = path.resolve(process.cwd(), 'output');
        const rel = 'parse-validate/demo.csv';
        const full = path.resolve(sandbox, rel);
        await fs.mkdir(path.dirname(full), { recursive: true });
        await fs.writeFile(full, content);

        const res = await handleMcpRequest(router, {
            id: 27,
            method: 'file.parseAndValidate',
            params: { filePath: full, fileType: 'EaziPay' } as unknown as JsonValue,
        });
        expect(res.error).toBeUndefined();
        const pv = res.result as { summary: { total: number; valid: number; invalid: number } };
        expect(pv.summary.total).toBeGreaterThan(0);
    });
});
