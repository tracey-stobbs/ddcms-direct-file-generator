import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function loadSchema(relativePathFromDocsSchemas: string): object {
  // __dirname in src is fine for ts-node; in dist it points to dist/mcp.
  // Navigate to project root by assuming dist or src folder layout.
  const here = __dirname;
  const projectRoot = resolve(here, '..', '..');
  const root = resolve(projectRoot, 'documentation', 'Schemas');
  const full = resolve(root, relativePathFromDocsSchemas);
  const json = readFileSync(full, 'utf-8');
  return JSON.parse(json) as object;
}
