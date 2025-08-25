/**
 * File generation orchestrator
 *
 * Design:
 * - generateFile() produces file content entirely in-memory using filetype adapters.
 * - No filesystem writes occur by default; we return a deterministic filePath and the content.
 * - generateFileWithFs() is a thin wrapper that persists the in-memory result using a provided FS.
 *
 * Contract:
 * - Input: Request (fileType, numberOfRows, includeHeaders, includeOptionalFields, hasInvalidRows, etc.), SUN
 * - Output: { filePath, fileContent }
 *   - filePath is a virtual path rooted at output/[fileType]/[SUN] unless request.outputPath is set.
 *   - fileContent is the serialized file as produced by the adapter.
 */
import { DateTime } from "luxon";
import path from "path";
import type { PreviewParams } from "../fileType/adapter";
import { getFileTypeAdapter } from "../fileType/factory";
import type { Request } from "../types";
import { FileSystem } from "./fsWrapper";

export interface GeneratedFile {
  filePath: string;
  fileContent: string;
}

export async function generateFile(request: Request, sun: string): Promise<GeneratedFile> {
  // Generate the file entirely in-memory (no filesystem writes)
  return generateFileInMemory(request, sun);
}

  fs.writeFileSync(path.join(intendedDir, path.basename(generated.filePath)), generated.fileContent, "utf8");
  return generated;
}

// Core in-memory generator delegating to file type adapters
async function generateFileInMemory(request: Request, sun: string): Promise<GeneratedFile> {
  const now = DateTime.now();
  const timestamp = now.toFormat("yyyyLLdd_HHmmss");
  const fileType = request.fileType;

  const adapter = getFileTypeAdapter(fileType);
  const params = toPreviewParams(request, sun);
  const rows = adapter.buildPreviewRows(params);
  const meta = adapter.previewMeta(rows, params);
  const content = adapter.serialize(rows, params);

  const columnCount = String(meta.columns).padStart(2, "0");
  const headerToken = meta.header; // "H" | "NH"
  const validity = meta.validity; // "V" | "I"
  const extension = getFileExtension(fileType);

  const filename = `${fileType}_${columnCount}_x_${meta.rows}_${headerToken}_${validity}_${timestamp}.${extension}`;
  const outputDir = request.outputPath || path.join(process.cwd(), "output", fileType, sun);
  const filePath = path.join(outputDir, filename);
  return { filePath, fileContent: content };
}

/**
 * Generate EaziPay file (new logic)
 */
// Helper: map internal Request to adapter PreviewParams
function toPreviewParams(request: Request, sun: string): PreviewParams {
  return {
    sun,
    fileType: request.fileType as "EaziPay" | "SDDirect" | "Bacs18PaymentLines",
    numberOfRows: request.numberOfRows,
    includeOptionalFields: request.includeOptionalFields,
    hasInvalidRows: request.hasInvalidRows,
    includeHeaders: request.includeHeaders,
    forInlineEditing: request.canInlineEdit,
    processingDate: request.processingDate,
    dateFormat: request.fileType === "EaziPay" ? request.dateFormat : undefined,
    // variant: request.fileType === "Bacs18PaymentLines" ? request.variant : undefined, // not in legacy Request
  } as const;
}

/**
 * Get file extension based on file type
 */
function getFileExtension(fileType: string): string {
  switch (fileType) {
    case "SDDirect":
      return "csv";
    case "EaziPay":
      return Math.random() < 0.5 ? "csv" : "txt";
    case "Bacs18PaymentLines":
      return "txt";
    case "Bacs18StandardFile":
      return "bacs";
    default:
      return "csv";
  }
}
