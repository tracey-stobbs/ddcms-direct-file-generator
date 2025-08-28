import { describe, it, expect } from 'vitest';
import { MemoryFileWriter } from './memoryWriter.js';
import type { Request } from '../types.js';

describe('MemoryFileWriter', () => {
    it('generates in-memory content and virtual path', async () => {
        const writer = new MemoryFileWriter();
        const request = {
            fileType: 'SDDirect',
            canInlineEdit: true,
            includeHeaders: true,
            numberOfRows: 2,
            hasInvalidRows: false,
            includeOptionalFields: true,
        } as unknown as Request;

        const res = await writer.generate(request, 'TESTSUN');
        expect(typeof res.fileContent).toBe('string');
        expect(res.fileContent.length).toBeGreaterThan(0);
        // Path should be under output/SDDirect/TESTSUN with expected filename tokens
    expect(res.filePath).toMatch(/output[\\/]SDDirect[\\/]TESTSUN[\\/]SDDirect_11_x_2_H_V_\d{8}_\d{6}\.csv$/);
        expect(res.meta.fileType).toBe('SDDirect');
        expect(res.meta.sun).toBe('TESTSUN');
        expect(res.meta.extension.startsWith('.')).toBe(true);
    });
});
