export const MCP_ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type McpErrorCode = (typeof MCP_ERROR_CODES)[keyof typeof MCP_ERROR_CODES];

export interface McpErrorEnvelope {
    code: McpErrorCode;
    message: string;
    detail?: string;
    traceId?: string;
}
