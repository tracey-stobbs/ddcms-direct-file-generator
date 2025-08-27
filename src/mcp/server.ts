import { JsonValue, McpRouter, McpValidationError } from "./router";
import { loadSchema } from "./schemaLoader";
// Default service implementations (kept thin; real logic lives outside src/mcp)
import * as calendar from "../services/calendar";
import * as configSvc from "../services/config";
import * as eazipaySvc from "../services/eazipay";
import * as fileSvc from "../services/file";
import * as fileGenerate from "../services/fileGenerate";
import * as fsSvc from "../services/fsService";
import * as row from "../services/row";
import * as rowValidate from "../services/rowValidate";
import * as runtimeSvc from "../services/runtime";

// Contracts-only service interfaces (implementations live outside src/mcp)
export interface FileService {
  preview(params: JsonValue): Promise<JsonValue>;
}
export interface FileGenerateService {
  generate(params: JsonValue): Promise<JsonValue>;
  estimateFilename(params: JsonValue): Promise<JsonValue>;
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
  fileGenerate?: FileGenerateService;
}

export interface RowValidateService {
  validate?(params: JsonValue): Promise<JsonValue>;
}

export interface ConfigService {
  get?(params: JsonValue): Promise<JsonValue>;
  setDefaults?(params: JsonValue): Promise<JsonValue>;
}

export interface RuntimeService {
  health?(params: JsonValue): Promise<JsonValue>;
}

export interface FsService {
  read?(params: JsonValue): Promise<JsonValue>;
  list?(params: JsonValue): Promise<JsonValue>;
  delete?(params: JsonValue): Promise<JsonValue>;
}

export interface EaziPayService {
  pickOptions?(params: JsonValue): Promise<JsonValue>;
}

