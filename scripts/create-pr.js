#!/usr/bin/env node
const { execSync } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error('GITHUB_TOKEN is required in the environment to create a PR.');
  console.error('Create a token with `repo` scope and run: GITHUB_TOKEN=... node scripts/create-pr.js');
  process.exit(2);
}

const repoUrl = run('git config --get remote.origin.url');
// repoUrl may be in multiple formats; extract owner/repo
let m = repoUrl.match(/[:/]([^/]+)\/([^/.]+)(?:\.git)?$/);
if (!m) {
  console.error('Could not parse repository URL from git remote.origin.url:', repoUrl);
  process.exit(3);
}
const owner = m[1];
const repo = m[2];

const branch = run('git rev-parse --abbrev-ref HEAD');
const title = process.argv[2] || `chore(backlog): add backlog-ID -> commit check (${branch})`;
const body = process.argv[3] || 'Adds CI check that ensures completed backlog IDs in BACKLOG.md are referenced in commits or PRs.';

// Helper to GET repo metadata and obtain default_branch
function getRepoMeta(callback) {
  const opts = {
    hostname: 'api.github.com',
    path: `/repos/${owner}/${repo}`,
    method: 'GET',
    headers: {
      'User-Agent': 'shiny-palm-tree-bot',
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  };

  const req = https.request(opts, res => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const json = JSON.parse(data);
          return callback(null, json);
        } catch (e) {
          return callback(e);
        }
      }
      return callback(new Error(`Failed to fetch repo meta: ${res.statusCode}`));
    });
  });
  req.on('error', e => callback(e));
  req.end();
}

const postData = JSON.stringify({
  title,
  head: branch,
  base: 'main',
  body,
});

function doRequest(urlStr, redirectsLeft = 5) {
  const url = new URL(urlStr);
  const opts = {
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
      'User-Agent': 'shiny-palm-tree-bot',
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  const req = https.request(opts, res => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const json = JSON.parse(data);
        console.log('PR created:', json.html_url);
        process.exit(0);
      }

      // Follow redirects (307/301/302) when GitHub returns a moved response
      if ((res.statusCode === 307 || res.statusCode === 301 || res.statusCode === 302) && redirectsLeft > 0) {
        const loc = res.headers.location;
        if (loc) {
          console.log(`Following redirect to ${loc} (status ${res.statusCode})`);
          // retry against the new URL
          return doRequest(loc, redirectsLeft - 1);
        }
      }

      console.error('Failed to create PR. Status:', res.statusCode);
      try { console.error(JSON.parse(data)); } catch(e) { console.error(data); }
      process.exit(4);
    });
  });

  req.on('error', e => {
    console.error('Request error:', e);
    process.exit(5);
  });

  req.write(postData);
  req.end();
}

// Get default branch and then create PR against it
getRepoMeta((err, meta) => {
  if (err) {
    console.error('Could not determine default branch, falling back to "main". Error:', err.message || err);
    return doRequest(`https://api.github.com/repos/${owner}/${repo}/pulls`);
  }
  const base = meta.default_branch || 'main';
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls`;
  // adjust postData for base
  const payload = JSON.stringify({
    title,
    head: branch,
    base,
    body,
  });
  // override postData used by doRequest
  global.postData = payload;
  // call doRequest with explicit payload
  doRequest(url);
});
