import { faker } from '@faker-js/faker';
import { DateTime } from 'luxon';
import { generateFileWithFs } from '../fileWriter/fileWriter';
import type { FileSystem } from '../fileWriter/fsWrapper';
import { Request } from '../types';
import type { FileTypeAdapter, PreviewParams } from './adapter';
import { computeInvalidRowsCap, toCsvLine, toInternalRequest } from './adapter';

// Helper: Generate a valid payment reference
function generatePaymentReference(): string {
    let ref = faker.string.alphanumeric(faker.number.int({ min: 7, max: 17 }));
    // Ensure it doesn't start with space or 'DDIC', and not all identical chars
    while (/^( |DDIC)/.test(ref) || /^([A-Za-z0-9])\1+$/.test(ref)) {
        ref = faker.string.alphanumeric(faker.number.int({ min: 7, max: 17 }));
    }
    return ref;
}

// Helper: Generate a valid pay date (3-30 working days in the future, not weekend/holiday)
function generatePayDate(): string {
    // For simplicity, just add 3-30 days and format as YYYYMMDD
    const days = faker.number.int({ min: 3, max: 30 });
    return DateTime.now().plus({ days }).toFormat('yyyyLLdd');
}

export const SDFields = {
    DestinationAccountName: 'Destination Account Name',
    DestinationSortCode: 'Destination Sort Code',
    DestinationAccountNumber: 'Destination Account Number',
    PaymentReference: 'Payment Reference',
    Amount: 'Amount',
    TransactionCode: 'Transaction code',
    RealtimeInformationChecksum: 'Realtime Information Checksum',
    PayDate: 'Pay Date',
    OriginatingSortCode: 'Originating Sort Code',
    OriginatingAccountNumber: 'Originating Account Number',
    OriginatingAccountName: 'Originating Account Name',
} as const;

function getOriginatingDetails(request: Request): Record<string, string> {
    const details = request.defaultValues?.originatingAccountDetails;
    return {
        [SDFields.OriginatingSortCode]: details?.sortCode || faker.finance.routingNumber(),
        [SDFields.OriginatingAccountNumber]:
            details?.accountNumber || faker.finance.accountNumber(8),
        [SDFields.OriginatingAccountName]:
            details?.accountName || faker.person.fullName().slice(0, 18),
    };
}

export function generateValidSDDirectRow(request: Request): Record<string, unknown> {
    const originating = getOriginatingDetails(request);
    return {
        [SDFields.DestinationAccountName]: faker.person.fullName().slice(0, 18),
        [SDFields.DestinationSortCode]: faker.finance.routingNumber().slice(0, 6),
        [SDFields.DestinationAccountNumber]: faker.finance.accountNumber(8),
        [SDFields.PaymentReference]: generatePaymentReference(),
        [SDFields.Amount]: faker.finance.amount({ min: 1, max: 10000, dec: 2 }),
        [SDFields.TransactionCode]: faker.helpers.arrayElement([
            '01',
            '17',
            '18',
            '99',
            '0C',
            '0N',
            '0S',
        ]),
        [SDFields.RealtimeInformationChecksum]: faker.helpers.arrayElement([
            '/' + faker.string.alpha({ length: 3, casing: 'upper' }),
            '0000',
            '',
        ]),
        [SDFields.PayDate]: generatePayDate(),
        ...originating,
    };
}

// Helper: Generate an invalid value for a given field
function generateInvalidValue(field: string): string {
    switch (field) {
        case SDFields.DestinationAccountName:
            return faker.string.alpha({ length: 25 }); // too long
        case SDFields.DestinationSortCode:
            return faker.string.alpha({ length: 6 }); // not numeric
        case SDFields.DestinationAccountNumber:
            return faker.string.alpha({ length: 8 }); // not numeric
        case SDFields.PaymentReference:
            return 'DDIC' + faker.string.alphanumeric(5); // starts with DDIC
        case SDFields.Amount:
            return '-9999.99'; // negative
        case SDFields.TransactionCode:
            return 'XX'; // invalid code
        case SDFields.RealtimeInformationChecksum:
            return '////'; // invalid pattern
        case SDFields.PayDate:
            return '20250101'; // not 3+ working days in future
        case SDFields.OriginatingSortCode:
            return 'ABCDEF'; // not numeric
        case SDFields.OriginatingAccountNumber:
            return 'ABCDEFGH'; // not numeric
        case SDFields.OriginatingAccountName:
            return faker.string.alpha({ length: 25 }); // too long
        default:
            return 'INVALID';
    }
}

