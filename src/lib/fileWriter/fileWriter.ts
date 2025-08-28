/**
 * File generation orchestrator
 *
 * Design:
 * - generateFile() produces file content entirely in-memory using filetype adapters.
 * - No filesystem writes occur by default; we return a deterministic filePath and the content.
 * - generateFileWithFs() is a thin wrapper that persists the in-memory result using a provided FS.
 *
 * Contract:
 * - Input: Request (fileType, numberOfRows, includeHeaders, includeOptionalFields, hasInvalidRows, etc.), SUN
 * - Output: { filePath, fileContent }
 *   - filePath is a virtual path rooted at output/[fileType]/[SUN] unless request.outputPath is set.
 *   - fileContent is the serialized file as produced by the adapter.
 */
import type { Request } from '../types';
import type { FileSystem } from './fsWrapper';
import { resolveFileWriter } from './factory';
import type { GeneratedFile } from './interfaces';
import { computeFilenameAndContent, getFileExtension, toPreviewParams } from './core';

export type { GeneratedFile } from './interfaces';

export async function generateFile(request: Request, sun: string): Promise<GeneratedFile> {
    // Back-compat wrapper: in-memory only
    const writer = resolveFileWriter('mcp');
    return writer.generate(request, sun);
}

export async function generateFileWithFs(
    request: Request,
    fs: FileSystem,
    sun: string,
): Promise<GeneratedFile> {
    // Back-compat wrapper: persist using provided fs
    const writer = resolveFileWriter('api', { fs });
    return writer.generate(request, sun);
}

// Re-export core helpers for internal reuse (not part of public API surface)
export { computeFilenameAndContent, getFileExtension, toPreviewParams };

// kept in core
