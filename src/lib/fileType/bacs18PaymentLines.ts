import { faker } from '@faker-js/faker';
import { DateTime } from 'luxon';
import type { FileTypeAdapter, PreviewParams, RowGenerateParams } from './adapter';
import { computeInvalidRowsCap } from './adapter';

// Allowed chars: A–Z, 0–9, . & / - and space. All uppercase.
const ALLOWED_CHARS_REGEX = /[^A-Z0-9.&/\- ]/g;

function toJulianBacs(date: DateTime): string {
  // bYYDDD where b is space, YY year (last two), DDD day-of-year
  const yy = date.toFormat('yy');
  const ddd = date.toFormat('o'); // day of year (no padding -> we'll pad below)
  const dddPadded = ddd.padStart(3, '0');
  return ` ${yy}${dddPadded}`; // leading space
}

function sanitize(text: string, len: number, pad: 'space' | 'zero' = 'space'): string {
  const upper = text.toUpperCase().replace(ALLOWED_CHARS_REGEX, ' ');
  const truncated = upper.slice(0, len);
  if (truncated.length === len) return truncated;
  const padChar = pad === 'zero' ? '0' : ' ';
  return truncated.padEnd(len, padChar);
}

function padNumeric(n: string, len: number): string {
  const digits = n.replace(/\D/g, '').slice(0, len);
  return digits.padStart(len, '0');
}

function formatAmountPennies(amountPennies: number): string {
  const v = Math.max(0, Math.floor(amountPennies));
  return String(v).padStart(11, '0');
}

type Variant = 'DAILY' | 'MULTI';

function buildValidRow(variant: Variant): string[] {
  const destSort = padNumeric(faker.finance.routingNumber().slice(0, 6), 6);
  const destAcc = padNumeric(faker.finance.accountNumber(8), 8);
  const fixedZero = '0'; // 1 char
  const txCode = faker.helpers.arrayElement(['01', '17', '18', '99', '0C', '0N', '0S']);
  const origSort = padNumeric(faker.finance.routingNumber().slice(0, 6), 6);
  const origAcc = padNumeric(faker.finance.accountNumber(8), 8);
  const ric = padNumeric(faker.number.int({ min: 0, max: 9999 }).toString(), 4);
  const amount = formatAmountPennies(faker.number.int({ min: 0, max: 9_999_999_999 }));
  const origName = sanitize(faker.company.name(), 18);
  const payRef = sanitize(faker.string.alphanumeric({ length: 10 }), 18);
  const destName = sanitize(faker.person.fullName(), 18);
  const proc = toJulianBacs(DateTime.now());

  const base = [
    destSort,
    destAcc,
    fixedZero,
    txCode.padEnd(2, ' '), // left, space-padded to 2
    origSort,
    origAcc,
    ric,
    amount,
    origName,
    payRef,
    destName,
  ];
  if (variant === 'DAILY') return base; // 11 fields
  return [...base, proc]; // 12th field
}

function makeInvalid(row: string[], variant: Variant): string[] {
  // Introduce a couple of common invalidities (lengths are still enforced by serialize)
  const mutated = [...row];
  // Corrupt transaction code and amount
  mutated[3] = 'XX'; // invalid code
  mutated[7] = '-0000000001'; // invalid amount characters
  // Inject invalid chars into names
  mutated[8] = mutated[8].replace(/./g, '@');
  mutated[9] = mutated[9] + '***';
  if (variant === 'MULTI') {
    mutated[11] = 'ABCDEF'; // wrong format for Julian date
  }
  return mutated;
}

function toFixedWidthLine(fields: string[], variant: Variant): string {
  // Apply per-column padding/justification
  const cols = [
    { len: 6, pad: 'zero', align: 'left' }, // Dest Sort Code (numeric, left zero-padded)
    { len: 8, pad: 'zero', align: 'left' }, // Dest Acc Number
    { len: 1, pad: 'zero', align: 'left' }, // Fixed zero
    { len: 2, pad: 'space', align: 'left' }, // Txn Code
    { len: 6, pad: 'zero', align: 'left' }, // Originating Sort
    { len: 8, pad: 'zero', align: 'left' }, // Originating Acc
    { len: 4, pad: 'zero', align: 'left' }, // RIC
    { len: 11, pad: 'zero', align: 'right' }, // Amount in pence
    { len: 18, pad: 'space', align: 'left' }, // Originating Name
    { len: 18, pad: 'space', align: 'left' }, // Payment Reference
    { len: 18, pad: 'space', align: 'left' }, // Destination Name
    ...(variant === 'MULTI' ? [{ len: 6, pad: 'space', align: 'left' } as const] : []), // Processing Date
  ];
  const sanitized = fields.map((f, i) => {
    const c = cols[i];
    if (!c) return f; // should not happen
    if (c.pad === 'zero') {
      // numeric-like fields: keep digits only
      const digits = f.replace(/\D/g, '');
      const clipped = digits.slice(0, c.len);
      return clipped.padStart(c.len, '0');
    }
    // text fields: sanitize allowed chars, left-justified space padded
    return sanitize(f, c.len, 'space');
  });
  return sanitized.join('');
}

export const bacs18PaymentLinesAdapter: FileTypeAdapter = {
  buildPreviewRows(params: PreviewParams): string[][] {
    const numberOfRows = params.numberOfRows ?? 15;
    const variant: Variant = params.variant ?? 'MULTI';
    const rows: string[][] = [];
    const invalidRows = params.hasInvalidRows
      ? computeInvalidRowsCap(numberOfRows, params.forInlineEditing)
      : 0;
    for (let i = 0; i < numberOfRows; i++) {
      const base = buildValidRow(variant);
      const data = params.hasInvalidRows && i < invalidRows ? makeInvalid(base, variant) : base;
      rows.push(data);
    }
    return rows;
  },
  serialize(rows: string[][], params: PreviewParams): string {
    const variant: Variant = params.variant ?? 'MULTI';
    const lines = rows.map((r) => toFixedWidthLine(r, variant));
    return lines.join('\n');
  },
  previewMeta(rows: string[][], params: PreviewParams) {
    const variant: Variant = params.variant ?? 'MULTI';
    return {
      rows: rows.length,
      columns: variant === 'DAILY' ? 11 : 12,
      header: 'NH',
      validity: params.hasInvalidRows ? 'I' : 'V',
      fileType: 'Bacs18PaymentLines',
      sun: params.sun,
    };
  },
  buildRow(params: RowGenerateParams) {
    const variant: Variant = params.variant ?? 'MULTI';
    const base = buildValidRow(variant);
    const data = params.validity === 'invalid' ? makeInvalid(base, variant) : base;
    const asLine = toFixedWidthLine(data, variant);
    return { row: { fields: data, asLine } };
  },
};
