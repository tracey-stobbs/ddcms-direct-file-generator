import { describe, it, expect } from 'vitest';
import { resolveFileWriter } from './factory.js';
import { FilesystemFileWriter } from './filesystemWriter.js';
import { MemoryFileWriter } from './memoryWriter.js';

describe('FileWriter factory', () => {
    it('api -> FilesystemFileWriter', () => {
        const w = resolveFileWriter('api');
        expect(w).toBeInstanceOf(FilesystemFileWriter);
    });
    it('mcp (default) -> MemoryFileWriter', () => {
        const w = resolveFileWriter('mcp');
        expect(w).toBeInstanceOf(MemoryFileWriter);
    });
    it('mcp with persist=true -> FilesystemFileWriter', () => {
        const w = resolveFileWriter('mcp', { persist: true });
        expect(w).toBeInstanceOf(FilesystemFileWriter);
    });
});
