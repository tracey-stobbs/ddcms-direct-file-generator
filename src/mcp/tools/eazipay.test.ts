import { describe, expect, it } from 'vitest';
import { generateFile, getInvalidRow, getValidRow } from './eazipay';

// Happy path: valid row shape and ordering
describe('MCP EaziPay tools', () => {
  it('getValidRow returns ordered fields matching headers and 15 columns', () => {
    const res = getValidRow({ sun: '123456' });
    expect(res.headers.length).toBe(15);
    expect(Array.isArray(res.rows[0].fields)).toBe(true);
    expect(res.rows[0].fields.length).toBe(15);
    // fields must be 1-based ordered
    for (let i = 0; i < res.rows[0].fields.length; i++) {
      expect(res.rows[0].fields[i].order).toBe(i + 1);
    }
  });

  it('getInvalidRow returns ordered fields and 15 columns (may violate validation)', () => {
    const res = getInvalidRow({ sun: '123456' });
    expect(res.rows[0].fields.length).toBe(15);
    for (let i = 0; i < res.rows[0].fields.length; i++) {
      expect(res.rows[0].fields[i].order).toBe(i + 1);
    }
  });

  it('rejects invalid SUN for getValidRow', () => {
    expect(() => getValidRow({ sun: '12A456' })).toThrowError();
    expect(() => getValidRow({ sun: '12345' })).toThrowError();
    expect(() => getValidRow({ sun: '1234567' })).toThrowError();
  });

  it('generateFile produces metadata with fileName and rowsWritten', async () => {
    const res = await generateFile({ sun: '123456', numberOfRows: 3, hasInvalidRows: false });
    expect(res.fileName).toContain('EaziPay_');
    expect(res.rowsWritten).toBe(3);
    // EaziPay has no headers in the file and always 15 columns with last two empty
    expect(res.includeHeadersEffective).toBe(false);
  });
});
