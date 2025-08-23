import fs from 'fs';
import { DateTime } from 'luxon';
import path from 'path';

export interface ListOutputFilesInput {
  fileType: 'EaziPay' | 'SDDirect';
  sun: string;
  limit?: number;
}

export interface ListOutputFilesResult {
  root: string; // relative to cwd
  files: Array<{ name: string; size: number; modified: string }>; // ISO timestamp
}

export interface ReadOutputFileInput {
  fileType: 'EaziPay' | 'SDDirect';
  sun: string;
  fileName: string;
  offset?: number;
  length?: number;
  mode?: 'utf8' | 'base64';
}

export interface ReadOutputFileResult {
  fileType: 'EaziPay' | 'SDDirect';
  sun: string;
  fileName: string;
  offset: number;
  length: number;
  mode: 'utf8' | 'base64';
  data: string;
}

function safeJoin(root: string, ...segments: string[]): string {
  const resolved = path.resolve(root, ...segments);
  const normalizedRoot = path.resolve(root);
  if (!resolved.startsWith(normalizedRoot + path.sep) && resolved !== normalizedRoot) {
    throw new Error('Path traversal detected');
  }
  return resolved;
}

export function listOutputFiles(input: ListOutputFilesInput): ListOutputFilesResult {
  const limit = input.limit ?? 100;
  const root = path.join(process.cwd(), 'output', input.fileType, input.sun);
  const dir = safeJoin(process.cwd(), 'output', input.fileType, input.sun);
  if (!fs.existsSync(dir)) return { root: path.relative(process.cwd(), dir), files: [] };
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile())
    .slice(0, limit)
    .map((e) => {
      const full = path.join(dir, e.name);
      const stat = fs.statSync(full);
      return { name: e.name, size: stat.size, modified: DateTime.fromJSDate(stat.mtime).toISO()! };
    });
  return { root: path.relative(process.cwd(), root), files };
}

export function readOutputFile(input: ReadOutputFileInput): ReadOutputFileResult {
  const mode = input.mode ?? 'utf8';
  const offset = input.offset ?? 0;
  const length = input.length ?? 64 * 1024; // default to 64KB
  const dir = safeJoin(process.cwd(), 'output', input.fileType, input.sun);
  const filePath = safeJoin(dir, input.fileName);
  if (!fs.existsSync(filePath)) throw new Error('File not found');
  const fd = fs.openSync(filePath, 'r');
  try {
    const stat = fs.statSync(filePath);
    const maxLen = Math.min(length, Math.max(0, stat.size - offset));
    const buf = Buffer.alloc(Math.max(0, maxLen));
    const bytesRead = fs.readSync(fd, buf, 0, buf.length, offset);
    const data = mode === 'utf8' ? buf.slice(0, bytesRead).toString('utf8') : buf.slice(0, bytesRead).toString('base64');
    return {
      fileType: input.fileType,
      sun: input.sun,
      fileName: input.fileName,
      offset,
      length: bytesRead,
      mode,
      data,
    };
  } finally {
    fs.closeSync(fd);
  }
}
