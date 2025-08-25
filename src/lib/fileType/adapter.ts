import type { OptionalField, Request } from "../types";

export type PreviewParams = {
  sun: string;
  fileType: "EaziPay" | "SDDirect" | "Bacs18PaymentLines";
  numberOfRows?: number;
  includeOptionalFields?: boolean | string[];
  hasInvalidRows?: boolean;
  includeHeaders?: boolean; // SDDirect only
  forInlineEditing?: boolean;
  processingDate?: string;
  dateFormat?: "YYYY-MM-DD" | "DD-MMM-YYYY" | "DD/MM/YYYY";
  variant?: "DAILY" | "MULTI"; // Bacs18PaymentLines only
};

export type PreviewResult = {
  content: string;
  meta: {
    rows: number;
    columns: number;
    header: "H" | "NH";
    validity: "V" | "I";
    fileType: PreviewParams["fileType"];
    sun: string;
  };
};

export interface FileTypeAdapter {
  // Build preview rows (string fields per row)
  buildPreviewRows(params: PreviewParams): string[][];
  // Serialize rows to content
  serialize(rows: string[][], params: PreviewParams): string;
  // Compute meta for the preview
  previewMeta(rows: string[][], params: PreviewParams): PreviewResult["meta"];
  // Build a single row for row.generate
  buildRow(params: RowGenerateParams): RowGenerateResult;
}

export function computeInvalidRowsCap(numberOfRows: number, forInline: boolean | undefined): number {
  const cap = forInline ? 49 : numberOfRows;
  return Math.max(0, Math.min(Math.floor(numberOfRows / 2), cap));
}

// CSV escaping: quote fields containing comma/quote/newline, double quotes inside
export function toCsvLine(fields: string[]): string {
  return fields
    .map((f) => {
      if (f.includes('"') || f.includes(",") || f.includes("\n")) {
        return `"${f.replace(/"/g, '""')}"`;
      }
      return f;
    })
    .join(",");
}

export function toInternalRequest(fileType: "EaziPay" | "SDDirect" | "Bacs18PaymentLines", p: PreviewParams): Request {
  return {
    fileType,
    canInlineEdit: p.forInlineEditing ?? true,
    includeHeaders: fileType === "SDDirect" ? (p.includeHeaders ?? true) : undefined,
    numberOfRows: p.numberOfRows,
    hasInvalidRows: p.hasInvalidRows,
    includeOptionalFields: Array.isArray(p.includeOptionalFields)
      ? (p.includeOptionalFields as string[] as OptionalField[])
      : p.includeOptionalFields ?? undefined,
    dateFormat: fileType === "EaziPay" ? p.dateFormat : undefined,
    processingDate: p.processingDate,
  };
}

export type RowGenerateParams = {
  sun: string;
  fileType: "EaziPay" | "SDDirect" | "Bacs18PaymentLines";
  validity: "valid" | "invalid";
  includeOptionalFields?: boolean | string[]; // SDDirect only
  forInlineEditing?: boolean;
  processingDate?: string;
  dateFormat?: "YYYY-MM-DD" | "DD-MMM-YYYY" | "DD/MM/YYYY"; // EaziPay only
  variant?: "DAILY" | "MULTI"; // Bacs18PaymentLines only
};

export type RowGenerateResult = {
  row: { fields: string[]; asLine: string };
  issues?: unknown[];
};

