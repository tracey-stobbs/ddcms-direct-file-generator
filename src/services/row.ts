import type {
    RowGenerateParams as Params,
    RowGenerateResult as Result,
} from '../lib/fileType/adapter';
import { getFileTypeAdapter } from '../lib/fileType/factory';
import type { JsonValue } from '../mcp/router';

export async function generate(params: JsonValue): Promise<JsonValue> {
    const p = params as unknown as Params;
    if (
        p.fileType !== 'EaziPay' &&
        p.fileType !== 'SDDirect' &&
        p.fileType !== 'Bacs18PaymentLines'
    ) {
        throw new Error(`Unsupported fileType for row.generate: ${p.fileType}`);
    }
    const adapter = getFileTypeAdapter(p.fileType);
    const result = adapter.buildRow(p) as Result;
    return result as unknown as JsonValue;
}
