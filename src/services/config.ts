import type { JsonValue } from "../mcp/router";

let defaults: Record<string, JsonValue> = {};

export async function get(params: JsonValue): Promise<JsonValue> {
  const p = params as unknown as Record<string, unknown> | undefined;
  const key = p && typeof p.key === "string" ? (p.key as string) : undefined;
  if (!key) return { defaults } as JsonValue;
  return { value: defaults[key] } as JsonValue;
}

export async function setDefaults(params: JsonValue): Promise<JsonValue> {
  const p = params as unknown as Record<string, unknown> | undefined;
  const incoming = p && typeof p.defaults === "object" ? (p.defaults as Record<string, JsonValue>) : undefined;
  if (!incoming) return { success: false } as JsonValue;
  defaults = { ...defaults, ...incoming };
  return { success: true } as JsonValue;
}
