/*
  Import GitHub issues, labels, and milestones from JSON using GitHub REST API.
  Requirements:
  - Environment: GITHUB_TOKEN (repo scope), GITHUB_REPOSITORY (owner/repo)
  - Input file: Backlog Management/Phase 4 - Project MCP/github-issues.json
  Safe for Windows bash; no admin rights required.
*/

import fs from 'fs';
import https from 'https';
import path from 'path';

type IssueInput = {
  title: string;
  body: string;
  labels?: string[];
  milestone?: string | null;
};

type Label = { name: string; color?: string; description?: string };

const OWNER_REPO = process.env.GITHUB_REPOSITORY; // e.g., "tracey-stobbs/shiny-palm-tree"
const TOKEN = process.env.GITHUB_TOKEN;

if (!OWNER_REPO) {
  console.error('GITHUB_REPOSITORY env var is required (format: owner/repo).');
  process.exit(1);
}
if (!TOKEN) {
  console.error('GITHUB_TOKEN env var is required with repo scope.');
  process.exit(1);
}

const [owner, repo] = OWNER_REPO.split('/');

const INPUT_RELATIVE = path.join(
  'Backlog Management',
  'Phase 4 - Project MCP',
  'github-issues.json',
);
const INPUT_PATH = path.resolve(process.cwd(), INPUT_RELATIVE);

function request<T>(method: 'GET' | 'POST' | 'PATCH', urlPath: string, body?: unknown): Promise<T> {
  const options: https.RequestOptions = {
    method,
    hostname: 'api.github.com',
    path: urlPath,
    headers: {
      'User-Agent': 'shiny-palm-tree-issues-import-script',
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${TOKEN}`,
    },
  };
  return new Promise<T>((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(text ? JSON.parse(text) : ({} as T));
          } catch {
            resolve({} as T);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${text}`));
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function ensureLabel(label: Label): Promise<void> {
  try {
    await request('GET', `/repos/${owner}/${repo}/labels/${encodeURIComponent(label.name)}`);
  } catch {
    await request('POST', `/repos/${owner}/${repo}/labels`, {
      name: label.name,
      color: label.color || 'ffee99',
      description: label.description || '',
    });
  }
}

async function listMilestones(): Promise<Array<{ number: number; title: string }>> {
  return request('GET', `/repos/${owner}/${repo}/milestones?state=all&per_page=100`);
}

async function ensureMilestone(title: string): Promise<number> {
  const existing = await listMilestones();
  const found = existing.find((m) => m.title === title);
  if (found) return found.number;
  const created = await request<{ number: number }>('POST', `/repos/${owner}/${repo}/milestones`, {
    title,
  });
  return created.number;
}

async function createIssue(issue: IssueInput): Promise<void> {
  let milestoneNumber: number | undefined;
  if (issue.milestone) {
    milestoneNumber = await ensureMilestone(issue.milestone);
  }
  const labels = issue.labels ?? [];
  for (const name of labels) {
    await ensureLabel({ name });
  }
  await request('POST', `/repos/${owner}/${repo}/issues`, {
    title: issue.title,
    body: issue.body,
    labels,
    milestone: milestoneNumber,
  });
}

function loadIssues(): IssueInput[] {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`Input file not found: ${INPUT_PATH}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(INPUT_PATH, 'utf8');
  const data = JSON.parse(raw) as IssueInput[];
  return data;
}

async function main(): Promise<void> {
  const issues = loadIssues();
  console.log(`Importing ${issues.length} issues into ${OWNER_REPO} ...`);
  let ok = 0;
  let fail = 0;
  for (const it of issues) {
    try {
      await createIssue(it);
      ok++;
      console.log(`✔ Created: ${it.title}`);
    } catch (e: unknown) {
      fail++;
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`✖ Failed: ${it.title} -> ${msg}`);
    }
  }
  console.log(`Done. Success: ${ok}, Failed: ${fail}`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
