import { DateTime } from 'luxon';
import { addWorkingDays } from '../lib/calendar';
import type { JsonValue } from '../mcp/router';

type Params = { fromDate?: string; offsetDays: number };

export async function nextWorkingDay(params: JsonValue): Promise<JsonValue> {
    const p = params as unknown as Params;
    const start = p.fromDate ? DateTime.fromISO(p.fromDate) : DateTime.now();
    const result = addWorkingDays(start, p.offsetDays);
    return { date: result.toISODate() } as JsonValue;
}

type IsWorkingParams = { date: string };
export async function isWorkingDay(params: JsonValue): Promise<JsonValue> {
    const p = params as unknown as IsWorkingParams;
    const d = DateTime.fromISO(p.date);
    if (!d.isValid) return { isWorkingDay: false, reason: 'WEEKEND' } as JsonValue;
    const wkday = d.weekday; // 1..7 Mon..Sun
    if (wkday === 6 || wkday === 7) return { isWorkingDay: false, reason: 'WEEKEND' } as JsonValue;
    // Very small stub for bank holiday lookup - assume none
    return { isWorkingDay: true, reason: 'WORKING_DAY' } as JsonValue;
}
