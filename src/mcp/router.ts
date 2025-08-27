import Ajv, { ErrorObject, ValidateFunction } from 'ajv';

export type JsonValue = null | boolean | number | string | JsonValue[] | { [k: string]: JsonValue };

export type ToolHandler = (params: JsonValue) => Promise<JsonValue> | JsonValue;

export interface ToolDefinition {
  name: string;
  paramsSchema: object;
  resultSchema: object;
  handler: ToolHandler;
}

export interface RouterOptions {
  ajv?: Ajv;
}

export class McpRouter {
  private readonly ajv: Ajv;
  private readonly tools = new Map<
    string,
    { validateParams: ValidateFunction; validateResult: ValidateFunction; handler: ToolHandler }
  >();

  constructor(opts?: RouterOptions) {
    this.ajv = opts?.ajv ?? new Ajv({ allErrors: true, strict: true, allowUnionTypes: true });
  }

  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`);
    }
    const validateParams = this.ajv.compile(tool.paramsSchema);
    const validateResult = this.ajv.compile(tool.resultSchema);
    this.tools.set(tool.name, { validateParams, validateResult, handler: tool.handler });
  }

  async invoke(name: string, params: JsonValue): Promise<JsonValue> {
    const entry = this.tools.get(name);
    if (!entry) throw new Error(`Unknown tool: ${name}`);

    if (!entry.validateParams(params)) {
      const msg = this.ajv.errorsText(entry.validateParams.errors ?? undefined, {
        dataVar: 'params',
      });
      throw new McpValidationError('Invalid params', msg, entry.validateParams.errors ?? undefined);
    }

    const result = await entry.handler(params);

    if (!entry.validateResult(result)) {
      const msg = this.ajv.errorsText(entry.validateResult.errors ?? undefined, {
        dataVar: 'result',
      });
      throw new McpValidationError('Invalid result', msg, entry.validateResult.errors ?? undefined);
    }
    return result;
  }
}

export class McpValidationError extends Error {
  public readonly detail?: string;
  public readonly errors?: ErrorObject[];
  constructor(message: string, detail?: string, errors?: ErrorObject[]) {
    super(message);
    this.name = 'McpValidationError';
    this.detail = detail;
    this.errors = errors;
  }
}
