export class AppError extends Error {
    public readonly status: number;
    public readonly code?: string;
    public readonly details?: unknown;

    constructor(message: string, opts?: { status?: number; code?: string; details?: unknown }) {
        super(message);
        this.name = 'AppError';
        this.status = opts?.status ?? 500;
        this.code = opts?.code;
        this.details = opts?.details;
    }
}

export function isAppError(err: unknown): err is AppError {
    return err instanceof AppError;
}
