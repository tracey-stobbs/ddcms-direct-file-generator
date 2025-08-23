import { DateTime } from 'luxon';
import type { FileSystem } from '../fileWriter/fsWrapper';
import type { EaziPayDateFormat, Request } from '../types';
import { DateFormatter } from '../utils/dateFormatter';
import { generateEaziPayFile, validateEaziPayDate } from './eazipay';
import { generateSDDirectFile, validateSDDirectDate } from './sddirect';

export function getFileGenerator(
    type: string,
): (request: Request, fs: FileSystem) => Promise<string> {
    switch (type) {
        case 'SDDirect':
            return generateSDDirectFile;
        case 'EaziPay':
            return generateEaziPayFile;
        default:
            throw new Error(`Unknown file type: ${type}`);
    }
}

// Generic date validation contracts for per-file-type logic
export type DateValidationResult =
    | { valid: true; normalized: string; warnings?: string[] }
    | { valid: false; errors: string[] };

export type DateValidator = (date: string, opts?: { dateFormat?: string }) => DateValidationResult;

export function getDateValidator(type: string): DateValidator {
    switch (type) {
        case 'EaziPay': {
            return (date: string, opts?: { dateFormat?: string }) =>
                validateEaziPayDate(date, opts);
        }
        case 'SDDirect': {
            return (date: string) => validateSDDirectDate(date);
        }
        default:
            throw new Error(`Unknown file type: ${type}`);
    }
}

// Generic filename preview contracts and factory
export type SupportedPreviewFileType = 'EaziPay' | 'SDDirect';

export interface FileNamePreviewInput {
    fileType: SupportedPreviewFileType;
    sun: string;
    numberOfRows?: number;
    hasInvalidRows?: boolean;
    includeHeaders?: boolean;
}

export interface FileNamePreviewResult {
    fileType: SupportedPreviewFileType;
    sun: string;
    fileName: string;
    columnCount: number;
    extension: string;
}

export type FileNamePreviewer = (input: FileNamePreviewInput) => FileNamePreviewResult;

export function getFileNamePreviewer(type: string): FileNamePreviewer {
    switch (type) {
        case 'EaziPay':
            return (input: FileNamePreviewInput): FileNamePreviewResult => {
                const rows = input.numberOfRows ?? 15;
                const invalid = input.hasInvalidRows ?? false;
                const cc = '15';
                const ext = Math.random() < 0.5 ? 'csv' : 'txt';
                const ts = DateTime.now().toFormat('yyyyLLdd_HHmmss');
                const fileName = `EaziPay_${cc}_x_${rows}_NH_${invalid ? 'I' : 'V'}_${ts}.${ext}`;
                return {
                    fileType: 'EaziPay',
                    sun: input.sun,
                    fileName,
                    columnCount: 15,
                    extension: ext,
                };
            };
        case 'SDDirect':
            return (input: FileNamePreviewInput): FileNamePreviewResult => {
                const rows = input.numberOfRows ?? 15;
                const invalid = input.hasInvalidRows ?? false;
                const includeHeaders = input.includeHeaders ?? true;
                const cc = includeHeaders ? '11' : '06';
                const ext = 'csv';
                const ts = DateTime.now().toFormat('yyyyLLdd_HHmmss');
                const fileName = `SDDirect_${cc}_x_${rows}_${includeHeaders ? 'H' : 'NH'}_${
                    invalid ? 'I' : 'V'
                }_${ts}.${ext}`;
                return {
                    fileType: 'SDDirect',
                    sun: input.sun,
                    fileName,
                    columnCount: Number(cc),
                    extension: ext,
                };
            };
        default:
            throw new Error(`Unknown file type: ${type}`);
    }
}

// Supported formats metadata (for discovery/documentation)
export interface SupportedFormatInfo {
    fileType: SupportedPreviewFileType;
    supportsHeaders: boolean;
    supportedDateFormats?: EaziPayDateFormat[];
    columnCounts: number[];
    fileNamePattern: string;
    extensions: string[];
}

export function getSupportedFormats(): SupportedFormatInfo[] {
    return [
        {
            fileType: 'EaziPay',
            supportsHeaders: false,
            supportedDateFormats: [...DateFormatter.getAvailableFormats()],
            columnCounts: [15],
            fileNamePattern: 'EaziPay_{cc}_x_{rows}_NH_{V|I}_{YYYYMMDD_HHmmss}.{csv|txt}',
            extensions: ['csv', 'txt'],
        },
        {
            fileType: 'SDDirect',
            supportsHeaders: true,
            columnCounts: [6, 11],
            fileNamePattern: 'SDDirect_{cc}_x_{rows}_{H|NH}_{V|I}_{YYYYMMDD_HHmmss}.csv',
            extensions: ['csv'],
        },
    ];
}
