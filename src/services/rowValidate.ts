import { EaziPayValidator } from '../lib/validators/eazipayValidator';
import type { JsonValue } from '../mcp/router';

export async function validate(params: JsonValue): Promise<JsonValue> {
    const p = params as unknown as Record<string, unknown> | undefined;
    const fileType = p && typeof p.fileType === 'string' ? (p.fileType as string) : undefined;
    const row = p && typeof p.row === 'object' ? (p.row as Record<string, unknown>) : undefined;
    if (!fileType || !row) return { valid: false, details: ['missing fileType or row'] } as JsonValue;

    if (fileType === 'EaziPay') {
        // Expect row.fields or row.asLine depending on caller; try to extract fields array
        const fields = (row.fields as unknown) as string[] | undefined;
        // If fields array present, map to named fields based on EaziPay format
        if (fields && Array.isArray(fields)) {
            const transactionCode = fields[0] as string;
            const fixedZero = Number(fields[6]);
            const empty = fields[9] === '' ? undefined : fields[9];
            const sunNumber = fields[12] === '' ? undefined : fields[12];
            const res = EaziPayValidator.validateAllFields({ fixedZero, empty, sunNumber, transactionCode });
            return { valid: res.isValid, details: res.errors } as JsonValue;
        }
        // Fallback: no fields array -> cannot validate deeply
        return { valid: true, details: null } as JsonValue;
    }

    // Default: assume valid (adapters for other file types may implement their own validators)
    return { valid: true, details: null } as JsonValue;
}
