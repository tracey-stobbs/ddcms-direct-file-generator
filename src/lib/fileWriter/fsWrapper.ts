export interface FileSystem {
  existsSync(path: string): boolean;
  mkdirSync(path: string, options: { recursive: boolean }): void;
  writeFileSync(path: string, data: string, encoding: BufferEncoding): void;
}

import { existsSync, mkdirSync, writeFileSync as nodeWriteFileSync } from "node:fs";

export const nodeFs: FileSystem = {
  existsSync,
  mkdirSync,
  writeFileSync: (path: string, data: string, encoding: BufferEncoding) => nodeWriteFileSync(path, data, { encoding }),
};
