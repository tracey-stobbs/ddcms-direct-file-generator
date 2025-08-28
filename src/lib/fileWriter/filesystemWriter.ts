import path from 'path';
import type { Request } from '../types';
import { computeFilenameAndContent } from './core';
import type { FileSystem } from './fsWrapper';
import type { GeneratedFile, IFileWriter } from './interfaces';

export class FilesystemFileWriter implements IFileWriter {
    constructor(private readonly fs: FileSystem) {}

    async generate(request: Request, sun: string): Promise<GeneratedFile> {
        const { filePath, content, meta } = computeFilenameAndContent(request, sun);
        const dir = request.outputPath ?? path.dirname(filePath);
        // Ensure directory exists (fs may throw on invalid options)
        if (!this.fs.existsSync(dir)) this.fs.mkdirSync(dir, { recursive: true });
        this.fs.writeFileSync(filePath, content, 'utf8');
        return { filePath, fileContent: content, meta };
    }
}
