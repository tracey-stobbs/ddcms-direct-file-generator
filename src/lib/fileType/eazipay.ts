import { faker } from '@faker-js/faker';
import { DateTime } from 'luxon';
import { AddWorkingDays } from '../calendar';
import type { FileSystem } from '../fileWriter/fsWrapper';
import type { EaziPayDateFormat, EaziPaySpecificFields, Request } from '../types';
import { DateFormatter } from '../utils/dateFormatter';
import { EaziPayValidator } from '../validators/eazipayValidator';
import type { FileTypeAdapter, PreviewParams } from './adapter';
import { computeInvalidRowsCap, toCsvLine, toInternalRequest } from './adapter';

/**
 * Generate valid EaziPay row data
 * @param request - The request configuration
 * @param dateFormat - The date format to use for dates
 * @param trailerFormat - The trailer format to use
 * @returns Valid EaziPay row data
 */
export function generateValidEaziPayRow(
    request: Request,
    dateFormat: EaziPayDateFormat,
): EaziPaySpecificFields {
    const originatingDetails = getOriginatingDetails(request);
    const transactionCode = faker.helpers.arrayElement(['01', '17', '18', '99', '0C', '0N', '0S']);

    return {
        transactionCode,
        originatingSortCode: originatingDetails.sortCode,
        originatingAccountNumber: originatingDetails.accountNumber,
        destinationSortCode: faker.finance.routingNumber().slice(0, 6),
        destinationAccountNumber: faker.finance.accountNumber(8),
        destinationAccountName: faker.company.name().slice(0, 18),
        fixedZero: 0,
        amount: generateAmount(transactionCode),
        processingDate: generateProcessingDate(transactionCode, dateFormat),
        empty: undefined,
        sunName: faker.company.name().slice(0, 18),
        paymentReference: generatePaymentReference(),
        sunNumber: generateSunNumber(transactionCode),
        emptyTrailer1: undefined,
        emptyTrailer2: undefined,
    };
}

/**
 * Generate invalid EaziPay row data
 * @param request - The request configuration
 * @param dateFormat - The date format to use for dates
 * @param trailerFormat - The trailer format to use
 * @returns Invalid EaziPay row data
 */
export function generateInvalidEaziPayRow(
    request: Request,
    dateFormat: EaziPayDateFormat,
): EaziPaySpecificFields {
    // Start with a valid row
    const row = generateValidEaziPayRow(request, dateFormat);

    // List of fields that can be invalidated
    const invalidatableFields = [
        'transactionCode',
        'originatingSortCode',
        'originatingAccountNumber',
        'destinationSortCode',
        'destinationAccountNumber',
        'destinationAccountName',
        'bacsReference',
        'amount',
        'fixedZero',
        'sunNumber',
    ];

    // Randomly pick 1-3 fields to invalidate
    const numInvalid = faker.number.int({ min: 1, max: 3 });
    const fieldsToInvalidate = faker.helpers.shuffle(invalidatableFields).slice(0, numInvalid);

    for (const fieldName of fieldsToInvalidate) {
        // Type-safe field invalidation
        switch (fieldName) {
            case 'transactionCode':
                row.transactionCode = generateInvalidFieldValue(
                    fieldName,
                    row.transactionCode,
                ) as string;
                break;
            case 'originatingSortCode':
                row.originatingSortCode = generateInvalidFieldValue(
                    fieldName,
                    row.transactionCode,
                ) as string;
                break;
            case 'originatingAccountNumber':
                row.originatingAccountNumber = generateInvalidFieldValue(
                    fieldName,
                    row.transactionCode,
                ) as string;
                break;
            case 'destinationSortCode':
                row.destinationSortCode = generateInvalidFieldValue(
                    fieldName,
                    row.transactionCode,
                ) as string;
                break;
            case 'destinationAccountNumber':
                row.destinationAccountNumber = generateInvalidFieldValue(
                    fieldName,
                    row.transactionCode,
                ) as string;
                break;
            case 'destinationAccountName':
                row.destinationAccountName = generateInvalidFieldValue(
                    fieldName,
                    row.transactionCode,
                ) as string;
                break;
            case 'bacsReference':
                row.paymentReference = generateInvalidFieldValue(
                    fieldName,
                    row.transactionCode,
                ) as string;
                break;
            case 'amount':
                row.amount = generateInvalidFieldValue(fieldName, row.transactionCode) as number;
                break;
            case 'fixedZero':
                row.fixedZero = generateInvalidFieldValue(fieldName, row.transactionCode) as 0;
                break;
            case 'sunNumber':
                row.sunNumber = generateInvalidFieldValue(fieldName, row.transactionCode) as
                    | string
                    | undefined;
                break;
        }
    }

    return row;
}

