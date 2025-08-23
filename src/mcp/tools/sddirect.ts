import path from 'path';
import {
  generateInvalidSDDirectRow,
  generateValidSDDirectRow,
  getSDDirectHeaders,
  mapSDDirectRowToRecord,
} from '../../lib/fileType/sddirect';
import { generateFileWithFs } from '../../lib/fileWriter/fileWriter';
import { nodeFs } from '../../lib/fileWriter/fsWrapper';
import type { Request as FileRequest } from '../../lib/types';
import type { RowHeader, RowRow } from '../schemas';
import { zSDDirectGenerateFileParams, zSDDirectGetRowParams } from '../schemas';
import { parseOrInvalidParams } from '../validation';

function buildHeaders(): RowHeader[] {
  return getSDDirectHeaders().map((h, i) => ({ name: h, order: i + 1 }));
}

function toRow(fields: Record<string, unknown>, headers: RowHeader[]): RowRow {
  return { fields: headers.map((h) => ({ value: String(fields[h.name] ?? ''), order: h.order })) };
}

export function getValidRow(params: { sun: string }): {
  headers: RowHeader[];
  rows: RowRow[];
  metadata: { fileType: 'SDDirect'; sun: string; rowKind: 'valid'; generatedAt: string };
} {
  const { sun } = parseOrInvalidParams(zSDDirectGetRowParams, params);
  const headers = buildHeaders();
  const rec = generateValidSDDirectRow({
    fileType: 'SDDirect',
    canInlineEdit: true,
  } as FileRequest);
  return {
    headers,
    rows: [toRow(mapSDDirectRowToRecord(rec), headers)],
    metadata: {
      fileType: 'SDDirect',
      sun,
      rowKind: 'valid',
      generatedAt: new Date().toISOString(),
    },
  };
}

export function getInvalidRow(params: { sun: string }): {
  headers: RowHeader[];
  rows: RowRow[];
  metadata: { fileType: 'SDDirect'; sun: string; rowKind: 'invalid'; generatedAt: string };
} {
  const { sun } = parseOrInvalidParams(zSDDirectGetRowParams, params);
  const headers = buildHeaders();
  const rec = generateInvalidSDDirectRow({
    fileType: 'SDDirect',
    canInlineEdit: true,
    defaultValues: { originatingAccountDetails: { canBeInvalid: true } },
  } as FileRequest);
  return {
    headers,
    rows: [toRow(mapSDDirectRowToRecord(rec), headers)],
    metadata: {
      fileType: 'SDDirect',
      sun,
      rowKind: 'invalid',
      generatedAt: new Date().toISOString(),
    },
  };
}

export async function generateFile(params: {
  sun: string;
  numberOfRows?: number;
  hasInvalidRows?: boolean;
  includeHeaders?: boolean;
  includeOptionalFields?: boolean | string[];
  outputPath?: string;
}): Promise<{
  fileType: 'SDDirect';
  sun: string;
  fileName: string;
  outputPath: string;
  rowsWritten: number;
  includeHeadersEffective: boolean;
  processingDate: string;
  warnings?: string[];
}> {
  const { sun, numberOfRows, hasInvalidRows, includeHeaders, includeOptionalFields, outputPath } =
    parseOrInvalidParams(zSDDirectGenerateFileParams, params);
  const normalized: FileRequest = {
    fileType: 'SDDirect',
    canInlineEdit: true,
    numberOfRows: numberOfRows ?? 15,
    hasInvalidRows: hasInvalidRows ?? false,
    includeHeaders: includeHeaders ?? true,
    includeOptionalFields:
      (Array.isArray(includeOptionalFields)
        ? (includeOptionalFields as string[])
        : includeOptionalFields) ?? true,
    outputPath: outputPath ?? path.join(process.cwd(), 'output', 'SDDirect', sun),
  } as FileRequest;
  if (!nodeFs.existsSync(normalized.outputPath!))
    nodeFs.mkdirSync(normalized.outputPath!, { recursive: true });
  const filePath = await generateFileWithFs(normalized, nodeFs);
  const relFilePath = filePath.replace(process.cwd() + path.sep, '').replace(/\\/g, '/');
  return {
    fileType: 'SDDirect',
    sun,
    fileName: path.basename(filePath),
    outputPath: path.dirname(relFilePath),
    rowsWritten: normalized.numberOfRows ?? 0,
    includeHeadersEffective: Boolean(normalized.includeHeaders),
    processingDate: '',
  };
}
