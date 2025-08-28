import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FilesystemFileWriter } from './filesystemWriter.js';
import type { Request } from '../types.js';
import type { FileSystem } from './fsWrapper.js';

describe('FilesystemFileWriter', () => {
    const existsSync = vi.fn(() => false);
    const mkdirSync = vi.fn();
    const writeFileSync = vi.fn();
    const mockFs: FileSystem = { existsSync, mkdirSync, writeFileSync };

    beforeEach(() => {
        existsSync.mockClear();
        mkdirSync.mockClear();
        writeFileSync.mockClear();
    });

    it('creates directory and writes file (outputPath respected)', async () => {
        const writer = new FilesystemFileWriter(mockFs);
        const request = {
            fileType: 'SDDirect',
            canInlineEdit: true,
            includeHeaders: true,
            numberOfRows: 1,
            outputPath: 'custom/output',
        } as unknown as Request;
        const res = await writer.generate(request, 'TESTSUN');
        expect(mkdirSync).toHaveBeenCalledWith('custom/output', { recursive: true });
        expect(writeFileSync).toHaveBeenCalledWith(res.filePath, expect.any(String), 'utf8');
    });
});
