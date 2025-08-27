import type { JsonValue } from '../mcp/router';

export async function health(_params: JsonValue): Promise<JsonValue> {
  void _params;
  return { status: 'ok', uptime: process.uptime() } as JsonValue;
}
