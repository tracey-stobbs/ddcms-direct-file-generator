import { execFileSync } from 'node:child_process';

function sh(cmd, args, stdio = ['ignore', 'pipe', 'ignore']) {
    return execFileSync(cmd, args, { stdio }).toString().trim();
}

function getRemoteUrl(remote = 'origin') {
    try {
        return sh('git', ['config', '--get', `remote.${remote}.url`]) || undefined;
    } catch {
        return undefined;
    }
}

function parseRepo(url) {
    if (!url) return undefined;
    let m = url.match(/github\.com\/?([^/]+)\/([^/.]+)(?:\.git)?$/i);
    if (m) return { owner: m[1], repo: m[2] };
    m = url.match(/github\.com:([^/]+)\/([^/.]+)(?:\.git)?$/i);
    if (m) return { owner: m[1], repo: m[2] };
    return undefined;
}

function getCurrentBranch() {
    try {
        return sh('git', ['branch', '--show-current']) || undefined;
    } catch {
        return undefined;
    }
}

function remoteHead(remote = 'origin') {
    try {
        const out = sh('git', ['symbolic-ref', '--short', `refs/remotes/${remote}/HEAD`]);
        const parts = out.split('/');
        if (parts.length >= 2) return parts[1];
        if (parts.length === 1 && parts[0]) return parts[0];
    } catch {}
    return 'master';
}

async function main() {
    const origin = parseRepo(getRemoteUrl('origin'));
    const upstream = parseRepo(getRemoteUrl('upstream'));
    const baseRepo = upstream ?? origin;
    if (!baseRepo) throw new Error('Cannot determine repo from remotes');
    const baseRemoteName = upstream ? 'upstream' : 'origin';
    const base = remoteHead(baseRemoteName);
    const branch = getCurrentBranch();
    if (!branch) throw new Error('Cannot resolve current branch');

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

    async function tryApi() {
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

main().catch((e) => {
    console.error(e?.stack || String(e));
    process.exitCode = 1;
});
