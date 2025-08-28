import { describe, it, expect } from 'vitest';
import { parseCsvLine, parseCsvContent } from './csv';

interface ParsedRow { index: number; asLine: string; fields: string[] }
interface ParseResult { rows: ParsedRow[] }

describe('csv parser', () => {
    it('parses simple comma-separated fields', () => {
        const line = 'a,b,c,123';
        const fields = parseCsvLine(line);
        expect(fields).toEqual(['a', 'b', 'c', '123']);
    });

    it('handles quoted fields with commas', () => {
        const line = '1,2,"Smith, John",4';
        const fields = parseCsvLine(line);
        expect(fields).toEqual(['1', '2', 'Smith, John', '4']);
    });

    it('handles escaped quotes inside quoted fields', () => {
        const line = '1,"He said ""Hello""",3';
        const fields = parseCsvLine(line);
        expect(fields).toEqual(['1', 'He said "Hello"', '3']);
    });

    it('returns empty string for empty fields', () => {
        const line = 'a,,c,';
        const fields = parseCsvLine(line);
        expect(fields).toEqual(['a', '', 'c', '']);
    });

    it('parseCsvContent returns rows with index/asLine/fields', () => {
        const content = 'a,b,c\n1,2,3\n"Smith, Joe",5,6\n';
        const res = parseCsvContent(content) as unknown as ParseResult;
        expect(Array.isArray(res.rows)).toBe(true);
        expect(res.rows[0]).toHaveProperty('index', 0);
        expect(res.rows[0]).toHaveProperty('asLine', 'a,b,c');
        expect(res.rows[2].fields).toEqual(['Smith, Joe', '5', '6']);
    });
});