/**
 * Get originating account details from request or generate defaults
 */
function getOriginatingDetails(request: Request): {
    sortCode: string;
    accountNumber: string;
    accountName: string;
} {
    const details = request.defaultValues?.originatingAccountDetails;
    return {
        sortCode: details?.sortCode || faker.finance.routingNumber().slice(0, 6),
        accountNumber: details?.accountNumber || faker.finance.accountNumber(8),
        accountName: details?.accountName || faker.company.name().slice(0, 18),
    };
}

/**
 * Generate a valid payment reference
 * Must be > 6 and < 18 characters, start with alphanumeric, not start with "DDIC" or space
 */
function generatePaymentReference(): string {
    let ref = faker.string.alphanumeric(faker.number.int({ min: 7, max: 17 }));

    // Ensure it meets validation rules
    while (
        /^( |DDIC)/.test(ref) || // Doesn't start with space or DDIC
        /^([A-Za-z0-9])\\1+$/.test(ref) || // Not all identical characters
        ref.length <= 6 ||
        ref.length >= 18 // Length constraints
    ) {
        ref = faker.string.alphanumeric(faker.number.int({ min: 7, max: 17 }));
    }

    return ref;
}

/**
 * Generate amount based on transaction code rules
 */
function generateAmount(transactionCode: string): number {
    // Special rule: If Transaction Code is 0C, 0N, or 0S → Amount must be 0
    if (['0C', '0N', '0S'].includes(transactionCode)) {
        return 0;
    }

    return faker.number.int({ min: 1, max: 999999 });
}

/**
 * Generate processing date (2+ working days in future)
 */
function generateProcessingDate(transactionCode: string, dateFormat: EaziPayDateFormat): string {
    const today = DateTime.now();
    let targetDate: DateTime;

    // Special rule: If Transaction Code is 0N, 0C, or 0S → EXACTLY 2 working days in future
    if (['0C', '0N', '0S'].includes(transactionCode)) {
        targetDate = AddWorkingDays(today, 2);
    } else {
        // At least 2 working days, up to 30 days in future
        const workingDays = faker.number.int({ min: 2, max: 30 });
        targetDate = AddWorkingDays(today, workingDays);
    }

    return DateFormatter.formatEaziPayDate(targetDate, dateFormat);
}

/**
 * Generate SUN Number based on transaction code rules
 */
function generateSunNumber(transactionCode: string): string | undefined {
    // If Transaction Code is NOT 0C, 0N, or 0S → must be null/undefined
    if (!EaziPayValidator.isSunNumberAllowed(transactionCode)) {
        return undefined;
    }

    // For allowed transaction codes, randomly decide whether to include SUN number
    if (faker.datatype.boolean()) {
        return faker.string.alphanumeric(faker.number.int({ min: 5, max: 10 }));
    }

    return undefined;
}

/**
 * Generate invalid value for a specific field
 */
function generateInvalidFieldValue(fieldName: string, transactionCode: string): string | number {
    switch (fieldName) {
        case 'transactionCode':
            return faker.helpers.arrayElement(['XX', 'INVALID', '00']);

        case 'originatingSortCode':
        case 'destinationSortCode':
            return faker.string.alpha({ length: 6 }); // Non-numeric

        case 'originatingAccountNumber':
        case 'destinationAccountNumber':
            return faker.string.alpha({ length: 8 }); // Non-numeric

        case 'destinationAccountName':
            return faker.string.alpha({ length: 25 }); // Too long (>18 chars)

        case 'bacsReference':
            return 'DDIC' + faker.string.alphanumeric(5); // Starts with DDIC (invalid)

        case 'amount':
            return -999; // Negative amount

        case 'fixedZero':
            return faker.number.int({ min: 1, max: 10 }); // Not zero

        case 'sunNumber':
            // If transaction code doesn't allow SUN number, but we provide one anyway
            if (!EaziPayValidator.isSunNumberAllowed(transactionCode)) {
                return faker.string.alphanumeric(5); // Invalid because not allowed
            }
            // If allowed, return valid value (this shouldn't make it invalid, but we need some invalid value)
            return faker.string.alpha({ length: 50 }); // Too long

        case 'eaziPayTrailer':
            return faker.helpers.arrayElement([',,,,,,,,', ',,,,,,,,,,', 'invalid']); // Wrong comma count or invalid

        default:
            return 'INVALID';
    }
}

