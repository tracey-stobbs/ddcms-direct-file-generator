import {
  JSONRPCServer,
  type JSONRPCID as LibJSONRPCID,
  type JSONRPCRequest as LibJSONRPCRequest,
  type JSONRPCResponse as LibJSONRPCResponse,
} from 'json-rpc-2.0';

export type JsonRpcId = LibJSONRPCID;
export type JsonRpcRequest = LibJSONRPCRequest;
export type JsonRpcResponse = LibJSONRPCResponse;

// Common JSON-RPC 2.0 error codes as named constants to avoid magic numbers
export const JsonRpcErrorCodes = Object.freeze({
  ParseError: -32700,
  InvalidRequest: -32600,
  MethodNotFound: -32601,
  InvalidParams: -32602,
  InternalError: -32603,
  // Server error range is -32000 to -32099. Use -32000 for generic server errors.
  ServerError: -32000,
});
export type JsonRpcErrorCode = (typeof JsonRpcErrorCodes)[keyof typeof JsonRpcErrorCodes];

export type MethodHandler = (params: unknown) => Promise<unknown> | unknown;

/**
 * JSON-RPC 2.0 router backed by json-rpc-2.0's JSONRPCServer, with standard ErrorCodes.
 */
export class JsonRpcRouter {
  private server = new JSONRPCServer();

  register(method: string, handler: MethodHandler): void {
    this.server.addMethod(method, async (params: unknown) => handler(params));
  }

  async handle(request: JsonRpcRequest): Promise<JsonRpcResponse | undefined> {
    const response = await this.server.receive(
      request as unknown as Parameters<typeof this.server.receive>[0]
    );
    // null means notification or no response
    return response === null ? undefined : (response as JsonRpcResponse);
  }
}
