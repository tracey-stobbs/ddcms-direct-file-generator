import { JsonRpcRouter } from './jsonrpc';
import { processJsonRpcLine } from './lineHandler';
import type { EazipayGenerateFileParams, EazipayGetRowParams } from './schemas';
import * as CommonTools from './tools/common';
import * as EaziPay from './tools/eazipay';
import * as SDDirect from './tools/sddirect';

// Minimal stdio JSON-RPC loop for MCP
const router = new JsonRpcRouter();

// Core methods
router.register('initialize', async () => ({
    server: { name: 'ddcms-direct-mcp', version: process.env.npm_package_version ?? '0.0.0' },
    capabilities: { tools: true, resources: true, prompts: false },
}));

router.register('ping', async () => ({ ok: true }));
router.register('shutdown', async () => ({ ok: true }));

// EaziPay tools
router.register('tools/eazipay.get_valid_row', async (params) =>
    EaziPay.getValidRow(params as EazipayGetRowParams),
);
router.register('tools/eazipay.get_invalid_row', async (params) =>
    EaziPay.getInvalidRow(params as EazipayGetRowParams),
);
router.register('tools/eazipay.generate_file', async (params) =>
    EaziPay.generateFile(params as EazipayGenerateFileParams),
);

// SDDirect tools
router.register('tools/sddirect.get_valid_row', async (params) =>
    SDDirect.getValidRow(params as { sun: string }),
);
router.register('tools/sddirect.get_invalid_row', async (params) =>
    SDDirect.getInvalidRow(params as { sun: string }),
);
router.register('tools/sddirect.generate_file', async (params) =>
    SDDirect.generateFile(
        params as {
            sun: string;
            numberOfRows?: number;
            hasInvalidRows?: boolean;
            includeHeaders?: boolean;
            includeOptionalFields?: boolean | string[];
            outputPath?: string;
        },
    ),
);

// Common tools (Epic E5)
router.register('tools/common.list_supported_formats', async () =>
    CommonTools.listSupportedFormats(),
);
router.register('tools/common.preview_file_name', async (params) =>
    CommonTools.previewFileName(params),
);
router.register('tools/common.validate_processing_date', async (params) =>
    CommonTools.validateProcessingDate(params),
);
router.register('tools/common.list_output_files', async (params) =>
    CommonTools.listOutputFiles(params),
);
router.register('tools/common.read_output_file', async (params) =>
    CommonTools.readOutputFile(params),
);

function writeResponse(res: unknown): void {
    const json = JSON.stringify(res);
    process.stdout.write(json + '\n');
}

async function handleLine(line: string): Promise<void> {
    await processJsonRpcLine(line, router, writeResponse);
}

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk: string) => {
    buffer += chunk;
    let idx: number;
    while ((idx = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        void handleLine(line);
    }
});

process.stdin.on('end', () => {
    // eslint-disable-next-line no-console
    console.log('stdin closed');
});

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
