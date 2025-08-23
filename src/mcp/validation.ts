import { ZodError, ZodSchema } from 'zod';
import { invalidParams } from './errors';

export function parseOrInvalidParams<T>(schema: ZodSchema<T>, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (e) {
    if (e instanceof ZodError) {
      const details = e.errors.map((err) => {
        const path = err.path.length > 0 ? err.path.join('.') : '(root)';
        return `${path}: ${err.message}`;
      });
      invalidParams('Invalid parameters', { details });
    }
    throw e;
  }
}

export async function parseOrInvalidParamsAsync<T>(schema: ZodSchema<T>, input: unknown): Promise<T> {
  try {
    return await schema.parseAsync(input);
  } catch (e) {
    if (e instanceof ZodError) {
      const details = e.errors.map((err) => {
        const path = err.path.length > 0 ? err.path.join('.') : '(root)';
        return `${path}: ${err.message}`;
      });
      invalidParams('Invalid parameters', { details });
    }
    throw e;
  }
}
