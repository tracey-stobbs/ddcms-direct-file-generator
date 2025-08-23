import { describe, expect, it } from 'vitest';
import { generateFile, getInvalidRow, getValidRow } from './sddirect';

describe('MCP SDDirect tools', () => {
    it('getValidRow returns headers and one row with ordered fields', () => {
        const res = getValidRow({ sun: '654321' });
        expect(res.headers.length).toBeGreaterThan(0);
        expect(res.rows.length).toBe(1);
        const fields = res.rows[0].fields;
        expect(fields.length).toBe(res.headers.length);
        for (let i = 0; i < fields.length; i++) {
            expect(fields[i].order).toBe(i + 1);
        }
    });

    it('getInvalidRow rejects bad SUN and returns one row otherwise', () => {
        expect(() => getInvalidRow({ sun: '12A456' })).toThrowError();
        const res = getInvalidRow({ sun: '654321' });
        expect(res.rows.length).toBe(1);
    });

    it('generateFile writes metadata with fileName and rowsWritten', async () => {
        const res = await generateFile({
            sun: '654321',
            numberOfRows: 4,
            includeHeaders: true,
            includeOptionalFields: false,
        });
        expect(res.fileName).toContain('SDDirect_');
        expect(res.rowsWritten).toBe(4);
        expect(res.includeHeadersEffective).toBe(true);
    });
});
