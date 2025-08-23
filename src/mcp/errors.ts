import { JSONRPCErrorException } from 'json-rpc-2.0';
import { JsonRpcErrorCodes } from './jsonrpc';

// Factory helpers for consistent JSON-RPC error responses
export function invalidParams(message: string, data?: unknown): never {
  throw new JSONRPCErrorException(message, JsonRpcErrorCodes.InvalidParams, data);
}

export function methodNotFound(name: string): never {
  throw new JSONRPCErrorException(`Method not found: ${name}`, JsonRpcErrorCodes.MethodNotFound);
}

export function internalError(error: unknown, data?: unknown): never {
  const msg = error instanceof Error ? error.message : String(error);
  throw new JSONRPCErrorException(msg, JsonRpcErrorCodes.InternalError, data);
}

export function serverError(message: string, data?: unknown): never {
  throw new JSONRPCErrorException(message, JsonRpcErrorCodes.ServerError, data);
}

export function parseError(message = 'Parse error', data?: unknown): never {
  throw new JSONRPCErrorException(message, JsonRpcErrorCodes.ParseError, data);
}

export type { JSONRPCError } from 'json-rpc-2.0';
