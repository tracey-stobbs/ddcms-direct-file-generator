import fs from 'fs';
import path from 'path';
import { beforeEach, describe, expect, it } from 'vitest';
import { listOutputFiles, readOutputFile } from './fileReader';

const outRoot = (): string => path.join(process.cwd(), 'output');

function ensureDir(p: string): void {
  fs.mkdirSync(p, { recursive: true });
}

function writeFile(p: string, data: string): void {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, data, 'utf8');
}

describe('lib/fileReader', () => {
  beforeEach(() => {
    // Ensure a clean output subdir for tests
    // We avoid deleting entire output to not affect other tests; use a unique SUN per test
  });

  it('listOutputFiles returns empty when folder missing', () => {
    const sun = '999999';
    const res = listOutputFiles({ fileType: 'SDDirect', sun });
    expect(res.root).toContain(path.join('output', 'SDDirect', sun));
    expect(res.files).toEqual([]);
  });

  it('listOutputFiles lists files with metadata and respects limit', () => {
    const sun = '111111';
    const dir = path.join(outRoot(), 'SDDirect', sun);
    ensureDir(dir);
    writeFile(path.join(dir, 'a.csv'), 'A');
    writeFile(path.join(dir, 'b.csv'), 'B');
    const res = listOutputFiles({ fileType: 'SDDirect', sun, limit: 1 });
    expect(res.files.length).toBe(1);
    expect(['a.csv', 'b.csv']).toContain(res.files[0].name);
    expect(typeof res.files[0].size).toBe('number');
    expect(typeof res.files[0].modified).toBe('string');
  });

  it('readOutputFile reads utf8 content with offset/length', () => {
    const sun = '222222';
    const dir = path.join(outRoot(), 'SDDirect', sun);
    const file = path.join(dir, 'test.csv');
    writeFile(file, 'hello,world');
    const full = readOutputFile({ fileType: 'SDDirect', sun, fileName: 'test.csv', mode: 'utf8' });
    expect(full.data).toBe('hello,world');
    const slice = readOutputFile({ fileType: 'SDDirect', sun, fileName: 'test.csv', mode: 'utf8', offset: 6, length: 5 });
    expect(slice.data).toBe('world');
  });

  it('readOutputFile reads base64 content', () => {
    const sun = '333333';
    const dir = path.join(outRoot(), 'EaziPay', sun);
    const file = path.join(dir, 'bin.dat');
    writeFile(file, 'abc');
    const res = readOutputFile({ fileType: 'EaziPay', sun, fileName: 'bin.dat', mode: 'base64' });
    expect(res.data).toBe(Buffer.from('abc', 'utf8').toString('base64'));
  });

  it('rejects path traversal attempts', () => {
    // Using .. in fileName should cause an error from safeJoin
    const sun = '444444';
    expect(() => readOutputFile({ fileType: 'SDDirect', sun, fileName: '../x.csv' })).toThrowError();
  });

  it('returns file not found for missing file', () => {
    const sun = '555555';
    expect(() => readOutputFile({ fileType: 'SDDirect', sun, fileName: 'missing.csv' })).toThrowError('File not found');
  });
});
