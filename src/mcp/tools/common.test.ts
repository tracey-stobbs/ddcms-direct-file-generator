import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import * as Common from './common';

// Router available if needed for future integration tests

describe('MCP Common tools', () => {
  it('list_supported_formats returns EaziPay and SDDirect', async () => {
    const res = await Common.listSupportedFormats();
    const fileTypes = res.formats.map((f) => f.fileType).sort();
    expect(fileTypes).toEqual(['EaziPay', 'SDDirect']);
  });

  it('preview_file_name predicts name and columnCount', async () => {
    const res = await Common.previewFileName({ fileType: 'SDDirect', sun: '123456', includeHeaders: true });
    expect(res.fileName).toContain('SDDirect_');
    expect(res.columnCount).toBe(11);
  });

  it('validate_processing_date normalizes formats', async () => {
    const ok = await Common.validateProcessingDate({ fileType: 'EaziPay', date: '2025-12-24', dateFormat: 'YYYY-MM-DD' });
    expect(ok.valid).toBe(true);
    const bad = await Common.validateProcessingDate({ fileType: 'SDDirect', date: '2025-13-40' });
    expect(bad.valid).toBe(false);
  });

  it('list_output_files and read_output_file work with safe paths', async () => {
    const root = path.join(process.cwd(), 'output', 'SDDirect', '111111');
    fs.mkdirSync(root, { recursive: true });
    const file = path.join(root, 'test.csv');
    fs.writeFileSync(file, 'hello,world', 'utf8');
    const list = await Common.listOutputFiles({ fileType: 'SDDirect', sun: '111111' });
    expect(list.files.find((f) => f.name === 'test.csv')).toBeTruthy();
    const read = await Common.readOutputFile({ fileType: 'SDDirect', sun: '111111', fileName: 'test.csv', mode: 'utf8' });
    expect(read.data).toContain('hello');
  });
});
