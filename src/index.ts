import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import rateLimit from 'express-rate-limit';
import promClient from 'prom-client';
import swaggerUi from 'swagger-ui-express';
import { getConfig } from './config/index.js';
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
import { isAppError } from './lib/errors.js';
import {
    validateAndNormalizeGenerateRequest,
    validateRowPreviewRequest,
} from './lib/validators/requestValidator';

const app = express();
app.use(express.json());
app.use(logRequest);

// Config-driven middlewares
const cfg = getConfig();
if (cfg.rateLimit.enabled) {
    const limiter = rateLimit({
        windowMs: cfg.rateLimit.windowMs,
        max: cfg.rateLimit.max,
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use('/api', limiter);
}

if (cfg.metrics.enabled) {
    promClient.collectDefaultMetrics();
    app.get('/metrics', async (_req, res) => {
        res.set('Content-Type', promClient.register.contentType);
        res.end(await promClient.register.metrics());
    });
}

if (cfg.apiDocs.enabled) {
    const spec = {
        openapi: '3.0.0',
        info: { title: 'Shiny Palm Tree API', version: '1.0.0' },
        paths: {
            '/api/{sun}/{filetype}/generate': { post: { summary: 'Generate file' } },
            '/api/{sun}/{filetype}/valid-row': { post: { summary: 'Build valid rows' } },
            '/api/{sun}/{filetype}/invalid-row': { post: { summary: 'Build invalid rows' } },
        },
    } as const;
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec as unknown as Record<string, unknown>));
}

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
        // Validate preview request
        const previewErrors = validateRowPreviewRequest(body);
        if (previewErrors.length > 0) {
            const response: ErrorResponse = { success: false, error: previewErrors.join('; ') };
            logResponse(res, response);
            return res.status(400).json(response);
        }
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
        // Validate preview request
        const previewErrors = validateRowPreviewRequest(body);
        if (previewErrors.length > 0) {
            const response: ErrorResponse = { success: false, error: previewErrors.join('; ') };
            logResponse(res, response);
            return res.status(400).json(response);
        }
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

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    // Touch _next to satisfy TS noUnusedParameters if enabled
    void _next;
    logError(err, req);
    const status = isAppError(err) ? err.status : 500;
    const response = {
        success: false,
        error: err.message,
        code: isAppError(err) ? err.code : undefined,
        details: isAppError(err) ? err.details : undefined,
    } as const;
    logResponse(res, response);
    res.status(status).json(response);
});

const PORT = getConfig().port;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app; // Export the app for testing purposes
