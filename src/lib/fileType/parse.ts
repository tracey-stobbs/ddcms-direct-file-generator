import { getFileTypeAdapter } from './factory';
import { parseCsvContent } from './csv';

export function parse(fileType: string, content: string): Record<string, unknown> {
    const adapter = getFileTypeAdapter(fileType) as unknown as { parse?: (c: string) => Record<string, unknown> };
    if (typeof adapter.parse === 'function') {
        return adapter.parse!(content);
    }

    // Fallback: use shared CSV parser which understands quoted fields
    return parseCsvContent(content);
}
