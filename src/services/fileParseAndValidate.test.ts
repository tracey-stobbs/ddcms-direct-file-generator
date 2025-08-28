import { describe, it, expect } from 'vitest';
import * as fs from 'fs/promises';
import { parseAndValidate } from './fileParseAndValidate';
import { eaziPayAdapter } from '../lib/fileType/eazipay';
import type { PreviewParams } from '../lib/fileType/adapter';

// Helper to write a temporary file
async function writeTemp(content: string): Promise<string> {
  const tmp = `./output/test-${Date.now()}-${Math.random().toString(16).slice(2)}.csv`;
  await fs.mkdir('./output', { recursive: true });
  await fs.writeFile(tmp, content, 'utf8');
  return tmp;
}

type ParseResultStrict = { summary: { total: number; valid: number; invalid: number }; rows: Array<Record<string, unknown>> };

describe('file.parseAndValidate - EaziPay', () => {
  it('valid file yields all rows valid', async () => {
  const params: PreviewParams = { numberOfRows: 5, hasInvalidRows: false, dateFormat: 'YYYY-MM-DD', fileType: 'EaziPay', sun: 'DEFAULT' };
  const rows = eaziPayAdapter.buildPreviewRows(params);
  const content = eaziPayAdapter.serialize(rows, params);
    const path = await writeTemp(content);

    const res = await parseAndValidate({ filePath: path, fileType: 'EaziPay' });
    expect(res && typeof res === 'object').toBe(true);
  const parsed = res as ParseResultStrict;
  expect(parsed.summary.total).toBe(5);
  expect(parsed.summary.valid).toBe(5);
  expect(parsed.summary.invalid).toBe(0);
  });

  it('invalid rows are reported', async () => {
  const params: PreviewParams = { numberOfRows: 6, hasInvalidRows: true, dateFormat: 'YYYY-MM-DD', fileType: 'EaziPay', sun: 'DEFAULT' };
  const rows = eaziPayAdapter.buildPreviewRows(params);
  const content = eaziPayAdapter.serialize(rows, params);
    const path = await writeTemp(content);

    const res = await parseAndValidate({ filePath: path, fileType: 'EaziPay' });
  const parsed = res as ParseResultStrict;
  const summary = parsed.summary;
  expect(summary.total).toBe(6);
  // at least one invalid row expected
  expect(summary.invalid).toBeGreaterThan(0);
  });

  it('handles empty file gracefully', async () => {
    const path = await writeTemp('');
    const res = await parseAndValidate({ filePath: path, fileType: 'EaziPay' });
  const parsed = res as ParseResultStrict;
  const summary = parsed.summary;
  expect(summary.total).toBe(0);
  expect(summary.valid).toBe(0);
  expect(summary.invalid).toBe(0);
  });
});
