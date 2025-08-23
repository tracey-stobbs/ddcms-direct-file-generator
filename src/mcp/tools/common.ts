import { listOutputFiles as libListOutputFiles, readOutputFile as libReadOutputFile } from '../../lib/fileReader/fileReader';
import { getDateValidator, getFileNamePreviewer, getSupportedFormats } from '../../lib/fileType/factory';
import { invalidParams } from '../errors';
import {
    type CommonFileType,
    type CommonListOutputFilesResult,
    type CommonPreviewFileNameResult,
    type CommonReadOutputFileResult,
    type CommonValidateProcessingDateResult,
    zCommonListOutputFilesParams,
    zCommonPreviewFileNameParams,
    zCommonReadOutputFileParams,
    zCommonValidateProcessingDateParams,
} from '../schemas';
import { parseOrInvalidParams } from '../validation';

// Path safety now handled in lib fileReader

export async function listSupportedFormats(): Promise<{
  formats: Array<{
    fileType: CommonFileType;
    supportsHeaders: boolean;
    supportedDateFormats?: ('YYYY-MM-DD' | 'DD-MMM-YYYY' | 'DD/MM/YYYY')[];
    columnCounts: number[];
    fileNamePattern: string;
    extensions: string[];
  }>;
}> {
  const formats = getSupportedFormats();
  return { formats };
}

export async function previewFileName(params: unknown): Promise<CommonPreviewFileNameResult> {
  const p = parseOrInvalidParams(zCommonPreviewFileNameParams, params);
  const previewer = getFileNamePreviewer(p.fileType);
  const result = previewer({
    fileType: p.fileType,
    sun: p.sun,
    numberOfRows: p.numberOfRows,
    hasInvalidRows: p.hasInvalidRows,
    includeHeaders: p.includeHeaders,
  });
  return {
    fileType: result.fileType,
    sun: result.sun,
    fileName: result.fileName,
    columnCount: result.columnCount,
    extension: result.extension,
  };
}

export async function validateProcessingDate(
  params: unknown
): Promise<CommonValidateProcessingDateResult> {
  const p = parseOrInvalidParams(zCommonValidateProcessingDateParams, params);
  const { fileType, date, dateFormat } = p;
  const validate = getDateValidator(fileType);
  const result = validate(date, { dateFormat });
  if (result.valid) {
    return { valid: true, normalized: result.normalized, warnings: result.warnings };
  }
  return result;
}

export async function listOutputFiles(params: unknown): Promise<CommonListOutputFilesResult> {
  const p = parseOrInvalidParams(zCommonListOutputFilesParams, params);
  try {
    return libListOutputFiles({ fileType: p.fileType, sun: p.sun, limit: p.limit });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Path traversal')) {
      throw invalidParams('Invalid path', { details: ['Path traversal detected'] });
    }
    throw invalidParams('List failed', { details: [msg] });
  }
}

export async function readOutputFile(params: unknown): Promise<CommonReadOutputFileResult> {
  const p = parseOrInvalidParams(zCommonReadOutputFileParams, params);
  try {
    return libReadOutputFile({
      fileType: p.fileType,
      sun: p.sun,
      fileName: p.fileName,
      offset: p.offset,
      length: p.length,
      mode: p.mode,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Path traversal')) {
      throw invalidParams('Invalid path', { details: ['Path traversal detected'] });
    }
    if (msg === 'File not found') {
      throw invalidParams('File not found', { details: [p.fileName] });
    }
    throw invalidParams('Read failed', { details: [msg] });
  }
}
