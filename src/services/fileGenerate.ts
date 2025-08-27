import { generateFile } from '../lib/fileWriter/fileWriter';
import type { Request } from '../lib/types';
import type { JsonValue } from '../mcp/router';
export async function generate(params: JsonValue): Promise<JsonValue> {
    const p = params as unknown as Request & { sun?: string; dryRun?: boolean };
    const sun = p.sun ?? 'DEFAULT';
    const generated = await generateFile(p, sun);
    return { filePath: generated.filePath, fileContent: generated.fileContent, meta: generated.meta } as JsonValue;
}

export async function estimateFilename(params: JsonValue): Promise<JsonValue> {
    const p = params as unknown as Request & { sun?: string };
    const sun = p.sun ?? 'DEFAULT';
    const generated = await generateFile(p, sun);
    return { filePath: generated.filePath } as JsonValue;
}
