import type { IFileWriter, WriterContext } from './interfaces';
import { MemoryFileWriter } from './memoryWriter';
import { FilesystemFileWriter } from './filesystemWriter';
import type { FileSystem } from './fsWrapper';
import { nodeFs } from './fsWrapper';

export function resolveFileWriter(
    context: WriterContext,
    opts?: { persist?: boolean; fs?: FileSystem },
): IFileWriter {
    const fs = opts?.fs ?? nodeFs;
    if (context === 'api') return new FilesystemFileWriter(fs);
    // mcp
    if (opts?.persist) return new FilesystemFileWriter(fs);
    return new MemoryFileWriter();
}
