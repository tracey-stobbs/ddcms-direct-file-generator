import type { OptionalField, Request } from "../types";
import { DateFormatter } from "../utils/dateFormatter";
import { EaziPayValidator } from "../validators/eazipayValidator";
import { formatEaziPayRowAsArray, generateInvalidEaziPayRow, generateValidEaziPayRow } from "./eazipay";
import { generateInvalidSDDirectRow, generateValidSDDirectRow } from "./sddirect";

export type PreviewParams = {
  sun: string;
  fileType: "EaziPay" | "SDDirect";
  numberOfRows?: number;
  includeOptionalFields?: boolean | string[];
  hasInvalidRows?: boolean;
  includeHeaders?: boolean; // SDDirect only
  forInlineEditing?: boolean;
  processingDate?: string;
  dateFormat?: "YYYY-MM-DD" | "DD-MMM-YYYY" | "DD/MM/YYYY";
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

export interface FileTypePreviewStrategy {
  buildRows(params: PreviewParams): string[][];
  serialize(rows: string[][], params: PreviewParams): string;
  meta(rows: string[][], params: PreviewParams): PreviewResult["meta"];
}

export function getPreviewStrategy(fileType: PreviewParams["fileType"]): FileTypePreviewStrategy {
  switch (fileType) {
    case "EaziPay":
      return eaziPayStrategy;
    case "SDDirect":
      return sdDirectStrategy;
  }
}

function computeInvalidRowsCap(numberOfRows: number, forInline: boolean | undefined): number {
  const cap = forInline ? 49 : numberOfRows;
  return Math.max(0, Math.min(Math.floor(numberOfRows / 2), cap));
}

// CSV escaping: quote fields containing comma or quote, double quotes inside
export function toCsvLine(fields: string[]): string {
  return fields
    .map((f) => {
      if (f.includes("\"") || f.includes(",") || f.includes("\n")) {
        return `"${f.replace(/"/g, '""')}"`;
      }
      return f;
    })
    .join(",");
}

function normalizeOptionalFields(val: boolean | string[] | undefined): boolean | OptionalField[] | undefined {
  if (Array.isArray(val)) return val as OptionalField[];
  if (typeof val === "boolean") return val;
  return undefined;
}

const eaziPayStrategy: FileTypePreviewStrategy = {
  buildRows(params) {
    const numberOfRows = params.numberOfRows ?? 15;
    const dateFormat = params.dateFormat || DateFormatter.getRandomDateFormat();
    const rows: string[][] = [];
    const invalidRows = params.hasInvalidRows ? computeInvalidRowsCap(numberOfRows, params.forInlineEditing) : 0;
    for (let i = 0; i < numberOfRows; i++) {
      const rowData = params.hasInvalidRows && i > 1 && i < invalidRows
        ? generateInvalidEaziPayRow(toInternalRequest("EaziPay", params), dateFormat)
        : generateValidEaziPayRow(toInternalRequest("EaziPay", params), dateFormat);
      rows.push(formatEaziPayRowAsArray(rowData));
    }
    return rows;
  },
  serialize(rows) {
    return rows.map((r) => toCsvLine(r)).join("\n");
  },
  meta(rows, params) {
    return {
      rows: rows.length,
      columns: EaziPayValidator.getColumnCount(),
      header: "NH",
      validity: params.hasInvalidRows ? "I" : "V",
      fileType: "EaziPay",
      sun: params.sun,
    };
  },
};

const SD_REQUIRED = [
  "Destination Account Name",
  "Destination Sort Code",
  "Destination Account Number",
  "Payment Reference",
  "Amount",
  "Transaction code",
] as const;
const SD_OPTIONAL_ALL = [
  "Realtime Information Checksum",
  "Pay Date",
  "Originating Sort Code",
  "Originating Account Number",
  "Originating Account Name",
] as const;

function computeSDHeaders(includeOptionalFields: boolean | string[] | undefined): string[] {
  if (includeOptionalFields === false) return [...SD_REQUIRED];
  if (Array.isArray(includeOptionalFields)) {
    const allow = new Set(includeOptionalFields.map(String));
    return [...SD_REQUIRED, ...SD_OPTIONAL_ALL.filter((h) => allow.has(h))];
  }
  return [...SD_REQUIRED, ...SD_OPTIONAL_ALL];
}

function projectSDRow(row: Record<string, unknown>, headers: string[]): string[] {
  return headers.map((h) => {
    const v = row[h];
    return v === undefined || v === null ? "" : String(v);
  });
}

const sdDirectStrategy: FileTypePreviewStrategy = {
  buildRows(params) {
    const numberOfRows = params.numberOfRows ?? 15;
    const includeOptionalFields = params.includeOptionalFields ?? true;
    const headers = computeSDHeaders(includeOptionalFields);
    const rows: string[][] = [];
    const invalidRows = params.hasInvalidRows ? computeInvalidRowsCap(numberOfRows, params.forInlineEditing) : 0;
    for (let i = 0; i < numberOfRows; i++) {
      const data = params.hasInvalidRows && i < invalidRows
        ? generateInvalidSDDirectRow(toInternalRequest("SDDirect", params))
        : generateValidSDDirectRow(toInternalRequest("SDDirect", params));
  rows.push(projectSDRow(data, headers));
    }
    // Prepend headers if requested
    if ((params.includeHeaders ?? true)) {
      rows.unshift(computeSDHeaders(includeOptionalFields));
    }
    return rows;
  },
  serialize(rows) {
    return rows.map((r) => toCsvLine(r)).join("\n");
  },
  meta(rows, params) {
    const hasHeader = params.includeHeaders ?? true;
    const columns = computeSDHeaders(params.includeOptionalFields ?? true).length;
    const dataRowCount = hasHeader ? Math.max(0, rows.length - 1) : rows.length;
    return {
      rows: dataRowCount,
      columns,
      header: hasHeader ? "H" : "NH",
      validity: params.hasInvalidRows ? "I" : "V",
      fileType: "SDDirect",
      sun: params.sun,
    };
  },
};

function toInternalRequest(fileType: "EaziPay" | "SDDirect", p: PreviewParams): Request {
  return {
    fileType,
    canInlineEdit: p.forInlineEditing ?? true,
    includeHeaders: fileType === "SDDirect" ? (p.includeHeaders ?? true) : undefined,
    numberOfRows: p.numberOfRows,
    hasInvalidRows: p.hasInvalidRows,
    includeOptionalFields: normalizeOptionalFields(p.includeOptionalFields),
    dateFormat: fileType === "EaziPay" ? p.dateFormat || DateFormatter.getRandomDateFormat() : undefined,
    processingDate: p.processingDate,
  };
}
