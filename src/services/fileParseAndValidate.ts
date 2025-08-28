import * as fs from 'fs/promises';
import { parse } from '../lib/fileType/parse';
import type { JsonValue } from '../mcp/router';
import { validate as validateRow } from './rowValidate';

type ParsedRow = { index: number; fields?: string[]; asLine?: string; [key: string]: unknown };
type Parsed = { rows?: ParsedRow[]; [key: string]: unknown };

// Parse a file using the appropriate adapter, then validate each row using existing row validators.
export async function parseAndValidate(params: JsonValue): Promise<JsonValue> {
    const p = params as unknown as { filePath?: string; fileType?: string };
    if (!p.filePath || !p.fileType) {
        return { summary: { total: 0, valid: 0, invalid: 0 }, rows: [] };
    }

    const content = await fs.readFile(p.filePath, 'utf8');
    const parsed = parse(p.fileType, content) as Parsed;
    const parsedRows = Array.isArray(parsed.rows) ? parsed.rows : [];

    const rowsOut: Array<Record<string, unknown>> = [];
    let validCount = 0;

    for (const r of parsedRows) {
        const index = typeof r.index === 'number' ? r.index : 0;
        // prepare validator input: include fileType and row payload
        const validatorInput: JsonValue = { fileType: p.fileType, row: r as Record<string, unknown> } as JsonValue;
        const res = (await validateRow(validatorInput)) as unknown as {
            valid?: boolean;
            violations?: Array<{ field: string; code: string; message: string }>;
        };
        const isValid = res && typeof res.valid === 'boolean' ? res.valid : true;
        if (isValid) validCount += 1;
        rowsOut.push({ index, valid: isValid, violations: res.violations ?? [] });
    }

    const summary = { total: rowsOut.length, valid: validCount, invalid: rowsOut.length - validCount };
    return { summary, rows: rowsOut } as JsonValue;
}
