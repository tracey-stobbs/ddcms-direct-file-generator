import { existsSync, mkdirSync, writeFileSync as nodeWriteFileSync } from "fs";

export interface FileSystem {
  existsSync(path: string): boolean;
  mkdirSync(path: string, options: { recursive: boolean }): void;
  // we expose a simplified signature used by callers
  writeFileSync(path: string, data: string, encoding: BufferEncoding): void;
}

export const nodeFs: FileSystem = {
  existsSync,
  mkdirSync,
  writeFileSync: (path: string, data: string, encoding: BufferEncoding) =>
    nodeWriteFileSync(path, data, encoding),
};
