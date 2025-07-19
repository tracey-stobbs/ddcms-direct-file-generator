/**
 * SDDirect CSV File Generator
 * Generates CSV files in the exact SDDirect format with proper field order
 */
import { SDDirectRecord } from '../types/sddirect';
import { logger } from '../lib/logger';
import { generateRecords } from './dataGeneration';

/**
 * Request interface for file generation
 */
export interface FileGenerationRequest {
  fileType: 'SDDirect' | 'Bacs18PaymentLines' | 'Bacs18StandardFile';
  canInlineEdit: boolean;
  includeHeaders?: boolean;
  numberOfRows?: number;
  hasInvalidRows?: boolean;
  includeOptionalFields?: boolean;
  outputPath?: string;
}

/**
 * Response interface for file generation
 */
export interface FileGenerationResponse {
  success: boolean;
  filePath?: string;
  error?: string;
  metadata?: {
    recordCount: number;
    validRecords: number;
    invalidRecords: number;
    columnCount: number;
    hasHeaders: boolean;
  };
}

/**
 * Default request values
 */
export const DEFAULT_REQUEST: Required<FileGenerationRequest> = {
  fileType: 'SDDirect',
  canInlineEdit: true,
  includeHeaders: true,
  numberOfRows: 15,
  hasInvalidRows: false,
  includeOptionalFields: true,
  outputPath: './output'
};

/**
 * Generate filename based on specification
 */
export function generateFileName(
  fileType: string,
  includeOptionalFields: boolean,
  numberOfRows: number,
  includeHeaders: boolean,
  hasInvalidRows: boolean
): string {
  const columnCount = includeOptionalFields ? '11' : '06';
  const headers = includeHeaders ? 'H' : 'NH';
  const validity = hasInvalidRows ? 'I' : 'V';
  const timestamp = new Date().toISOString()
    .replace(/[-:]/g, '')
    .replace(/T/, '_')
    .substring(0, 15); // YYYYMMDD_HHMMSS

  return `${fileType}_${columnCount}_x_${numberOfRows}_${headers}_${validity}_${timestamp}.csv`;
}

/**
 * Convert SDDirectRecord to CSV row
 */
export function recordToCsvRow(record: SDDirectRecord, includeOptionalFields: boolean): string {
  const fields: string[] = [
    record.destinationAccountName,
    record.destinationSortCode,
    record.destinationAccountNumber,
    record.paymentReference,
    record.amount,
    record.transactionCode
  ];

  if (includeOptionalFields) {
    fields.push(
      record.realtimeInformationChecksum || '',
      record.payDate || '',
      record.originatingSortCode || '',
      record.originatingAccountNumber || '',
      record.originatingAccountName || ''
    );
  }

  // Escape fields that contain commas, quotes, or newlines
  const escapedFields = fields.map(field => {
    if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  });

  return escapedFields.join(',');
}

/**
 * Generate CSV header row
 */
export function generateCsvHeader(includeOptionalFields: boolean): string {
  const headers = [
    'Destination Account Name',
    'Destination Sort Code',
    'Destination Account Number',
    'Payment Reference',
    'Amount',
    'Transaction code'
  ];

  if (includeOptionalFields) {
    headers.push(
      'Realtime Information Checksum',
      'Pay Date',
      'Originating Sort Code',
      'Originating Account Number',
      'Originating Account Name'
    );
  }

  return headers.join(',');
}

/**
 * Generate complete CSV content
 */
export function generateCsvContent(
  records: SDDirectRecord[],
  includeHeaders: boolean,
  includeOptionalFields: boolean
): string {
  const lines: string[] = [];

  // Add header row if requested
  if (includeHeaders) {
    lines.push(generateCsvHeader(includeOptionalFields));
  }

  // Add data rows
  records.forEach(record => {
    lines.push(recordToCsvRow(record, includeOptionalFields));
  });

  return lines.join('\n');
}

/**
 * Calculate metadata from records
 */
export function calculateMetadata(
  records: SDDirectRecord[],
  hasInvalidRows: boolean,
  includeOptionalFields: boolean,
  includeHeaders: boolean,
  canInlineEdit: boolean = true
): NonNullable<FileGenerationResponse['metadata']> {
  let invalidRecords = 0;
  
  if (hasInvalidRows) {
    // Calculate 50% invalid records, rounded down
    invalidRecords = Math.floor(records.length * 0.5);
    
    // Apply canInlineEdit limit
    if (canInlineEdit && invalidRecords > 49) {
      invalidRecords = 49;
    }
  }
  
  const validRecords = records.length - invalidRecords;

  return {
    recordCount: records.length,
    validRecords,
    invalidRecords,
    columnCount: includeOptionalFields ? 11 : 6,
    hasHeaders: includeHeaders
  };
}

/**
 * Main file generation function
 */
export function generateFile(request: Partial<FileGenerationRequest>): {
  content: string;
  filename: string;
  metadata: NonNullable<FileGenerationResponse['metadata']>;
} {
  // Merge with defaults
  const fullRequest: Required<FileGenerationRequest> = {
    ...DEFAULT_REQUEST,
    ...request
  };

  logger.info(`Generating ${fullRequest.fileType} file with ${fullRequest.numberOfRows} rows`);

  // Validate request
  if (fullRequest.fileType !== 'SDDirect') {
    throw new Error(`Unsupported file type: ${fullRequest.fileType}. Only SDDirect is currently supported.`);
  }

  if (fullRequest.numberOfRows <= 0) {
    throw new Error('Number of rows must be greater than 0');
  }

  // Generate records
  const records = generateRecords(
    fullRequest.numberOfRows,
    fullRequest.hasInvalidRows,
    fullRequest.includeOptionalFields,
    fullRequest.canInlineEdit
  );

  // Generate CSV content
  const content = generateCsvContent(
    records,
    fullRequest.includeHeaders,
    fullRequest.includeOptionalFields
  );

  // Generate filename
  const filename = generateFileName(
    fullRequest.fileType,
    fullRequest.includeOptionalFields,
    fullRequest.numberOfRows,
    fullRequest.includeHeaders,
    fullRequest.hasInvalidRows
  );

  // Calculate metadata
  const metadata = calculateMetadata(
    records,
    fullRequest.hasInvalidRows,
    fullRequest.includeOptionalFields,
    fullRequest.includeHeaders,
    fullRequest.canInlineEdit
  );

  logger.info(`Generated file: ${filename} with ${metadata.recordCount} records`);

  return {
    content,
    filename,
    metadata
  };
}
