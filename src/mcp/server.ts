import { JsonValue, McpRouter } from "./router";
import { loadSchema } from "./schemaLoader";

// Contracts-only service interfaces (implementations live outside src/mcp)
export interface FileService {
  preview(params: JsonValue): Promise<JsonValue>;
}
export interface RowService {
  generate(params: JsonValue): Promise<JsonValue>;
}
export interface CalendarService {
  nextWorkingDay(params: JsonValue): Promise<JsonValue>;
}

export interface McpServices {
  file: FileService;
  row: RowService;
  calendar: CalendarService;
}

export function createMcpRouter(services: McpServices): McpRouter {
  const router = new McpRouter();

  // Tool: file.preview
  router.register({
    name: "file.preview",
    paramsSchema: loadSchema("file/preview.params.json"),
    resultSchema: loadSchema("file/preview.result.json"),
  handler: (params) => services.file.preview(params),
  });

  // Tool: row.generate
  router.register({
    name: "row.generate",
    paramsSchema: loadSchema("row/generate.params.json"),
    resultSchema: loadSchema("row/generate.result.json"),
  handler: (params) => services.row.generate(params),
  });

  // Tool: calendar.nextWorkingDay
  router.register({
    name: "calendar.nextWorkingDay",
    paramsSchema: loadSchema("calendar/nextWorkingDay.params.json"),
    resultSchema: loadSchema("calendar/nextWorkingDay.result.json"),
  handler: (params) => services.calendar.nextWorkingDay(params),
  });

  return router;
}

// Optional: tiny JSON-RPC like envelope types
export interface McpRequest {
  id: string | number | null;
  method: string;
  params?: JsonValue;
}
export interface McpResponse {
  id: string | number | null;
  result?: unknown;
  error?: { message: string; detail?: string };
}

export async function handleMcpRequest(router: McpRouter, req: McpRequest): Promise<McpResponse> {
  try {
    const result = await router.invoke(req.method, (req.params ?? null));
    return { id: req.id ?? null, result };
  } catch (err: unknown) {
    const e = normalizeError(err);
    const message = e.message ?? "Unknown error";
    const detail = e.detail;
    return { id: req.id ?? null, error: { message, detail } };
  }
}

type NormalizedError = { message?: string; detail?: string };
function normalizeError(err: unknown): NormalizedError {
  if (err instanceof Error) {
    const anyErr = err as Error & { detail?: unknown };
    return {
      message: anyErr.message,
      detail: typeof anyErr.detail === "string" ? anyErr.detail : undefined,
    };
  }
  if (typeof err === "object" && err !== null) {
    const maybeMsg = (err as Record<string, unknown>).message;
    const maybeDetail = (err as Record<string, unknown>).detail;
    return {
      message: typeof maybeMsg === "string" ? maybeMsg : undefined,
      detail: typeof maybeDetail === "string" ? maybeDetail : undefined,
    };
  }
  return {};
}
