import type { JsonValue } from "../mcp/router";

export async function pickOptions(params: JsonValue): Promise<JsonValue> {
  void params;
  // stub: adapters should implement this
  return { options: {} } as JsonValue;
}
