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
 *
 * For error logging behavior and how to enable it, see README section: "JSON-RPC error logging".
 */
export class JsonRpcRouter {
    private server: JSONRPCServer;

    constructor(opts?: { onError?: (message: string, data: unknown) => void }) {
        // Default: silence library error logs to keep tests and CLI clean; callers can override.
        const defaultErrorListener = (message: string, data: unknown): void => {
            // no-op by default; prefer structured logging if enabling
            void message; // mark used for linting
            void data; // mark used for linting
        };
        const errorListener = opts?.onError ?? defaultErrorListener;
        this.server = new JSONRPCServer({ errorListener });
    }

    register(method: string, handler: MethodHandler): void {
        this.server.addMethod(method, async (params: unknown) => handler(params));
    }

    async handle(request: JsonRpcRequest): Promise<JsonRpcResponse | undefined> {
        const response = await this.server.receive(
            request as unknown as Parameters<typeof this.server.receive>[0],
        );
        // null means notification or no response
        return response === null ? undefined : (response as JsonRpcResponse);
    }
}
