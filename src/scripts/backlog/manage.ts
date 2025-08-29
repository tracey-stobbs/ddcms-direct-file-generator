/*
  Backlog automation: create branches and open PRs per backlog item.
  Usage:
    ts-node src/scripts/backlog/manage.ts start <ID>
    ts-node src/scripts/backlog/manage.ts pr <ID>
*/

import 'dotenv/config';
import { execFileSync, execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type Command = 'start' | 'pr';

const repoRoot = process.cwd();
const backlogPath = join(repoRoot, 'documentation', 'review-issues.md');

const branchMap: Record<number, string> = {
    1: 'chore/config-env-pattern-1',
    2: 'refactor/domain-structure-2',
    3: 'chore/interfaces-vs-types-policy-3',
    4: 'chore/tsconfig-path-aliases-4',
    5: 'docs/complex-types-docs-5',
    6: 'test/integration-api-6',
    7: 'ci/coverage-threshold-7',
    8: 'test/e2e-critical-journeys-8',
    9: 'docs/module-readmes-9',
    10: 'docs/jsdoc-public-apis-10',
    11: 'docs/openapi-swagger-11',
    12: 'chore/precommit-hooks-12',
    13: 'chore/static-analysis-13',
    14: 'refactor/error-handling-standard-14',
    15: 'security/input-validation-15',
    16: 'security/ci-scanning-16',
    17: 'security/rate-limiting-17',
    18: 'perf/metrics-instrumentation-18',
    19: 'perf/caching-strategy-19',
    20: 'perf/profiling-setup-20',
    21: 'ci/pipeline-completeness-21',
    22: 'docs/deployment-rollback-22',
    23: 'chore/utility-types-23',
    24: 'chore/logging-monitoring-24',
    25: 'chore/vscode-devcontainer-25',
    26: 'process/tech-debt-backlog-26',
};

function ensureId(raw: string | undefined): number {
    if (!raw) throw new Error('Missing ID. Usage: start|pr <ID>');
    const id = Number(raw);
    if (!Number.isInteger(id) || id < 1) throw new Error('Invalid ID');
    return id;
}

function getBranchName(id: number): string {
    const name = branchMap[id];
    if (!name) throw new Error(`No branch mapping for ID ${id}`);
    return name;
}

function parseTitleFromBacklog(id: number): string | undefined {
    const md = readFileSync(backlogPath, 'utf8');
    const lines = md.split(/\r?\n/);
    const startIdx = lines.findIndex((l) => /^##\s+Backlog summary\s*$/i.test(l));
    if (startIdx === -1) return undefined;
    let endIdx = lines.length;
    for (let i = startIdx + 1; i < lines.length; i += 1) {
        if (/^---\s*$/.test(lines[i]) || /^##\s+/.test(lines[i])) {
            endIdx = i;
            break;
        }
    }
    const row = lines
        .slice(startIdx, endIdx)
        .find((l) => new RegExp(`^\\|\\s*${id}\\s*\\|`).test(l));
    if (!row) return undefined;
    const cells = row.split('|').map((c) => c.trim());
    const title = cells[2];
    return title || undefined;
}

function ensureIdInBacklog(id: number): { title?: string } {
    const title = parseTitleFromBacklog(id);
    if (!title) {
        const md = readFileSync(backlogPath, 'utf8');
        const lines = md.split(/\r?\n/);
        const startIdx = lines.findIndex((l) => /^##\s+Backlog summary\s*$/i.test(l));
        let inSummary = false;
        if (startIdx !== -1) {
            let endIdx = lines.length;
            for (let i = startIdx + 1; i < lines.length; i += 1) {
                if (/^---\s*$/.test(lines[i]) || /^##\s+/.test(lines[i])) {
                    endIdx = i;
                    break;
                }
            }
            inSummary = lines
                .slice(startIdx, endIdx)
                .some((l) => new RegExp(`^\\|\\s*${id}\\s*\\|`).test(l));
        }
        if (!inSummary) {
            // eslint-disable-next-line no-console
            console.error(
                `Backlog ID ${id} not found in Backlog summary table. Update documentation/review-issues.md first.`,
            );
            process.exit(1);
        }
        // eslint-disable-next-line no-console
        console.warn(`Backlog ID ${id} found but title is missing in the summary table.`);
    }
    return { title };
}

function run(cmd: string, args: string[]): void {
    execFileSync(cmd, args, { stdio: 'inherit' });
}

function git(args: string[]): void {
    run('git', args);
}

function getRemoteUrl(remoteName: 'origin' | 'upstream' = 'origin'): string | undefined {
    try {
        const out = execFileSync('git', ['config', '--get', `remote.${remoteName}.url`], {
            stdio: ['ignore', 'pipe', 'ignore'],
        })
            .toString()
            .trim();
        return out || undefined;
    } catch {
        return undefined;
    }
}

function parseRepo(url: string | undefined): { owner: string; repo: string } | undefined {
    if (!url) return undefined;
    const httpsMatch = url.match(/github\.com\/?([^/]+)\/([^/.]+)(?:\.git)?$/i);
    if (httpsMatch) return { owner: httpsMatch[1], repo: httpsMatch[2] };
    const sshMatch = url.match(/github\.com:([^/]+)\/([^/.]+)(?:\.git)?$/i);
    if (sshMatch) return { owner: sshMatch[1], repo: sshMatch[2] };
    return undefined;
}

function getDefaultBaseBranch(remoteName: 'origin' | 'upstream' = 'origin'): string {
    // Try to resolve the remote HEAD branch robustly
    try {
        // Example output: origin/main
        const out = execSync(`git symbolic-ref --short refs/remotes/${remoteName}/HEAD`, {
            stdio: ['ignore', 'pipe', 'ignore'],
        })
            .toString()
            .trim();
        const parts = out.split('/');
        if (parts.length >= 2) return parts[1];
        if (parts.length === 1 && parts[0]) return parts[0];
    } catch {
        // ignore and try remote show
    }
    try {
        const show = execSync(`git remote show ${remoteName}`, {
            stdio: ['ignore', 'pipe', 'ignore'],
        })
            .toString()
            .split(/\r?\n/);
        const headLine = show.find((l) => /HEAD branch:\s+\S+/.test(l));
        if (headLine) {
            const m = headLine.match(/HEAD branch:\s+(\S+)/);
            if (m) return m[1];
        }
    } catch {
        // ignore
    }
    return 'main';
}

function hasRemoteBranch(remoteName: 'origin' | 'upstream', branch: string): boolean {
    try {
        const out = execSync(`git ls-remote --heads ${remoteName} ${branch}`, {
            stdio: ['ignore', 'pipe', 'ignore'],
        })
            .toString()
            .trim();
        return out.length > 0;
    } catch {
        return false;
    }
}

function getToken(): string | undefined {
    return process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_PAT || undefined;
}

async function createPrViaApi(params: {
    owner: string;
    repo: string;
    head: string; // same-repo branch name or "owner:branch" for forks
    base: string;
    title: string;
    body: string;
}): Promise<boolean> {
    const token = getToken();
    if (!token) return false;
    try {
        const scopesRes = await fetch('https://api.github.com/rate_limit', {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
            },
        });
        if (scopesRes.ok) {
            const scopesHeader = scopesRes.headers.get('x-oauth-scopes') || '';
            const scopes = scopesHeader
                .split(',')
                .map((s) => s.trim().toLowerCase())
                .filter(Boolean);
            const hasRepo = scopes.includes('repo') || scopes.includes('public_repo');
            if (!hasRepo) {
                // eslint-disable-next-line no-console
                console.warn('Token appears to lack repo/public_repo scope; PR creation may fail.');
            }
        }
    } catch {
        // ignore
    }
    const { owner, repo, head, base, title, body } = params;
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title,
            head,
            base,
            body,
            maintainer_can_modify: true,
            draft: false,
        }),
    });
    if (res.status === 201) return true;
    if (res.status === 422) {
        try {
            const bodyJson = await res.json();
            // eslint-disable-next-line no-console
            console.warn('GitHub API 422 response:', JSON.stringify(bodyJson));
        } catch {
            try {
                const txt = await res.text();
                // eslint-disable-next-line no-console
                console.warn('GitHub API 422 text response:', txt);
            } catch {
                // ignore
            }
        }
        return false;
    }
    // eslint-disable-next-line no-console
    console.error(`GitHub API PR create failed: ${res.status} ${res.statusText}`);
    return false;
}

