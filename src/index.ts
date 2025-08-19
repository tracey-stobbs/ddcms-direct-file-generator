
import type { NextFunction, Request, Response } from "express";
import express from "express";
import path from "path";
import { generateInvalidEaziPayRow, generateValidEaziPayRow } from "./lib/fileType/eazipay";
import { getFileGenerator } from "./lib/fileType/factory";
import { generateInvalidSDDirectRow, generateValidSDDirectRow } from "./lib/fileType/sddirect";
import { nodeFs } from "./lib/fileWriter/fsWrapper";
import type { Request as FileRequest, FileTypeLiteral, McpGenerateRequest } from "./lib/types";
import { SUN_STUB } from "./lib/types";
import { DateFormatter } from "./lib/utils/dateFormatter";
import { logError, logRequest, logResponse } from "./lib/utils/logger";
import { validateAndNormalizeMcpRequest } from "./lib/validators/requestValidator";

const app = express();
app.use(express.json());
app.use(logRequest);

// Legacy endpoint - keep but mark deprecated
app.post("/api/generate", async (req: Request, res: Response) => {
  try {
    const request = req.body;
    const generator = getFileGenerator(request.fileType);
    const filePath = await generator(request, nodeFs);
    // Return relative file path for API response
  const relFilePath = filePath.replace(process.cwd() + path.sep, '').replace(/\\/g, '/');
    const response = { success: true, filePath: relFilePath };
    res.setHeader("Deprecation", "true");
    logResponse(res, response);
    return res.status(200).json(response);
  } catch (err) {
    logError(err as Error, req);
    const response = { success: false, error: "An error occurred while generating the file." };
    logResponse(res, response);
    return res.status(500).json(response);
  }
});

function isValidSun(s: string): boolean {
  return /^\d{6}$/.test(s);
}

type RowHeader = { name: string; order: number };
type RowField = { value: string | number | boolean | ""; order: number };
type RowRow = { fields: RowField[] };