export function generateInvalidSDDirectRow(request: Request): Record<string, unknown> {
    // Start with a valid row
    const row = generateValidSDDirectRow(request);
    // List of fields to potentially invalidate
    const fields = Object.keys(row);
    // Randomly pick 1-3 fields to invalidate
    const numInvalid = faker.number.int({ min: 1, max: 3 });
    const invalidFields = faker.helpers.shuffle(fields).slice(0, numInvalid);
    for (const field of invalidFields) {
        row[field] = generateInvalidValue(field);
    }
    // If canBeInvalid is true, force at least one originating field to be invalid
    if (request.defaultValues?.originatingAccountDetails?.canBeInvalid) {
        const origFields = [
            SDFields.OriginatingSortCode,
            SDFields.OriginatingAccountNumber,
            SDFields.OriginatingAccountName,
        ];
        const field = faker.helpers.arrayElement(origFields);
        row[field] = generateInvalidValue(field);
    }
    return row;
}
export async function generateSDDirectFile(request: Request, fs: FileSystem): Promise<string> {
    // Delegate to the tested fileWriter logic
    const sun = request.defaultValues?.originatingAccountDetails?.sortCode ?? 'DEFAULT';
    const result = await generateFileWithFs(request, fs, sun);
    return result.filePath;
}

function projectSDRow(row: Record<string, unknown>, headers: string[]): string[] {
    return headers.map((h) => {
        const v = row[h];
        return v === undefined || v === null ? '' : String(v);
    });
}

const SD_REQUIRED = [
    SDFields.DestinationAccountName,
    SDFields.DestinationSortCode,
    SDFields.DestinationAccountNumber,
    SDFields.PaymentReference,
    SDFields.Amount,
    SDFields.TransactionCode,
] as const;
const SD_OPTIONAL_ALL = [
    SDFields.RealtimeInformationChecksum,
    SDFields.PayDate,
    SDFields.OriginatingSortCode,
    SDFields.OriginatingAccountNumber,
    SDFields.OriginatingAccountName,
] as const;

function computeSDHeaders(includeOptionalFields: boolean | string[] | undefined): string[] {
    if (includeOptionalFields === false) return [...SD_REQUIRED];
    if (Array.isArray(includeOptionalFields)) {
        const allow = new Set(includeOptionalFields.map(String));
        return [...SD_REQUIRED, ...SD_OPTIONAL_ALL.filter((h) => allow.has(h))];
    }
    return [...SD_REQUIRED, ...SD_OPTIONAL_ALL];
}

export const sdDirectAdapter: FileTypeAdapter = {
    buildPreviewRows(params: PreviewParams): string[][] {
        const numberOfRows = params.numberOfRows ?? 15;
        const includeOptionalFields = params.includeOptionalFields ?? true;
        const headers = computeSDHeaders(includeOptionalFields);
        const rows: string[][] = [];
        const invalidRows = params.hasInvalidRows
            ? computeInvalidRowsCap(numberOfRows, params.forInlineEditing)
            : 0;
        for (let i = 0; i < numberOfRows; i++) {
            const data =
                params.hasInvalidRows && i < invalidRows
                    ? generateInvalidSDDirectRow(toInternalRequest('SDDirect', params))
                    : generateValidSDDirectRow(toInternalRequest('SDDirect', params));
            rows.push(projectSDRow(data, headers));
        }
        if (params.includeHeaders ?? true) {
            rows.unshift(computeSDHeaders(includeOptionalFields));
        }
        return rows;
    },
    serialize(rows: string[][]): string {
        return rows.map((r) => toCsvLine(r)).join('\n');
    },
    previewMeta(rows: string[][], params: PreviewParams) {
        const hasHeader = params.includeHeaders ?? true;
        const columns = computeSDHeaders(params.includeOptionalFields ?? true).length;
        const dataRowCount = hasHeader ? Math.max(0, rows.length - 1) : rows.length;
        return {
            rows: dataRowCount,
            columns,
            header: hasHeader ? 'H' : 'NH',
            validity: params.hasInvalidRows ? 'I' : 'V',
            fileType: 'SDDirect',
            sun: params.sun,
        };
    },
    buildRow(params) {
        const req = toInternalRequest('SDDirect', {
            sun: params.sun,
            fileType: 'SDDirect',
            numberOfRows: 1,
            includeOptionalFields: params.includeOptionalFields,
            forInlineEditing: params.forInlineEditing,
        });
        const data =
            params.validity === 'invalid'
                ? generateInvalidSDDirectRow(req)
                : generateValidSDDirectRow(req);
        const headers = computeSDHeaders(params.includeOptionalFields ?? true);
        const fields = projectSDRow(data, headers);
        return { row: { fields, asLine: toCsvLine(fields) } };
    },
};
