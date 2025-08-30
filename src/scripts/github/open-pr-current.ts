import 'dotenv/config';
import { execFileSync } from 'node:child_process';

function getRemoteUrl(remote: 'origin' | 'upstream' = 'origin'): string | undefined {
    try {
        return (
            execFileSync('git', ['config', '--get', `remote.${remote}.url`], {
                stdio: ['ignore', 'pipe', 'ignore'],
            })
                .toString()
                .trim() || undefined
        );
    } catch {
        return undefined;
    }
}

function parseRepo(url: string | undefined): { owner: string; repo: string } | undefined {
    if (!url) return undefined;
    const https = url.match(/github\.com\/?([^/]+)\/([^/.]+)(?:\.git)?$/i);
    if (https) return { owner: https[1], repo: https[2] };
    const ssh = url.match(/github\.com:([^/]+)\/([^/.]+)(?:\.git)?$/i);
    if (ssh) return { owner: ssh[1], repo: ssh[2] };
    return undefined;
}

function getCurrentBranch(): string | undefined {
    try {
        return (
            execFileSync('git', ['branch', '--show-current'], {
                stdio: ['ignore', 'pipe', 'ignore'],
            })
                .toString()
                .trim() || undefined
        );
    } catch {
        return undefined;
    }
}

function remoteHead(remote: 'origin' | 'upstream' = 'origin'): string {
    try {
        const out = execFileSync(
            'git',
            ['symbolic-ref', '--short', `refs/remotes/${remote}/HEAD`],
            { stdio: ['ignore', 'pipe', 'ignore'] },
        )
            .toString()
            .trim();
        const parts = out.split('/');
        if (parts.length >= 2) return parts[1];
        if (parts.length === 1 && parts[0]) return parts[0];
    } catch {}
    return 'master';
}

async function openPr(): Promise<void> {
    const origin = parseRepo(getRemoteUrl('origin'));
    const upstream = parseRepo(getRemoteUrl('upstream'));
    const maybeBaseRepo = upstream ?? origin;
    if (!maybeBaseRepo) throw new Error('Cannot determine repo from remotes');
    const baseRepo = maybeBaseRepo;
    const baseRemoteName: 'origin' | 'upstream' = upstream ? 'upstream' : 'origin';
    const base = remoteHead(baseRemoteName);
    const branch = getCurrentBranch();
    if (!branch) throw new Error('Cannot resolve current branch');

    // push branch
    try {
        execFileSync('git', ['push', '-u', 'origin', branch], { stdio: 'inherit' });
    } catch {}

    const headRef =
        upstream && origin && (origin.owner !== baseRepo.owner || origin.repo !== baseRepo.repo)
            ? `${origin.owner}:${branch}`
            : branch;

    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_PAT;
    const title = `[auto] ${branch}`;
    const body = `Automated PR for ${branch}`;

    async function tryApi(): Promise<boolean> {
        if (!token) return false;
        const res = await fetch(
            `https://api.github.com/repos/${baseRepo.owner}/${baseRepo.repo}/pulls`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    head: headRef,
                    base,
                    body,
                    maintainer_can_modify: true,
                    draft: false,
                }),
            },
        );
        if (res.status === 201) {
            const json = await res.json();

            console.log(`PR created: ${json.html_url}`);
            return true;
        }
        if (res.status === 422) {
            console.warn('PR may already exist or validation failed (422).');
            return false;
        }

        console.error(`PR API failed: ${res.status} ${res.statusText}`);
        return false;
    }

    if (!(await tryApi())) {
        const url = `https://github.com/${baseRepo.owner}/${
            baseRepo.repo
        }/compare/${encodeURIComponent(base)}...${encodeURIComponent(
            headRef,
        )}?quick_pull=1&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;

        console.log(`Open PR manually: ${url}`);
    }
}

openPr().catch((e) => {
    console.error(String(e));
    process.exitCode = 1;
});