/**
 * Convert EaziPaySpecificFields to array format for CSV output
 */
export function formatEaziPayRowAsArray(fields: EaziPaySpecificFields): string[] {
    return [
        fields.transactionCode,
        fields.originatingSortCode,
        fields.originatingAccountNumber,
        fields.destinationSortCode,
        fields.destinationAccountNumber,
        fields.destinationAccountName,
        fields.fixedZero.toString(),
        fields.amount.toString(),
        fields.processingDate,
        fields.empty === undefined ? '' : String(fields.empty),
        fields.sunName,
        fields.paymentReference,
        fields.sunNumber || '',
        '',
    ];
}

/**
 * Generate EaziPay file using the main file writer
 * @param request - The request configuration
 * @param fs - The file system wrapper
 * @returns Promise resolving to the generated file path
 */
export async function generateEaziPayFile(request: Request, fs: FileSystem): Promise<string> {
    // Deprecated in new API flow; kept for backward compatibility in tests
    const { generateFileWithFs } = await import('../fileWriter/fileWriter');
    const sun = request.defaultValues?.originatingAccountDetails?.sortCode ?? 'DEFAULT';
    const result = await generateFileWithFs(request, fs, sun);
    return result.filePath;
}

/**
 * Get the field headers for EaziPay (never used since EaziPay has no headers)
 */
export function getEaziPayHeaders(): string[] {
    return [
        'Transaction Code',
        'Originating Sort Code',
        'Originating Account Number',
        'Destination Sort Code',
        'Destination Account Number',
        'Destination Account Name',
        'Fixed Zero',
        'Amount',
        'Processing Date',
        'Empty',
        'SUN Name',
        'Payment Reference',
        'SUN Number',
        'Empty Trailer 1',
    ];
}

export const eaziPayAdapter: FileTypeAdapter = {
    buildPreviewRows(params: PreviewParams): string[][] {
        const numberOfRows = params.numberOfRows ?? 15;
        const dateFormat = params.dateFormat || DateFormatter.getRandomDateFormat();
        const rows: string[][] = [];
        const invalidRows = params.hasInvalidRows
            ? computeInvalidRowsCap(numberOfRows, params.forInlineEditing)
            : 0;
        for (let i = 0; i < numberOfRows; i++) {
            const rowData =
                params.hasInvalidRows && i > 1 && i < invalidRows
                    ? generateInvalidEaziPayRow(toInternalRequest('EaziPay', params), dateFormat)
                    : generateValidEaziPayRow(toInternalRequest('EaziPay', params), dateFormat);
            rows.push(formatEaziPayRowAsArray(rowData));
        }
        return rows;
    },
    serialize(rows: string[][]): string {
        return rows.map((r) => toCsvLine(r)).join('\n');
    },
    previewMeta(rows: string[][], params: PreviewParams) {
        return {
            rows: rows.length,
            columns: EaziPayValidator.getColumnCount(),
            header: 'NH',
            validity: params.hasInvalidRows ? 'I' : 'V',
            fileType: 'EaziPay',
            sun: params.sun,
        };
    },
    buildRow(params) {
        const req = toInternalRequest('EaziPay', {
            sun: params.sun,
            fileType: 'EaziPay',
            numberOfRows: 1,
            forInlineEditing: params.forInlineEditing,
            processingDate: params.processingDate,
            dateFormat: params.dateFormat,
        });
        const data =
            params.validity === 'invalid'
                ? generateInvalidEaziPayRow(req, params.dateFormat ?? 'YYYY-MM-DD')
                : generateValidEaziPayRow(req, params.dateFormat ?? 'YYYY-MM-DD');
        const fields = formatEaziPayRowAsArray(data);
        return { row: { fields, asLine: toCsvLine(fields) } };
    },
};
