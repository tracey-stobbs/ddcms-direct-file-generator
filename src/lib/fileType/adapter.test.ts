import { describe, expect, it } from 'vitest';
import { toCsvLine } from './adapter';
import { sdDirectAdapter, SDFields } from './sddirect';

describe('FileTypeAdapter utilities', () => {
  it('toCsvLine escapes commas and quotes', () => {
    const line = toCsvLine(['a,b', 'c"d', 'plain', 'multi\nline']);
    expect(line).toBe('"a,b","c""d",plain,"multi\nline"');
  });
});

describe('sdDirectAdapter headers', () => {
  it('includes only selected optional headers when string[] provided', () => {
    const params = {
      sun: '123456',
      fileType: 'SDDirect' as const,
      numberOfRows: 1,
      includeHeaders: true,
      includeOptionalFields: [SDFields.PayDate, SDFields.OriginatingSortCode],
    };
    const rows = sdDirectAdapter.buildPreviewRows(params);
    // first row is header row
    const header = rows[0];
    // required headers should always exist
    expect(header).toContain(SDFields.TransactionCode);
    // selected optionals exist
    expect(header).toContain(SDFields.PayDate);
    expect(header).toContain(SDFields.OriginatingSortCode);
    // unselected optional should be absent
    expect(header).not.toContain(SDFields.RealtimeInformationChecksum);
  });
});
