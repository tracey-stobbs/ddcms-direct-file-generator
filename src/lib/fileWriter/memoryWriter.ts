import type { IFileWriter, GeneratedFile } from './interfaces';
import type { Request } from '../types';
import { computeFilenameAndContent } from './core';

export class MemoryFileWriter implements IFileWriter {
    async generate(request: Request, sun: string): Promise<GeneratedFile> {
        const { filePath, content, meta } = computeFilenameAndContent(request, sun);
        return { filePath, fileContent: content, meta };
    }
}
