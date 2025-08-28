import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import path from 'path';
import {
    formatEaziPayRowAsArray,
    generateInvalidEaziPayRow,
    generateValidEaziPayRow,
    getEaziPayHeaders,
} from './lib/fileType/eazipay';
import { generateInvalidSDDirectRow, generateValidSDDirectRow } from './lib/fileType/sddirect';
import { resolveFileWriter } from './lib/fileWriter/factory';
import type {
    ErrorResponse,
    GenerateRequest,
    Request as InternalRequest,
    OriginatingAccountDetails,
    RowPreviewRequest,
    SuccessResponse,
} from './lib/types';
import { logError, logRequest, logResponse } from './lib/utils/logger';
import { validateAndNormalizeGenerateRequest } from './lib/validators/requestValidator';

const app = express();
app.use(express.json());
app.use(logRequest);

// Helper to map public body to internal generator request
function toInternalRequest(
    fileType: string,
    body: GenerateRequest | RowPreviewRequest,
    sun: string,
): InternalRequest {
    // Use SUN registry for originating details
    const originatingAccountDetails = getOriginatingDetailsForSun(sun);
    return {
        fileType: fileType as InternalRequest['fileType'],
        canInlineEdit: body.forInlineEditing ?? true,
        includeHeaders: (body as GenerateRequest).includeHeaders,
        numberOfRows: body.numberOfRows,
        hasInvalidRows: (body as GenerateRequest).hasInvalidRows,
        includeOptionalFields: body.includeOptionalFields,
        defaultValues: { originatingAccountDetails },
        outputPath: (body as GenerateRequest).outputPath,
        dateFormat: body.dateFormat,
        processingDate: body.processingDate,
    };
}

function getOriginatingDetailsForSun(_sun: string): OriginatingAccountDetails {
    void _sun;
    // Placeholder mapping; extend as needed
    return {
        canBeInvalid: true,
        sortCode: '912291',
        accountNumber: '51491194',
        accountName: 'Test Account',
    };
}

// POST /api/:sun/:filetype/generate -> returns file content
app.post('/api/:sun/:filetype/generate', async (req: Request, res: Response) => {
    try {
        const { sun, filetype } = req.params as { sun: string; filetype: string };
        const body = req.body as GenerateRequest;
        const { isValid, errors, normalizedRequest } = validateAndNormalizeGenerateRequest(
            filetype,
            body,
        );
        if (!isValid) {
            const response: ErrorResponse = { success: false, error: errors.join('; ') };
            logResponse(res, response);
            return res.status(400).json(response);
        }

        const internal = toInternalRequest(filetype, normalizedRequest, sun);
    // API context: persist to filesystem by default
    const writer = resolveFileWriter('api');
    const generated = await writer.generate(internal, sun);
        const relFilePath = generated.filePath
            .replace(process.cwd() + path.sep, '')
            .replace(/\\/g, '/');
        const response: SuccessResponse = { success: true, fileContent: generated.fileContent };
        // Include path in headers for traceability
        res.setHeader('X-Generated-File', relFilePath);
        logResponse(res, response);
        return res.status(200).json(response);
    } catch (err) {
        logError(err as Error, req);
        const response: ErrorResponse = {
            success: false,
            error: 'An error occurred while generating the file.',
        };
        logResponse(res, response);
        return res.status(500).json(response);
    }
});

// GET/POST /api/:sun/:filetype/valid-row -> returns structured rows
app.post('/api/:sun/:filetype/valid-row', async (req: Request, res: Response) => {
    try {
        const { sun, filetype } = req.params as { sun: string; filetype: string };
        const body = req.body as RowPreviewRequest;
        const internal = toInternalRequest(filetype, body, sun);
        const numberOfRows = internal.numberOfRows ?? 15;
        const rows = await buildRowsResponse(filetype, internal, numberOfRows, false);
        logResponse(res, rows);
        return res.status(200).json(rows);
    } catch (err) {
        logError(err as Error, req);
        const response: ErrorResponse = {
            success: false,
            error: 'An error occurred while building valid rows.',
        };
        logResponse(res, response);
        return res.status(500).json(response);
    }
});

// GET/POST /api/:sun/:filetype/invalid-row -> returns structured rows
app.post('/api/:sun/:filetype/invalid-row', async (req: Request, res: Response) => {
    try {
        const { sun, filetype } = req.params as { sun: string; filetype: string };
        const body = req.body as RowPreviewRequest;
        const internal = toInternalRequest(filetype, body, sun);
        const numberOfRows = internal.numberOfRows ?? 15;
        const rows = await buildRowsResponse(filetype, internal, numberOfRows, true);
        logResponse(res, rows);
        return res.status(200).json(rows);
    } catch (err) {
        logError(err as Error, req);
        const response: ErrorResponse = {
            success: false,
            error: 'An error occurred while building invalid rows.',
        };
        logResponse(res, response);
        return res.status(500).json(response);
    }
});

type RowsResponse = {
    headers: { name: string; value: number }[];
    rows: { fields: { value: string | number | boolean; order: number }[] }[];
    metadata: Record<string, unknown>;
};

async function buildRowsResponse(
    fileType: string,
    request: InternalRequest,
    numberOfRows: number,
    invalid: boolean,
): Promise<RowsResponse> {
    if (fileType === 'EaziPay') {
        const headers = getEaziPayHeaders().map((name, idx) => ({ name, value: idx }));
        const rows = Array.from({ length: numberOfRows }, (_, i) => {
            const row =
                invalid && i !== 0
                    ? generateInvalidEaziPayRow(request, request.dateFormat ?? 'YYYY-MM-DD')
                    : generateValidEaziPayRow(request, request.dateFormat ?? 'YYYY-MM-DD');
            const arr = formatEaziPayRowAsArray(row);
            return { fields: arr.map((value, order) => ({ value, order })) };
        });
        return { headers, rows, metadata: {} };
    }

    // SDDirect fallback
    const requiredFields = [
        'Destination Account Name',
        'Destination Sort Code',
        'Destination Account Number',
        'Payment Reference',
        'Amount',
        'Transaction code',
    ];
    const allOptionalFields = [
        'Realtime Information Checksum',
        'Pay Date',
        'Originating Sort Code',
        'Originating Account Number',
        'Originating Account Name',
    ];
    const includeOptionalFields = request.includeOptionalFields ?? true;
    const headersList =
        includeOptionalFields === false
            ? requiredFields
            : [...requiredFields, ...allOptionalFields];
    const headers = headersList.map((name, idx) => ({ name, value: idx }));
    const rows = Array.from({ length: numberOfRows }, () => {
        const data = invalid
            ? generateInvalidSDDirectRow(request)
            : generateValidSDDirectRow(request);
        const arr = headersList.map((h) => String(data[h] ?? ''));
        return { fields: arr.map((value, order) => ({ value, order })) };
    });
    return { headers, rows, metadata: {} };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    // Touch _next to satisfy TS noUnusedParameters if enabled
    void _next;
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
