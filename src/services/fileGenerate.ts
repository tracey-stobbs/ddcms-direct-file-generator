import { DateTime } from 'luxon';

import { generateFile } from '../lib/fileWriter/fileWriter';

import type { Request } from '../lib/types';
import type { JsonValue } from '../mcp/router';
export async function generate(params: JsonValue): Promise<JsonValue> {
    const p = params as unknown as Request & { sun?: string; dryRun?: boolean };
    const sun = p.sun ?? 'DEFAULT';
    const generated = await generateFile(p, sun);
    return {
        filePath: generated.filePath,
        fileContent: generated.fileContent,
        meta: generated.meta,
    } as unknown as JsonValue;
}

export async function estimateFilename(params: JsonValue): Promise<JsonValue> {
    // Params are validated by MCP against documentation/Schemas/file/estimateFilename.params.json
    const p = params as unknown as {
        fileType: string;
        columns: number;
        rows: number;
        header: 'H' | 'NH';
        validity: 'V' | 'I';
        timestamp?: string; // yyyyLLdd_HHmmss
        extension?: '.csv' | '.txt';
    };

    const pad2 = (n: number): string => String(n).padStart(2, '0');
    const safeTimestamp =
        p.timestamp ??
        // Default to a deterministic-looking timestamp format (actual value is current time)
        DateTime.now().toFormat('yyyyLLdd_HHmmss');

    // Default extension deterministically per fileType when not provided
    const defaultExt = ((): string => {
        switch (p.fileType) {
            case 'SDDirect':
                return '.csv';
            case 'EaziPay':
                return '.csv'; // choose stable default for estimates
            case 'Bacs18PaymentLines':
                return '.txt';
            case 'Bacs18StandardFile':
                return '.bacs';
            default:
                return '.csv';
        }
    })();
    const ext = p.extension ?? defaultExt;

    const filename = `${p.fileType}_${pad2(p.columns)}_x_${p.rows}_${p.header}_${
        p.validity
    }_${safeTimestamp}${ext}`;
    return { filename } as JsonValue;
}
