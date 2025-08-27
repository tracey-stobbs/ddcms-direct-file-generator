import { describe, expect, it } from 'vitest';
import { bacs18PaymentLinesAdapter } from './bacs18PaymentLines';

describe('bacs18PaymentLinesAdapter', () => {
    it('serializes MULTI to 106 chars per line', () => {
        const rows = bacs18PaymentLinesAdapter.buildPreviewRows({
            sun: 'SUN',
            fileType: 'Bacs18PaymentLines',
            numberOfRows: 3,
            variant: 'MULTI',
        });
        const content = bacs18PaymentLinesAdapter.serialize(rows, {
            sun: 'SUN',
            fileType: 'Bacs18PaymentLines',
            variant: 'MULTI',
        });
        const lines = content.split(/\n/);
        expect(lines).toHaveLength(3);
        for (const ln of lines) expect(ln.length).toBe(106);
    });

    it('serializes DAILY to 100 chars per line', () => {
        const rows = bacs18PaymentLinesAdapter.buildPreviewRows({
            sun: 'SUN',
            fileType: 'Bacs18PaymentLines',
            numberOfRows: 2,
            variant: 'DAILY',
        });
        const content = bacs18PaymentLinesAdapter.serialize(rows, {
            sun: 'SUN',
            fileType: 'Bacs18PaymentLines',
            variant: 'DAILY',
        });
        const lines = content.split(/\n/);
        expect(lines).toHaveLength(2);
        for (const ln of lines) expect(ln.length).toBe(100);
    });

    it('meta reflects variant columns and NH header', () => {
        const rowsMulti = bacs18PaymentLinesAdapter.buildPreviewRows({
            sun: 'SUN',
            fileType: 'Bacs18PaymentLines',
            numberOfRows: 1,
            variant: 'MULTI',
        });
        const metaMulti = bacs18PaymentLinesAdapter.previewMeta(rowsMulti, {
            sun: 'SUN',
            fileType: 'Bacs18PaymentLines',
            variant: 'MULTI',
        });
        expect(metaMulti.columns).toBe(12);
        expect(metaMulti.header).toBe('NH');

        const rowsDaily = bacs18PaymentLinesAdapter.buildPreviewRows({
            sun: 'SUN',
            fileType: 'Bacs18PaymentLines',
            numberOfRows: 1,
            variant: 'DAILY',
        });
        const metaDaily = bacs18PaymentLinesAdapter.previewMeta(rowsDaily, {
            sun: 'SUN',
            fileType: 'Bacs18PaymentLines',
            variant: 'DAILY',
        });
        expect(metaDaily.columns).toBe(11);
    });

    it('sanitizes invalid characters to spaces in names', () => {
        // Build an invalid row then check the serialized content contains only allowed chars
        const one = bacs18PaymentLinesAdapter.buildRow({
            sun: 'SUN',
            fileType: 'Bacs18PaymentLines',
            validity: 'invalid',
            variant: 'MULTI',
        });
        const line = one.row.asLine;
        // Allowed: A-Z 0-9 . & / - and space
        expect(/^[A-Z0-9.&/\- ]+$/.test(line)).toBe(true);
    });
});
