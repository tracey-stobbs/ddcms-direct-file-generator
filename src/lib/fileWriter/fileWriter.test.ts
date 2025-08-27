import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request } from '../types.js';
import { generateFileWithFs } from './fileWriter.js';
import type { FileSystem } from './fsWrapper.js';

describe('generateFileWithFs', () => {
  const existsSync = vi.fn(() => false);
  const mkdirSync = vi.fn();
  const writeFileSync = vi.fn();
  const mockFs: FileSystem = { existsSync, mkdirSync, writeFileSync };

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
    const result = await generateFileWithFs(request as Request, mockFs, 'TESTSUN');
    expect(result.filePath).toMatch(/SDDirect_11_x_2_H_V_\d{8}_\d{6}\.csv/);
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
    await generateFileWithFs(request as Request, mockFs, 'TESTSUN');
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
    const result = await generateFileWithFs(request as Request, mockFs, 'TESTSUN');
    // Prefer returned content if provided
    if (result?.fileContent) capturedContent = result.fileContent;
    const lines = capturedContent.split('\n');
    // Header contains required + selected optionals only under adapter behavior
    expect(lines[0].split(',').length).toBe(7); // 6 required + 1 selected optional
    const dataRow = lines[1].split(',');
    // Length matches header (6 required + 1 selected optional)
    expect(dataRow.length).toBe(7);
    // Required fields populated
    for (let i = 0; i < 6; i++) expect(dataRow[i]).not.toBe('');
    // Selected optional (Pay Date) populated
    expect(dataRow[6]).not.toBe('');
  });
});