function createMcpRouter(fileType: FileTypeLiteral): express.Router {
  const r = express.Router({ mergeParams: true });

  r.post("/generate", async (req: Request, res: Response) => {
    try {
      const sun = req.params.sun;
      if (!isValidSun(sun)) {
        return res.status(400).json({ status: 400, code: "VALIDATION_ERROR", message: "Invalid SUN", details: ["sun must be a 6-digit string"] });
      }
      const body = req.body as McpGenerateRequest;
      const { isValid, errors, normalized, warnings } = validateAndNormalizeMcpRequest(fileType, body);
      if (!isValid) {
        return res.status(400).json({ status: 400, code: "VALIDATION_ERROR", message: "Invalid request", details: errors });
      }

      // Apply SUN stub into defaults for originating account details
  normalized.defaultValues = {
        originatingAccountDetails: {
          canBeInvalid: true,
          sortCode: SUN_STUB.sortCode,
          accountNumber: SUN_STUB.accountNumber,
          accountName: SUN_STUB.accountName,
        },
  } as FileRequest["defaultValues"];

      // Default output path to output/{fileType}/{sun}
      const defaultOut = path.join(process.cwd(), "output", fileType, sun);
      normalized.outputPath = normalized.outputPath || defaultOut;
      try {
        if (!nodeFs.existsSync(normalized.outputPath)) nodeFs.mkdirSync(normalized.outputPath, { recursive: true });
      } catch (e) {
        return res.status(400).json({ status: 400, code: "VALIDATION_ERROR", message: "Failed to create output directory", details: [String(e)] });
      }

      // Guard unsupported types for generation
      if (!['SDDirect', 'EaziPay'].includes(fileType)) {
        return res.status(501).json({ status: 501, code: "NOT_IMPLEMENTED", message: `Generation not yet implemented for ${fileType}`, details: [] });
      }

      const generator = getFileGenerator(fileType);
      const filePath = await generator(normalized, nodeFs);
      const relFilePath = filePath.replace(process.cwd() + path.sep, '').replace(/\\/g, '/');
      const response = {
        fileType: fileType,
        sun,
        fileName: path.basename(filePath),
        outputPath: path.dirname(relFilePath),
        rowsWritten: normalized.numberOfRows ?? 0,
        includeHeadersEffective: Boolean(normalized.includeHeaders),
        processingDate: body.processingDate ?? '',
        warnings,
      };
      logResponse(res, response);
      return res.status(201).json(response);
    } catch (err) {
      logError(err as Error, req);
      return res.status(500).json({ status: 500, code: "GENERATION_FAILED", message: (err as Error).message, details: [] });
    }
  });

  function buildHeaders(fileType: FileTypeLiteral): RowHeader[] {
    switch (fileType) {
      case "SDDirect":
        return [
          { name: "Destination Account Name", order: 1 },
          { name: "Destination Sort Code", order: 2 },
          { name: "Destination Account Number", order: 3 },
          { name: "Payment Reference", order: 4 },
          { name: "Amount", order: 5 },
          { name: "Transaction code", order: 6 },
          { name: "Realtime Information Checksum", order: 7 },
          { name: "Pay Date", order: 8 },
          { name: "Originating Sort Code", order: 9 },
          { name: "Originating Account Number", order: 10 },
          { name: "Originating Account Name", order: 11 },
        ];
      case "EaziPay":
        return [
          { name: 'Transaction Code', order: 1 },
          { name: 'Originating Sort Code', order: 2 },
          { name: 'Originating Account Number', order: 3 },
          { name: 'Destination Sort Code', order: 4 },
          { name: 'Destination Account Number', order: 5 },
          { name: 'Destination Account Name', order: 6 },
          { name: 'Fixed Zero', order: 7 },
          { name: 'Amount', order: 8 },
          { name: 'Processing Date', order: 9 },
          { name: 'Empty', order: 10 },
          { name: 'SUN Name', order: 11 },
          { name: 'Payment Reference', order: 12 },
          { name: 'SUN Number', order: 13 },
          { name: 'Trailer 1', order: 14 },
          { name: 'Trailer 2', order: 15 },
        ];
      default:
        return [];
    }
  }

  function toRow(fields: Record<string, unknown>, headers: RowHeader[]): RowRow {
    return {
      fields: headers.map(h => {
        const v = (fields[h.name] as string | number | boolean | undefined);
        return { value: (v === undefined ? "" : v), order: h.order };
      })
    };
  }

  r.get('/valid-row', async (req: Request, res: Response) => {
    const sun = req.params.sun;
    if (!isValidSun(sun)) {
      return res.status(400).json({ status: 400, code: "VALIDATION_ERROR", message: "Invalid SUN", details: ["sun must be a 6-digit string"] });
    }
    const rowCount = Math.max(1, parseInt(String((req.query.rowCount ?? '1')) as string, 10) || 1);
    const headers = buildHeaders(fileType);
  const rows: RowRow[] = [];
    for (let i = 0; i < rowCount; i++) {
      if (fileType === 'SDDirect') {
  const fields = generateValidSDDirectRow({
          fileType: 'SDDirect',
          canInlineEdit: true,
          defaultValues: { originatingAccountDetails: { canBeInvalid: false, sortCode: SUN_STUB.sortCode, accountNumber: SUN_STUB.accountNumber, accountName: SUN_STUB.accountName } }
  } as FileRequest);
        rows.push(toRow(fields, headers));
      } else if (fileType === 'EaziPay') {
  const df = DateFormatter.getRandomDateFormat();
  const fields = generateValidEaziPayRow({ fileType: 'EaziPay', canInlineEdit: true } as FileRequest, df);
        // Convert to name->value map for row output
        const mapped: Record<string, unknown> = {
          'Transaction Code': fields.transactionCode,
          'Originating Sort Code': fields.originatingSortCode,
          'Originating Account Number': fields.originatingAccountNumber,
          'Destination Sort Code': fields.destinationSortCode,
          'Destination Account Number': fields.destinationAccountNumber,
          'Destination Account Name': fields.destinationAccountName,
          'Fixed Zero': fields.fixedZero,
          'Amount': fields.amount,
          'Processing Date': fields.processingDate,
          'Empty': '',
          'SUN Name': fields.sunName,
          'Payment Reference': fields.paymentReference,
          'SUN Number': fields.sunNumber ?? '',
          'Trailer 1': '',
          'Trailer 2': '',
        };
        rows.push(toRow(mapped, headers));
      } else {
        // Stubs for other types until implemented
        rows.push({ fields: headers.map(h => ({ value: '', order: h.order })) });
      }
    }
    const payload = { headers, rows, metadata: { fileType, sun, rowKind: 'valid', generatedAt: new Date().toISOString() } };
    return res.status(200).json(payload);
  });

  r.get('/invalid-row', async (req: Request, res: Response) => {
    const sun = req.params.sun;
    if (!isValidSun(sun)) {
      return res.status(400).json({ status: 400, code: "VALIDATION_ERROR", message: "Invalid SUN", details: ["sun must be a 6-digit string"] });
    }
    const rowCount = Math.max(1, parseInt(String((req.query.rowCount ?? '1')) as string, 10) || 1);
    const headers = buildHeaders(fileType);
  const rows: RowRow[] = [];
    for (let i = 0; i < rowCount; i++) {
      if (fileType === 'SDDirect') {
  const fields = generateInvalidSDDirectRow({
          fileType: 'SDDirect',
          canInlineEdit: true,
          defaultValues: { originatingAccountDetails: { canBeInvalid: true, sortCode: SUN_STUB.sortCode, accountNumber: SUN_STUB.accountNumber, accountName: SUN_STUB.accountName } }
  } as FileRequest);
        rows.push(toRow(fields, headers));
      } else if (fileType === 'EaziPay') {
  const df = DateFormatter.getRandomDateFormat();
  const fields = generateInvalidEaziPayRow({ fileType: 'EaziPay', canInlineEdit: true } as FileRequest, df);
        const mapped: Record<string, unknown> = {
          'Transaction Code': fields.transactionCode,
          'Originating Sort Code': fields.originatingSortCode,
          'Originating Account Number': fields.originatingAccountNumber,
          'Destination Sort Code': fields.destinationSortCode,
          'Destination Account Number': fields.destinationAccountNumber,
          'Destination Account Name': fields.destinationAccountName,
          'Fixed Zero': fields.fixedZero,
          'Amount': fields.amount,
          'Processing Date': fields.processingDate,
          'Empty': '',
          'SUN Name': fields.sunName,
          'Payment Reference': fields.paymentReference,
          'SUN Number': fields.sunNumber ?? '',
          'Trailer 1': '',
          'Trailer 2': '',
        };
        rows.push(toRow(mapped, headers));
      } else {
        rows.push({ fields: headers.map(h => ({ value: '', order: h.order })) });
      }
    }
    const payload = { headers, rows, metadata: { fileType, sun, rowKind: 'invalid', generatedAt: new Date().toISOString() } };
    return res.status(200).json(payload);
  });

  return r;
}

// Mount per-file-type routers
app.use('/api/sddirect/:sun', createMcpRouter('SDDirect'));
app.use('/api/bacs18paymentlines/:sun', createMcpRouter('Bacs18PaymentLines'));
app.use('/api/bacs18standardfile/:sun', createMcpRouter('Bacs18StandardFile'));
app.use('/api/eazipay/:sun', createMcpRouter('EaziPay'));

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logError(err, req);
  const response = { success: false, error: err.message };
  logResponse(res, response);
  res.status(500).json(response);
});

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${PORT}`);
  });
}

export default app; // Export the app for testing purposes
