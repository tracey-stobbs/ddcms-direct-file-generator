import { DateTime } from "luxon";
import path from "path";
import {
  formatEaziPayRowAsArray,
  generateInvalidEaziPayRow,
  generateValidEaziPayRow
} from "../fileType/eazipay";
import { generateInvalidSDDirectRow, generateValidSDDirectRow } from "../fileType/sddirect";
import { Request } from "../types";
import { DateFormatter } from "../utils/dateFormatter";
import { EaziPayValidator } from "../validators/eazipayValidator";
import { validateAndNormalizeHeaders } from "../validators/requestValidator";
import { FileSystem, nodeFs } from "./fsWrapper";

export async function generateFile(request: Request): Promise<string> {
  return generateFileWithFs(request, nodeFs);
}

export async function generateFileWithFs(request: Request, fs: FileSystem): Promise<string> {
  // Normalize the request (handle header validation)
  const normalizedRequest = validateAndNormalizeHeaders(request);
  
  const now = DateTime.now();
  const timestamp = now.toFormat("yyyyLLdd_HHmmss");
  const fileType = normalizedRequest.fileType;
  
  const outputDir = normalizedRequest.outputPath || path.join(process.cwd(), "output");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // Generate file based on type
  switch (fileType) {
    case "SDDirect":
      return generateSDDirectFile(normalizedRequest, fs, timestamp, outputDir);
    case "EaziPay":
      return generateEaziPayFile(normalizedRequest, fs, timestamp, outputDir);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * Generate SDDirect file (existing logic)
 */
async function generateSDDirectFile(
  request: Request, 
  fs: FileSystem, 
  timestamp: string, 
  outputDir: string
): Promise<string> {
  const numberOfRows = request.numberOfRows ?? 15;
  const hasInvalidRows = request.hasInvalidRows ?? false;
  const includeHeaders = request.includeHeaders ?? true;
  const includeOptionalFields = request.includeOptionalFields ?? true;
  const fileType = request.fileType;
  const extension = "csv";

  // Determine columns per requirements
  const requiredFields = [
    "Destination Account Name","Destination Sort Code","Destination Account Number","Payment Reference","Amount","Transaction code"
  ];
  const allOptionalFields = [
    "Realtime Information Checksum","Pay Date","Originating Sort Code","Originating Account Number","Originating Account Name"
  ];
  
  // Always include all optional columns if any optional field is requested
  let headers: string[];
  if (includeOptionalFields === false) {
    headers = [...requiredFields];
  } else {
    headers = [...requiredFields, ...allOptionalFields];
  }
  const columnCount = headers.length.toString().padStart(2, "0");

  // Generate rows
  const rows: string[][] = [];
  let invalidRows = 0;
  if (hasInvalidRows) {
    invalidRows = Math.min(Math.floor(numberOfRows / 2), request.canInlineEdit ? 49 : numberOfRows);
  }
  
  for (let i = 0; i < numberOfRows; i++) {
    let row: Record<string, unknown>;
    if (hasInvalidRows && i < invalidRows) {
      row = generateInvalidSDDirectRow(request);
    } else {
      row = generateValidSDDirectRow(request);
    }
    
    // Only populate requested optional fields, others blank
    const populatedRow = headers.map(h => {
      if (requiredFields.includes(h)) return String(row[h] ?? "");
      if (includeOptionalFields === true) return String(row[h] ?? "");
      if (Array.isArray(includeOptionalFields)) {
        const fieldsAsStrings = includeOptionalFields.map(String);
        return fieldsAsStrings.includes(h) ? String(row[h] ?? "") : "";
      }
      return "";
    });
    rows.push(populatedRow);
  }

  // File naming
  const validity = hasInvalidRows ? "I" : "V";
  const headerFlag = includeHeaders ? "_H" : "NH";
  const filename = `${fileType}_${columnCount}_x_${numberOfRows}${headerFlag}_${validity}_${timestamp}.${extension}`;
  const filePath = path.join(outputDir, filename);

  // Write file
  const content = [];
  if (includeHeaders) {
    content.push(headers.join(","));
  }
  content.push(...rows.map(r => r.join(",")));
  const fileContent = content.join("\n");
  
  fs.writeFileSync(filePath, fileContent, "utf8");
  return filePath;
}

/**
 * Generate EaziPay file (new logic)
 */
async function generateEaziPayFile(
  request: Request,
  fs: FileSystem,
  timestamp: string,
  outputDir: string
): Promise<string> {
  const numberOfRows = request.numberOfRows ?? 15;
  const hasInvalidRows = request.hasInvalidRows ?? false;
  const fileType = request.fileType;
  
  // EaziPay-specific logic
  const dateFormat = request.dateFormat || DateFormatter.getRandomDateFormat();
  const trailerFormat = Math.random() < 0.5 ? 'quoted' : 'unquoted';
  const extension = getFileExtension(fileType);
  const columnCount = EaziPayValidator.getColumnCount(trailerFormat).toString().padStart(2, "0");

  // Generate rows
  const rows: string[][] = [];
  let invalidRows = 0;
  if (hasInvalidRows) {
    invalidRows = Math.min(Math.floor(numberOfRows / 2), request.canInlineEdit ? 49 : numberOfRows);
  }

  for (let i = 0; i < numberOfRows; i++) {
    let rowData;
    if (hasInvalidRows && i >1 && i < invalidRows) {
      rowData = generateInvalidEaziPayRow(request, dateFormat, trailerFormat);
    } else {
      rowData = generateValidEaziPayRow(request, dateFormat, trailerFormat);
    }
    
    const rowArray = formatEaziPayRowAsArray(rowData);
    rows.push(rowArray);
  }

  // File naming (EaziPay never has headers)
  const validity = hasInvalidRows ? "I" : "V";
  const headerFlag = "NH"; // Always no headers for EaziPay
  const filename = `${fileType}_${columnCount}_x_${numberOfRows}_${headerFlag}_${validity}_${timestamp}.${extension}`;
  const filePath = path.join(outputDir, filename);

  // Write file (no headers for EaziPay)
  const fileContent = rows.map(r => r.join(",")).join("\n");
  fs.writeFileSync(filePath, fileContent, "utf8");
  return filePath;
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
