import { Request } from "../types";
import { generateValidSDDirectRow, generateInvalidSDDirectRow } from "../fileType/sddirect";
import { DateTime } from "luxon";
import { nodeFs, FileSystem } from "./fsWrapper";
import path from "path";


export async function generateFile(request: Request): Promise<string> {
  return generateFileWithFs(request, nodeFs);
}

export async function generateFileWithFs(request: Request, fs: FileSystem): Promise<string> {
  const now = DateTime.now();
  const timestamp = now.toFormat("yyyyLLdd_HHmmss");
  const numberOfRows = request.numberOfRows ?? 15;
  const hasInvalidRows = request.hasInvalidRows ?? false;
  const includeHeaders = request.includeHeaders ?? true;
  const includeOptionalFields = request.includeOptionalFields ?? true;
  const fileType = request.fileType;
  const extension = "csv"; // MVP: SDDirect only
  const outputDir = request.outputPath || path.join(process.cwd(), "output");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

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
  const fileContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  fs.writeFileSync(filePath, fileContent, "utf8");
  return filePath;
}