// Note: McpServices may optionally include extra capabilities via structural typing

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

  // Tool: calendar.isWorkingDay (4.1)
  const calendarMaybe = services.calendar as CalendarService & { isWorkingDay?: (params: JsonValue) => Promise<JsonValue> };
  if (calendarMaybe && typeof calendarMaybe.isWorkingDay === "function") {
    try {
      router.register({
        name: "calendar.isWorkingDay",
        paramsSchema: loadSchema("calendar/isWorkingDay.params.json"),
        resultSchema: loadSchema("calendar/isWorkingDay.result.json"),
        handler: (params) => calendarMaybe.isWorkingDay!(params),
      });
    } catch {
      // schema missing -> skip optional tool
    }
  }

  // Tool: file.generate (4.1) - optional service
  const svcAny = services as McpServices & { fileGenerate?: FileGenerateService };
  if (svcAny.fileGenerate && typeof svcAny.fileGenerate.generate === "function") {
    try {
      router.register({
        name: "file.generate",
        paramsSchema: loadSchema("file/generate.params.json"),
        resultSchema: loadSchema("file/generate.result.json"),
        handler: (params) => svcAny.fileGenerate!.generate(params),
      });

      router.register({
        name: "file.estimateFilename",
        paramsSchema: loadSchema("file/estimateFilename.params.json"),
        resultSchema: loadSchema("file/estimateFilename.result.json"),
        handler: (params) => svcAny.fileGenerate!.estimateFilename(params),
      });
    } catch {
      // missing schemas -> skip
    }
  }

  // Tool: row.validate (4.1) - optional
  const rowMaybe = services.row as RowService & { validate?: (params: JsonValue) => Promise<JsonValue> };
  if (rowMaybe && typeof rowMaybe.validate === "function") {
    try {
      router.register({
        name: "row.validate",
        paramsSchema: loadSchema("row/validate.params.json"),
        resultSchema: loadSchema("row/validate.result.json"),
        handler: (params) => rowMaybe.validate!(params),
      });
    } catch {
      // skip if schema missing
    }
  }

  // Tool: config.get / config.setDefaults (4.0/4.1)
  const configMaybe = (services as unknown as Record<string, unknown>).config as ConfigService | undefined;
  if (configMaybe && typeof configMaybe.get === "function") {
    try {
      router.register({
        name: "config.get",
        paramsSchema: loadSchema("config/get.params.json"),
        resultSchema: loadSchema("config/get.result.json"),
        handler: (params) => configMaybe.get!(params),
      });
    } catch {
      // skip
    }
  }
  if (configMaybe && typeof configMaybe.setDefaults === "function") {
    try {
      router.register({
        name: "config.setDefaults",
        paramsSchema: loadSchema("config/setDefaults.params.json"),
        resultSchema: loadSchema("config/setDefaults.result.json"),
        handler: (params) => configMaybe.setDefaults!(params),
      });
    } catch {
      // skip
    }
  }

  // Tool: runtime.health (4.1)
  const runtimeMaybe = (services as unknown as Record<string, unknown>).runtime as RuntimeService | undefined;
  if (runtimeMaybe && typeof runtimeMaybe.health === "function") {
    try {
      router.register({
        name: "runtime.health",
        paramsSchema: loadSchema("runtime/health.params.json"),
        resultSchema: loadSchema("runtime/health.result.json"),
        handler: (params) => runtimeMaybe.health!(params),
      });
    } catch {
      // skip
    }
  }

  // Tool: fs.read/list/delete (4.1) - optional FS service
  const fsMaybe = (services as unknown as Record<string, unknown>).fs as FsService | undefined;
  if (fsMaybe) {
    try {
      if (typeof fsMaybe.read === "function") {
        router.register({
          name: "fs.read",
          paramsSchema: loadSchema("fs/read.params.json"),
          resultSchema: loadSchema("fs/read.result.json"),
          handler: (params) => fsMaybe.read!(params),
        });
      }
      if (typeof fsMaybe.list === "function") {
        router.register({
          name: "fs.list",
          paramsSchema: loadSchema("fs/list.params.json"),
          resultSchema: loadSchema("fs/list.result.json"),
          handler: (params) => fsMaybe.list!(params),
        });
      }
      if (typeof fsMaybe.delete === "function") {
        router.register({
          name: "fs.delete",
          paramsSchema: loadSchema("fs/delete.params.json"),
          resultSchema: loadSchema("fs/delete.result.json"),
          handler: (params) => fsMaybe.delete!(params),
        });
      }
    } catch {
      // skip if any fs schema missing
    }
  }

  // Tool: eazipay.pickOptions
  const eazipayMaybe = (services as unknown as Record<string, unknown>).eazipay as EaziPayService | undefined;
  if (eazipayMaybe && typeof eazipayMaybe.pickOptions === "function") {
    try {
      router.register({
        name: "eazipay.pickOptions",
        paramsSchema: loadSchema("eazipay/pickOptions.params.json"),
        resultSchema: loadSchema("eazipay/pickOptions.result.json"),
        handler: (params) => eazipayMaybe.pickOptions!(params),
      });
    } catch {
      // skip
    }
  }

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
  const services: McpServices & {
    fileGenerate?: FileGenerateService;
    config?: ConfigService;
    fs?: FsService;
    runtime?: RuntimeService;
    row?: RowService & { validate?: (params: JsonValue) => Promise<JsonValue> };
    eazipay?: EaziPayService;
  } = { file, row, calendar };

  // Optional: wire fileGenerate
  services.fileGenerate = {
    generate: fileGenerate.generate,
    estimateFilename: fileGenerate.estimateFilename,
  };

  // Optional: config
  services.config = {
    get: configSvc.get,
    setDefaults: configSvc.setDefaults,
  };

  // Optional fs
  services.fs = {
    read: fsSvc.read,
    list: fsSvc.list,
    delete: fsSvc.deleteFile,
  };

  // Optional runtime
  services.runtime = {
    health: runtimeSvc.health,
  };

  // Optional row.validate
  services.row = {
    ...row,
    validate: rowValidate.validate,
  };

  // Optional eazipay
  services.eazipay = {
    pickOptions: eazipaySvc.pickOptions,
  };

  return createMcpRouter(services as McpServices);
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