function openUrlInBrowser(url: string): void {
    const platform = process.platform;
    try {
        if (platform === 'win32') {
            try {
                // Prefer PowerShell, quote URL within the command to avoid parsing special characters
                const urlForPS = url.replace(/'/g, "''");
                execFileSync('powershell', [
                    '-NoProfile',
                    '-ExecutionPolicy',
                    'Bypass',
                    '-Command',
                    `Start-Process '${urlForPS}'`,
                ]);
            } catch {
                // Fallback to cmd start with quoted URL
                // start "" "<url>"
                const quoted = `"${url.replace(/"/g, '""')}"`;
                execFileSync('cmd', ['/c', 'start', '""', quoted]);
            }
        } else if (platform === 'darwin') {
            execFileSync('open', [url]);
        } else {
            execFileSync('xdg-open', [url]);
        }
    } catch {
        // eslint-disable-next-line no-console
        console.error(`Open this URL to create the PR: ${url}`);
    }
}

function startBranch(id: number): void {
    ensureIdInBacklog(id);
    const branch = getBranchName(id);
    git(['checkout', '-b', branch]);
    try {
        git(['push', '-u', 'origin', branch]);
    } catch {
        // ignore push failures
    }
    // eslint-disable-next-line no-console
    console.log(`\nBranch ready: ${branch}\n`);
}

async function openPr(id: number): Promise<void> {
    const branch = getBranchName(id);
    const { title: titleFromBacklog } = ensureIdInBacklog(id);
    const prTitle = `[Backlog-${id}] ${titleFromBacklog ?? 'Update for backlog item'}`;
    const body = [
        `Linked item: Backlog #${id}`,
        '',
        'Summary',
        '- What changed and why',
        '',
        'Changes',
        '- ...',
        '',
        'Tests',
        '- Unit/integration tests added or updated',
        '',
        'Quality gates',
        '- [ ] Lint PASS',
        '- [ ] Build PASS',
        '- [ ] Tests PASS',
    ].join('\n');

    const debug = process.env.BACKLOG_DEBUG === '1' || process.env.BACKLOG_DEBUG === 'true';

    try {
        git(['checkout', branch]);
    } catch {
        // eslint-disable-next-line no-console
        console.error(`Branch ${branch} not found locally. Run start first.`);
        return;
    }
    try {
        git(['push', '-u', 'origin', branch]);
    } catch {
        // ignore
    }

    const originUrl = getRemoteUrl('origin');
    const upstreamUrl = getRemoteUrl('upstream');
    const origin = parseRepo(originUrl);
    const upstream = parseRepo(upstreamUrl);
    const baseRemote = upstream ?? origin;
    if (!baseRemote) {
        // eslint-disable-next-line no-console
        console.error('Cannot determine GitHub repo from git remotes (origin/upstream).');
        return;
    }
    const baseRemoteName: 'origin' | 'upstream' = upstream ? 'upstream' : 'origin';
    // Allow manual override via env var
    const baseOverride = process.env.BACKLOG_BASE && process.env.BACKLOG_BASE.trim();
    let base = baseOverride || getDefaultBaseBranch(baseRemoteName);
    // Validate base exists on the remote; fallback to common names if not
    if (!hasRemoteBranch(baseRemoteName, base)) {
        if (baseOverride) {
            // eslint-disable-next-line no-console
            console.warn(
                `BACKLOG_BASE='${baseOverride}' not found on ${baseRemoteName}; attempting common fallbacks.`,
            );
        }
        if (hasRemoteBranch(baseRemoteName, 'master')) base = 'master';
        else if (hasRemoteBranch(baseRemoteName, 'main')) base = 'main';
    }
    const headRef =
        upstream && origin && (origin.owner !== baseRemote.owner || origin.repo !== baseRemote.repo)
            ? `${origin.owner}:${branch}`
            : branch;

    if (debug) {
        // eslint-disable-next-line no-console
        console.log(
            JSON.stringify(
                {
                    originUrl,
                    upstreamUrl,
                    origin,
                    upstream,
                    baseRemoteName,
                    baseRemote,
                    base,
                    headRef,
                    branch,
                },
                null,
                2,
            ),
        );
    }

    const ok = await createPrViaApi({
        owner: baseRemote.owner,
        repo: baseRemote.repo,
        head: headRef,
        base,
        title: prTitle,
        body,
    });
    if (ok) {
        // eslint-disable-next-line no-console
        console.log('PR created or already exists.');
        return;
    }
    const url = `https://github.com/${baseRemote.owner}/${
        baseRemote.repo
    }/compare/${encodeURIComponent(base)}...${encodeURIComponent(
        headRef,
    )}?quick_pull=1&title=${encodeURIComponent(prTitle)}&body=${encodeURIComponent(body)}`;
    openUrlInBrowser(url);
}

async function main(): Promise<void> {
    const [cmdRaw, idRaw] = process.argv.slice(2);
    const cmd = (cmdRaw as Command) || undefined;
    const id = ensureId(idRaw);

    switch (cmd) {
        case 'start':
            startBranch(id);
            break;
        case 'pr':
            await openPr(id);
            break;
        default:
            throw new Error('Usage: start|pr <ID>');
    }
}

main().catch((e) => {
    // eslint-disable-next-line no-console
    console.error(String(e));
    process.exitCode = 1;
});
