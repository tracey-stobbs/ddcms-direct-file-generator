#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
const https = require('https');
const { execSync } = require('child_process');

function run(cmd) {
    return execSync(cmd, { encoding: 'utf8' }).trim();
}

const token = process.env.GITHUB_TOKEN;
if (!token) {
    console.error('GITHUB_TOKEN is required in the environment to close PRs.');
    console.error(
        'Create a token with `repo` scope and run: GITHUB_TOKEN=... node scripts/close-pr.js <numbers...>',
    );
    process.exit(2);
}

// Derive owner/repo from git remote
let repoUrl;
try {
    repoUrl = run('git config --get remote.origin.url');
} catch (e) {
    console.error('Failed to read git remote.origin.url');
    process.exit(3);
}
const m = repoUrl && repoUrl.match(/[:/]([^/]+)\/([^/.]+)(?:\.git)?$/);
if (!m) {
    console.error('Could not parse repository URL:', repoUrl);
    process.exit(4);
}
const owner = m[1];
const repo = m[2];

// Accept PR numbers as CLI args: either positional (50 51) or --numbers 50,51
function parseNumbers(argv) {
    const idx = argv.indexOf('--numbers');
    if (idx >= 0 && argv[idx + 1]) {
        return argv[idx + 1]
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .map((s) => Number(s))
            .filter((n) => Number.isFinite(n));
    }
    // positional after script name
    return argv
        .slice(2)
        .map((s) => Number(s))
        .filter((n) => Number.isFinite(n));
}

const numbers = parseNumbers(process.argv);
if (numbers.length === 0) {
    console.error('Usage: node scripts/close-pr.js <number> [number...]');
    console.error('   or: node scripts/close-pr.js --numbers 50,51');
    process.exit(1);
}

function patch(urlStr, payload) {
    const url = new URL(urlStr);
    const body = JSON.stringify(payload);
    const opts = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: 'PATCH',
        headers: {
            'User-Agent': 'shiny-palm-tree-bot',
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
        },
    };
    return new Promise((resolve, reject) => {
        const req = https.request(opts, (res) => {
            let data = '';
            res.on('data', (d) => (data += d));
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve({ ok: true });
                    }
                    return;
                }
                try {
                    const json = JSON.parse(data);
                    reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(json)}`));
                } catch (e) {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function closePr(number) {
    const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${number}`;
    // state=closed; if already closed, GitHub returns the PR with closed state
    try {
        const res = await patch(url, { state: 'closed' });
        const state = res && res.state;
        const merged = res && res.merged;
        console.log(
            `#${number} -> state=${state}${merged ? ' (merged)' : ''} ${
                res && res.html_url ? res.html_url : ''
            }`,
        );
        return { number, ok: true, state, merged };
    } catch (err) {
        console.error(`#${number} FAILED: ${err.message}`);
        return { number, ok: false, error: err.message };
    }
}

(async () => {
    const results = [];
    for (const n of numbers) {
         
        results.push(await closePr(n));
    }
    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0) process.exit(5);
    process.exit(0);
})();
