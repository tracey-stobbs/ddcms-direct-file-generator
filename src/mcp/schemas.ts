// Shared MCP types for tool params/results and error model
import type { EaziPayDateFormat, FileTypeLiteral } from '../lib/types';

export type McpJsonPrimitive = string | number | boolean | null;

export interface McpError {
  status: number; // HTTP-like status for familiarity
  code: string; // machine code e.g., VALIDATION_ERROR
  message: string;
  details?: McpJsonPrimitive[];
}

export interface RowHeader {
  name: string;
  order: number;
}
export interface RowField {
  value: string | number | boolean | '';
  order: number;
}
export interface RowRow {
  fields: RowField[];
}

// EaziPay tools
export interface EazipayGetRowParams {
  sun: string; // 6-digit SUN
  rowCount?: number; // default 1
  dateFormat?: EaziPayDateFormat;
}

export interface EazipayGetRowResult {
  headers: RowHeader[];
  rows: RowRow[];
  metadata: { fileType: 'EaziPay'; sun: string; rowKind: 'valid' | 'invalid'; generatedAt: string };
}

export interface EazipayGenerateFileParams {
  sun: string; // 6-digit SUN
  numberOfRows?: number; // default 15
  hasInvalidRows?: boolean; // default false
  dateFormat?: EaziPayDateFormat;
  outputPath?: string; // default output/EaziPay/{sun}
  forInlineEditing?: boolean; // default true (maps to canInlineEdit)
}

export interface EazipayGenerateFileResult {
  fileType: 'EaziPay';
  sun: string;
  fileName: string;
  outputPath: string; // relative to cwd
  rowsWritten: number;
  includeHeadersEffective: false; // EaziPay never includes headers
  processingDate: string; // not enforced; echoed if provided
  warnings?: string[];
}

// Zod runtime schemas (co-located for simplicity)
import { z } from 'zod';

export const zSun = z.string().regex(/^\d{6}$/);
export const zEaziDate = z.enum(['YYYY-MM-DD', 'DD-MMM-YYYY', 'DD/MM/YYYY']);

export const zEazipayGetRowParams = z.object({
  sun: zSun,
  rowCount: z.number().int().positive().optional(),
  dateFormat: zEaziDate.optional(),
});

export const zEazipayGenerateFileParams = z.object({
  sun: zSun,
  numberOfRows: z.number().int().positive().optional(),
  hasInvalidRows: z.boolean().optional(),
  dateFormat: zEaziDate.optional(),
  outputPath: z.string().min(1).optional(),
  forInlineEditing: z.boolean().optional(),
});

export const zSDDirectGetRowParams = z.object({
  sun: zSun,
});

export const zSDDirectGenerateFileParams = z.object({
  sun: zSun,
  numberOfRows: z.number().int().positive().optional(),
  hasInvalidRows: z.boolean().optional(),
  includeHeaders: z.boolean().optional(),
  includeOptionalFields: z.union([z.boolean(), z.array(z.string())]).optional(),
  outputPath: z.string().min(1).optional(),
});

// Common tools (Epic E5)
export type CommonFileType = Extract<FileTypeLiteral, 'EaziPay' | 'SDDirect'>;

export interface CommonListSupportedFormatsResult {
  formats: Array<{
  fileType: CommonFileType;
    supportsHeaders: boolean;
  supportedDateFormats?: EaziPayDateFormat[];
    columnCounts: number[];
    fileNamePattern: string; // human-readable pattern with placeholders
    extensions: string[];
  }>;
}

export const zCommonPreviewFileNameParams = z.object({
  fileType: z.enum(['EaziPay', 'SDDirect']),
  sun: zSun,
  numberOfRows: z.number().int().positive().optional(),
  hasInvalidRows: z.boolean().optional(),
  includeHeaders: z.boolean().optional(), // SDDirect only
  includeOptionalFields: z.union([z.boolean(), z.array(z.string())]).optional(), // SDDirect only
});

export interface CommonPreviewFileNameResult {
  fileType: CommonFileType;
  sun: string;
  fileName: string;
  columnCount: number;
  extension: string;
  warnings?: string[];
}

export const zCommonValidateProcessingDateParams = z.object({
  fileType: z.enum(['EaziPay', 'SDDirect']),
  date: z.string(),
  dateFormat: z.union([zEaziDate, z.literal('YYYYMMDD')]).optional(),
});

export interface CommonValidateProcessingDateResult {
  valid: boolean;
  normalized?: string; // normalized to the canonical format per file type
  warnings?: string[];
  errors?: string[];
}

export const zCommonListOutputFilesParams = z.object({
  fileType: z.enum(['EaziPay', 'SDDirect']),
  sun: zSun,
  limit: z.number().int().positive().max(1000).optional(),
});

export interface CommonListOutputFilesResult {
  root: string; // relative root folder used
  files: Array<{ name: string; size: number; modified: string }>;
}

export const zCommonReadOutputFileParams = z.object({
  fileType: z.enum(['EaziPay', 'SDDirect']),
  sun: zSun,
  fileName: z.string().min(1),
  offset: z.number().int().min(0).optional(),
  length: z.number().int().positive().max(1024 * 1024).optional(),
  mode: z.enum(['utf8', 'base64']).optional(),
});

export interface CommonReadOutputFileResult {
  fileType: CommonFileType;
  sun: string;
  fileName: string;
  offset: number;
  length: number;
  mode: 'utf8' | 'base64';
  data: string;
}
