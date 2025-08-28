import { DateTime } from 'luxon';
import path from 'path';
import type { PreviewParams } from '../fileType/adapter';
import { getFileTypeAdapter } from '../fileType/factory';
import type { Request } from '../types';

export function toPreviewParams(request: Request, sun: string): PreviewParams {
    return {
        sun,
        fileType: request.fileType as 'EaziPay' | 'SDDirect' | 'Bacs18PaymentLines',
        numberOfRows: request.numberOfRows,
        includeOptionalFields: request.includeOptionalFields,
        hasInvalidRows: request.hasInvalidRows,
        includeHeaders: request.includeHeaders,
        forInlineEditing: request.canInlineEdit,
        processingDate: request.processingDate,
        dateFormat: request.fileType === 'EaziPay' ? request.dateFormat : undefined,
    } as const;
}

export function getFileExtension(fileType: string): string {
    switch (fileType) {
        case 'SDDirect':
            return 'csv';
        case 'EaziPay':
            return Math.random() < 0.5 ? 'csv' : 'txt';
        case 'Bacs18PaymentLines':
            return 'txt';
        case 'Bacs18StandardFile':
            return 'bacs';
        default:
            return 'csv';
    }
}

export function computeFilenameAndContent(
    request: Request,
    sun: string,
): {
    filePath: string;
    content: string;
    meta: {
        rows: number;
        columns: number;
        header: string;
        validity: string;
        extension: string; // includes leading dot
        fileType: string;
        sun: string;
    };
} {
    const now = DateTime.now();
    const timestamp = now.toFormat('yyyyLLdd_HHmmss');
    const fileType = request.fileType;

    const adapter = getFileTypeAdapter(fileType);
    const params = toPreviewParams(request, sun);
    const rows = adapter.buildPreviewRows(params);
    const meta = adapter.previewMeta(rows, params);
    const content = adapter.serialize(rows, params);

    const columnCount = String(meta.columns).padStart(2, '0');
    const headerToken = meta.header; // "H" | "NH"
    const validity = meta.validity; // "V" | "I"
    const extension = getFileExtension(fileType);

    const filename = `${fileType}_${columnCount}_x_${meta.rows}_${headerToken}_${validity}_${timestamp}.${extension}`;
    const outputDir = request.outputPath || path.join(process.cwd(), 'output', fileType, sun);
    const filePath = path.join(outputDir, filename);
    return {
        filePath,
        content,
        meta: {
            rows: meta.rows,
            columns: meta.columns,
            header: meta.header,
            validity: meta.validity,
            extension: `.${extension}`,
            fileType,
            sun,
        },
    };
}
