import type { JsonValue } from "../mcp/router";

export async function validate(params: JsonValue): Promise<JsonValue> {
  void params;
  // basic passthrough - adapters may provide stronger validation
  return { valid: true, details: null } as JsonValue;
}
