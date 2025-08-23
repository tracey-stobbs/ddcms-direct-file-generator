import fs from 'fs';
import path from 'path';

export type LightCounts = { green: number; yellow: number; red: number; white: number };
export type EpicCounts = { code: string; title: string; counts: LightCounts };

const ZERO: LightCounts = { green: 0, yellow: 0, red: 0, white: 0 };

function cloneZero(): LightCounts {
  return { green: 0, yellow: 0, red: 0, white: 0 };
}

function addCounts(a: LightCounts, b: LightCounts): LightCounts {
  return {
    green: a.green + b.green,
    yellow: a.yellow + b.yellow,
    red: a.red + b.red,
    white: a.white + b.white,
  };
}

function statusToLight(line: string): keyof LightCounts | null {
  // Prefer explicit emojis if present
  if (line.includes('🟢')) return 'green';
  if (line.includes('🟡')) return 'yellow';
  if (line.includes('🔴')) return 'red';
  if (line.includes('⚪')) return 'white';
  // Fallback to status keywords
  const m = /Status:\s*([^\n]+)/i.exec(line);
  if (!m) return null;
  const status = m[1].toLowerCase();
  if (status.includes('done')) return 'green';
  if (status.includes('in progress') || status.includes('review')) return 'yellow';
  if (status.includes('blocked')) return 'red';
  if (status.includes('to do')) return 'white';
  return null;
}

function parseEpicHeader(line: string): { code: string; title: string } | null {
  // e.g., ## epic E1: MCP server scaffolding (M1)
  const m = /^##\s+epic\s+(E\d+):\s+(.+)$/i.exec(line.trim());
  if (!m) return null;
  const code = m[1];
  const rawTitle = m[2];
  const title = rawTitle.replace(/\s*\(.*\)\s*$/, '');
  return { code, title };
}

export function parseBacklogMarkdown(md: string): { epics: EpicCounts[]; overall: LightCounts; openQuestions: LightCounts } {
  const lines = md.split(/\r?\n/);
  const epicMap = new Map<string, EpicCounts>();
  let currentEpic: EpicCounts | null = null;
  let inOpenQuestions = false;
  const openQuestions: LightCounts = cloneZero();

  for (const rawLine of lines) {
    const line = rawLine;
    const epicHeader = parseEpicHeader(line);
    if (epicHeader) {
      inOpenQuestions = false;
      const key = epicHeader.code;
      if (!epicMap.has(key)) {
        epicMap.set(key, { code: epicHeader.code, title: epicHeader.title, counts: cloneZero() });
      }
      currentEpic = epicMap.get(key)!;
      continue;
    }

    if (/^##\s+open questions/i.test(line)) {
      currentEpic = null;
      inOpenQuestions = true;
      continue;
    }

    // Count status lines within epics
    if (currentEpic && /-\s*Priority:/.test(line) && /Status:/i.test(line)) {
      const light = statusToLight(line);
      if (light) currentEpic.counts[light] += 1;
    }

    // Count blocked questions in open questions section
    if (inOpenQuestions && /^-\s+/.test(line)) {
      const light: keyof LightCounts | null = line.includes('🔴') ? 'red' : null;
      if (light) openQuestions[light] += 1;
    }
  }

  // Compute overall totals
  let overall: LightCounts = { ...ZERO };
  for (const epic of epicMap.values()) {
    overall = addCounts(overall, epic.counts);
  }
  overall = addCounts(overall, openQuestions);

  // Sort epics by numeric code
  const epics = Array.from(epicMap.values()).sort((a, b) => Number(a.code.slice(1)) - Number(b.code.slice(1)));
  return { epics, overall, openQuestions };
}

export function renderDashboard(epics: EpicCounts[], overall: LightCounts, openQuestions: LightCounts): string {
  const lines: string[] = [];
  lines.push('## progress dashboard');
  lines.push('');
  // Table header uses the legend ordering
  lines.push('| Scope | 🟢 Done | 🟡 In Progress/Review | 🔴 Blocked | ⚪ To Do |');
  lines.push('|:--|--:|--:|--:|--:|');
  const row = (scope: string, c: LightCounts) => `| ${scope} | ${c.green} | ${c.yellow} | ${c.red} | ${c.white} |`;
  lines.push(row('Overall', overall));
  for (const e of epics) {
    lines.push(row(`${e.code} ${e.title}`, e.counts));
  }
  lines.push(row('Open Questions', { green: 0, yellow: 0, red: openQuestions.red, white: 0 }));
  return lines.join('\n');
}

function replaceDashboard(md: string, dashboard: string): string {
  const lines = md.split(/\r?\n/);
  const startIdx = lines.findIndex((l) => /^##\s+progress dashboard/i.test(l));
  if (startIdx === -1) {
    // Insert after Legend block
    const legendIdx = lines.findIndex((l) => /^Legend\s*$/i.test(l.trim()));
    const insertAt = legendIdx === -1 ? 5 : legendIdx + 6; // after legend bullets
    const pre = lines.slice(0, insertAt);
    const post = lines.slice(insertAt);
    return [...pre, '', dashboard, '', ...post].join('\n');
  }
  // find end at next h2 or EOF
  let endIdx = startIdx + 1;
  while (endIdx < lines.length && !/^##\s+/.test(lines[endIdx])) endIdx++;
  return [...lines.slice(0, startIdx), dashboard, ...lines.slice(endIdx)].join('\n');
}

export function updateBacklogDashboard(md: string): string {
  const { epics, overall, openQuestions } = parseBacklogMarkdown(md);
  const dashboard = renderDashboard(epics, overall, openQuestions);
  return replaceDashboard(md, dashboard);
}

export function updateBacklogFile(filePath: string): void {
  const md = fs.readFileSync(filePath, 'utf8');
  const updated = updateBacklogDashboard(md);
  fs.writeFileSync(filePath, updated, 'utf8');
}

export function resolveBacklogPath(cwd: string, relative?: string): string {
  if (relative) return path.resolve(cwd, relative);
  return path.resolve(cwd, 'documentation', 'Phase 2 - MCP Server', 'DDCMS-Direct-MCP-Server-Backlog.md');
}
