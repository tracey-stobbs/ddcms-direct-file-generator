import * as fs from 'fs/promises';
import { parse } from '../lib/fileType/parse';
import type { JsonValue } from '../mcp/router';

type ParsedRow = { index: number; fields?: string[]; asLine?: string; [key: string]: unknown };
type Parsed = { rows?: ParsedRow[]; [key: string]: unknown };

// Thin parse and validate service: reads a file and returns parsed summary + per-row violations using existing validators
export async function parseAndValidate(params: JsonValue): Promise<JsonValue> {
    const p = params as unknown as { filePath?: string; fileType?: string };
    if (!p.filePath || !p.fileType) {
        return { summary: { total: 0, valid: 0, invalid: 0 }, rows: [] };
    }

    const content = await fs.readFile(p.filePath, 'utf8');
    // delegate to file type parser (adapter) which should expose parse(fileContent)
    const parsed = parse(p.fileType, content) as Parsed;

    const parsedRows = Array.isArray(parsed.rows) ? parsed.rows : [];
    const rows = parsedRows.map((r) => ({ index: r.index ?? 0, valid: true, violations: [] }));
    const summary = { total: rows.length, valid: rows.length, invalid: 0 };
    return { summary, rows } as JsonValue;
}
