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
