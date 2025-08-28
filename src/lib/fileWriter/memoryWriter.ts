import type { Request } from '../types';
import { computeFilenameAndContent } from './core';
import type { GeneratedFile, IFileWriter } from './interfaces';

export class MemoryFileWriter implements IFileWriter {
    async generate(request: Request, sun: string): Promise<GeneratedFile> {
        const { filePath, content, meta } = computeFilenameAndContent(request, sun);
        return { filePath, fileContent: content, meta };
    }
}
