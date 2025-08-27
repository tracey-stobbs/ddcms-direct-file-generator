import { JsonValue, McpRouter, McpValidationError } from "./router";
import { loadSchema } from "./schemaLoader";
// Default service implementations (kept thin; real logic lives outside src/mcp)
import * as calendar from "../services/calendar";
import * as fileSvc from "../services/file";
import * as row from "../services/row";

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

// Convenience factory for default services wiring
export function createDefaultMcpRouter(): McpRouter {
  // Adapt typed services to JsonValue-based FileService contract
  const file: FileService = {
    async preview(params) {
      // Params have already been schema-validated; safe to cast.
      return fileSvc.preview(params as unknown as Parameters<typeof fileSvc.preview>[0]) as unknown as JsonValue;
    },
  };
  return createMcpRouter({ file, row, calendar });
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
    const norm = normalizeError(err);
    // Standardized error envelope
    const payload: { code: string; message: string; detail?: string; traceId?: string } = {
      code: norm.code ?? "INTERNAL_ERROR",
      message: norm.message ?? "Unknown error",
    };
    if (norm.detail) payload.detail = norm.detail;
    if (norm.traceId) payload.traceId = norm.traceId;
    return { id: req.id ?? null, error: payload };
  }
}

type NormalizedError = { code?: string; message?: string; detail?: string; traceId?: string };
function generateTraceId(): string {
  // Simple stable-ish trace id using timestamp + random hex
  return `${Date.now().toString(36)}-${Math.random().toString(16).slice(2,10)}`;
}

function normalizeError(err: unknown): NormalizedError {
  const traceId = generateTraceId();
  if (err instanceof McpValidationError) {
    return { code: "VALIDATION_ERROR", message: err.message, detail: err.detail, traceId };
  }
  if (err instanceof Error) {
    const anyErr = err as Error & { detail?: unknown };
    return { code: "INTERNAL_ERROR", message: anyErr.message, detail: typeof anyErr.detail === "string" ? anyErr.detail : undefined, traceId };
  }
  if (typeof err === "object" && err !== null) {
    const maybeMsg = (err as Record<string, unknown>).message;
    const maybeDetail = (err as Record<string, unknown>).detail;
    return { code: "INTERNAL_ERROR", message: typeof maybeMsg === "string" ? maybeMsg : undefined, detail: typeof maybeDetail === "string" ? maybeDetail : undefined, traceId };
  }
  return { code: "INTERNAL_ERROR", message: undefined, traceId };
}
