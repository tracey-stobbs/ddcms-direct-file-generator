import { generateFileWithFs } from './fileWriter.js';
import type { Request } from '../types.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('generateFileWithFs', () => {
  const existsSync = vi.fn(() => false);
  const mkdirSync = vi.fn();
  const writeFileSync = vi.fn();
  const mockFs = { existsSync, mkdirSync, writeFileSync };

  beforeEach(() => {
    existsSync.mockClear();
    mkdirSync.mockClear();
    writeFileSync.mockClear();
  });
  it('should generate a file with correct naming and content', async () => {
    const request = {
      fileType: 'SDDirect',
      canInlineEdit: true,
      includeHeaders: true,
      numberOfRows: 2,
      hasInvalidRows: false,
      includeOptionalFields: true,
    };
    const filePath = await generateFileWithFs(request as Request, mockFs);
    expect(filePath).toMatch(/SDDirect_11_x_2_H_V_\d{8}_\d{6}\.csv/);
    expect(mkdirSync).toHaveBeenCalled();
    expect(writeFileSync).toHaveBeenCalled();
  });

  it('should use outputPath if provided', async () => {
    const request = {
      fileType: 'SDDirect',
      canInlineEdit: true,
      outputPath: 'custom/output',
      numberOfRows: 1,
    };
    await generateFileWithFs(request as Request, mockFs);
    expect(mkdirSync).toHaveBeenCalledWith('custom/output', { recursive: true });
  });

  it('should include all optional columns but only populate requested optional fields', async () => {
    const request = {
      fileType: 'SDDirect',
      canInlineEdit: true,
      includeHeaders: true,
      numberOfRows: 1,
      hasInvalidRows: false,
      includeOptionalFields: ['Pay Date'],
    };
    let capturedContent = '';
    writeFileSync.mockImplementation((filePath, content) => {
      capturedContent = content;
    });
    await generateFileWithFs(request as Request, mockFs);
    const lines = capturedContent.split('\n');
    expect(lines[0].split(',').length).toBe(11); // header has all columns
    const dataRow = lines[1].split(',');
    // Required fields populated
    for (let i = 0; i < 6; i++) expect(dataRow[i]).not.toBe('');
    // Only 'Pay Date' (column 8) populated, others blank
    expect(dataRow[6]).toBe(''); // Realtime Information Checksum
    expect(dataRow[7]).not.toBe(''); // Pay Date
    expect(dataRow[8]).toBe(''); // Originating Sort Code
    expect(dataRow[9]).toBe(''); // Originating Account Number
    expect(dataRow[10]).toBe(''); // Originating Account Name
  });
});
