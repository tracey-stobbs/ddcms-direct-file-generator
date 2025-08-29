import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import app from '../index.js';

// Silence log noise in test output
vi.mock('../lib/utils/logger', () => ({
    logRequest: vi.fn((_req: unknown, _res: unknown, next: () => void) => next()),
    logError: vi.fn(),
    logResponse: vi.fn(),
}));

describe('API integration (Backlog #6)', () => {
    describe('validation errors', () => {
        it('rejects invalid numberOfRows with 400', async () => {
            const res = await request(app)
                .post('/api/TESTSUN/EaziPay/generate')
                .send({ numberOfRows: 0 });
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(String(res.body.error)).toContain('numberOfRows');
        });

        it('rejects invalid dateFormat with 400', async () => {
            const res = await request(app)
                .post('/api/TESTSUN/EaziPay/generate')
                .send({ dateFormat: 'YYYY/MM/DD' });
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(String(res.body.error)).toContain('dateFormat');
        });
    });

    describe('SDDirect preview behaviors', () => {
        it('returns headers when includeHeaders omitted (defaults true)', async () => {
            const res = await request(app)
                .post('/api/TESTSUN/SDDirect/valid-row')
                .send({ numberOfRows: 1 });
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.headers)).toBe(true);
            expect(res.body.headers.length).toBeGreaterThan(0);
            expect(Array.isArray(res.body.rows)).toBe(true);
            expect(res.body.rows.length).toBe(1);
        });

        it('respects includeOptionalFields=false to reduce columns', async () => {
            const withOptional = await request(app)
                .post('/api/TESTSUN/SDDirect/valid-row')
                .send({ numberOfRows: 1, includeOptionalFields: true });
            const noOptional = await request(app)
                .post('/api/TESTSUN/SDDirect/valid-row')
                .send({ numberOfRows: 1, includeOptionalFields: false });
            expect(withOptional.status).toBe(200);
            expect(noOptional.status).toBe(200);
            const colsWith = withOptional.body.headers.length;
            const colsWithout = noOptional.body.headers.length;
            expect(colsWithout).toBeLessThan(colsWith);
        });
    });
});
