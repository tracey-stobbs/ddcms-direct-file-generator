import { getFileTypeAdapter } from './factory';

export function parse(fileType: string, content: string): Record<string, unknown> {
    const adapter = getFileTypeAdapter(fileType) as unknown as { parse?: (c: string) => Record<string, unknown> };
    if (typeof adapter.parse === 'function') {
        return adapter.parse!(content);
    }

    // Fallback: split by newline into rows and attempt to split by comma
    const lines = content.split(/\r?\n/).filter((l) => l.length > 0);
    const rows = lines.map((line, i) => ({ index: i, asLine: line, fields: line.split(',') }));
    return { rows };
}
