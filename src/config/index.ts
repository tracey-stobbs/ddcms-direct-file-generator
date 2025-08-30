import { z } from 'zod';

// Load .env in non-production for local/dev convenience (no-op in prod CI)
if (!process.env.CI && process.env.NODE_ENV !== 'production') {
    await import('dotenv/config');
}

const EnvSchema = z
    .object({
        NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
        PORT: z.coerce.number().default(3001),
        ENABLE_RATE_LIMIT: z.coerce.boolean().default(true),
        RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
        RATE_LIMIT_MAX: z.coerce.number().default(100),
        ENABLE_METRICS: z.coerce.boolean().default(true),
        ENABLE_API_DOCS: z.coerce.boolean().default(true),
        REQUEST_LOG_BODY: z.coerce.boolean().default(false),
    })
    .readonly();

export type AppConfig = {
    env: 'development' | 'test' | 'production';
    port: number;
    rateLimit: {
        enabled: boolean;
        windowMs: number;
        max: number;
    };
    metrics: { enabled: boolean };
    apiDocs: { enabled: boolean };
    logging: { requestBody: boolean };
};

let cached: AppConfig | null = null;

export function getConfig(): AppConfig {
    if (cached) return cached;
    const parsed = EnvSchema.parse(process.env);
    cached = {
        env: parsed.NODE_ENV,
        port: parsed.PORT,
        rateLimit: {
            enabled: parsed.ENABLE_RATE_LIMIT,
            windowMs: parsed.RATE_LIMIT_WINDOW_MS,
            max: parsed.RATE_LIMIT_MAX,
        },
        metrics: { enabled: parsed.ENABLE_METRICS },
        apiDocs: { enabled: parsed.ENABLE_API_DOCS },
        logging: { requestBody: parsed.REQUEST_LOG_BODY },
    };
    return cached;
}

export function resetConfigCache(): void {
    cached = null;
}
