import type { JsonRpcRequest } from './jsonrpc';
import { JsonRpcErrorCodes, JsonRpcRouter } from './jsonrpc';

export type WriteFn = (res: unknown) => void;

/**
 * Process a single JSON-RPC line. On invalid JSON, writes a ParseError with id:null.
 * Returns a Promise to allow tests to await completion.
 */
export async function processJsonRpcLine(
  line: string,
  router: JsonRpcRouter,
  write: WriteFn
): Promise<void> {
  const trimmed = line.trim();
  if (!trimmed) return;
  try {
    const req = JSON.parse(trimmed) as JsonRpcRequest;
    const resp = await router.handle(req);
    if (resp !== undefined) write(resp);
  } catch {
    write({
      jsonrpc: '2.0',
      id: null,
      error: { code: JsonRpcErrorCodes.ParseError, message: 'Parse error' },
    });
  }
}
