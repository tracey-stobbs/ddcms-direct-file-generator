import path from 'path';
import {
    generateEaziPayFile as genEaziPayFile,
    generateInvalidEaziPayRow,
    generateValidEaziPayRow,
    getEaziPayHeaders,
    mapEaziPayFieldsToRecord,
} from '../../lib/fileType/eazipay';
import { nodeFs } from '../../lib/fileWriter/fsWrapper';
import type { Request as FileRequest } from '../../lib/types';
import { DateFormatter } from '../../lib/utils/dateFormatter';
import type {
    EazipayGenerateFileParams,
    EazipayGenerateFileResult,
    EazipayGetRowParams,
    EazipayGetRowResult,
    RowHeader,
    RowRow,
} from '../schemas';
import { zEazipayGenerateFileParams, zEazipayGetRowParams } from '../schemas';
import { parseOrInvalidParams } from '../validation';

function buildHeaders(): RowHeader[] {
    return getEaziPayHeaders().map((h, i) => ({ name: h, order: i + 1 }));
}

function toRow(fields: Record<string, unknown>, headers: RowHeader[]): RowRow {
    return {
        fields: headers.map((h) => {
            const v = fields[h.name] as string | number | boolean | undefined;
            return { value: v === undefined ? '' : v, order: h.order };
        }),
    };
}

export function getValidRow(params: EazipayGetRowParams): EazipayGetRowResult {
    const { sun, dateFormat } = parseOrInvalidParams(zEazipayGetRowParams, params);
    const headers = buildHeaders();
    const df = dateFormat ?? DateFormatter.getRandomDateFormat();
    const fields = generateValidEaziPayRow(
        { fileType: 'EaziPay', canInlineEdit: true } as FileRequest,
        df,
    );
    const row = toRow(mapEaziPayFieldsToRecord(fields), headers);
    return {
        headers,
        rows: [row],
        metadata: {
            fileType: 'EaziPay',
            sun,
            rowKind: 'valid',
            generatedAt: new Date().toISOString(),
        },
    };
}

export function getInvalidRow(params: EazipayGetRowParams): EazipayGetRowResult {
    const { sun, dateFormat } = parseOrInvalidParams(zEazipayGetRowParams, params);
    const headers = buildHeaders();
    const df = dateFormat ?? DateFormatter.getRandomDateFormat();
    const fields = generateInvalidEaziPayRow(
        { fileType: 'EaziPay', canInlineEdit: true } as FileRequest,
        df,
    );
    const row = toRow(mapEaziPayFieldsToRecord(fields), headers);
    return {
        headers,
        rows: [row],
        metadata: {
            fileType: 'EaziPay',
            sun,
            rowKind: 'invalid',
            generatedAt: new Date().toISOString(),
        },
    };
}

export async function generateFile(
    params: EazipayGenerateFileParams,
): Promise<EazipayGenerateFileResult> {
    const parsed = parseOrInvalidParams(zEazipayGenerateFileParams, params);
    const { sun } = parsed;
    const numberOfRows = parsed.numberOfRows ?? 15;
    const hasInvalidRows = parsed.hasInvalidRows ?? false;
    const dateFormat = parsed.dateFormat ?? DateFormatter.getRandomDateFormat();

    const normalized: FileRequest = {
        fileType: 'EaziPay',
        canInlineEdit: parsed.forInlineEditing ?? true,
        numberOfRows,
        hasInvalidRows,
        dateFormat,
        outputPath: parsed.outputPath ?? path.join(process.cwd(), 'output', 'EaziPay', sun),
    } as FileRequest;

    if (!nodeFs.existsSync(normalized.outputPath!))
        nodeFs.mkdirSync(normalized.outputPath!, { recursive: true });
    const filePath = await genEaziPayFile(normalized, nodeFs);
    const relFilePath = filePath.replace(process.cwd() + path.sep, '').replace(/\\/g, '/');
    return {
        fileType: 'EaziPay',
        sun,
        fileName: path.basename(filePath),
        outputPath: path.dirname(relFilePath),
        rowsWritten: numberOfRows,
        includeHeadersEffective: false,
        processingDate: '',
    };
}
