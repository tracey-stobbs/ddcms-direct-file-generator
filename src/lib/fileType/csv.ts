// Lightweight CSV parsing utilities used by file-type adapters and fallback parser
export function parseCsvLine(line: string): string[] {
    const fields: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
            if (ch === '"') {
                if (i + 1 < line.length && line[i + 1] === '"') {
                    cur += '"';
                    i++; // skip escaped quote
                } else {
                    inQuotes = false;
                }
            } else {
                cur += ch;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
            } else if (ch === ',') {
                fields.push(cur);
                cur = '';
            } else {
                cur += ch;
            }
        }
    }
    fields.push(cur);
    return fields;
}

export function parseCsvContent(content: string): Record<string, unknown> {
    const lines = content.split(/\r?\n/).filter((l) => l.length > 0);
    const rows = lines.map((line, i) => ({ index: i, asLine: line, fields: parseCsvLine(line) }));
    return { rows };
}

export default { parseCsvLine, parseCsvContent };
