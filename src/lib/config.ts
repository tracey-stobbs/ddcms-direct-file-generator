import { z } from 'zod';

const ConfigSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().int().min(1).max(65535).default(3001),
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  outputPath: z.string().default('./output'),
  devLogRequests: z.coerce.boolean().default(true),
  devEnableCors: z.coerce.boolean().default(true)
});

export type Config = z.infer<typeof ConfigSchema>;

function loadConfig(): Config {
  const rawConfig = {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    logLevel: process.env.LOG_LEVEL,
    outputPath: process.env.OUTPUT_PATH,
    devLogRequests: process.env.DEV_LOG_REQUESTS,
    devEnableCors: process.env.DEV_ENABLE_CORS
  };

  try {
    return ConfigSchema.parse(rawConfig);
  } catch (error) {
    console.error('Configuration validation failed:', error);
    process.exit(1);
  }
}

export const config = loadConfig();
