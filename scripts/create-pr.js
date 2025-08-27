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

const postData = JSON.stringify({
  title,
  head: branch,
  base: 'main',
  body,
});

const options = {
  hostname: 'api.github.com',
  path: `/repos/${owner}/${repo}/pulls`,
  method: 'POST',
  headers: {
    'User-Agent': 'shiny-palm-tree-bot',
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const json = JSON.parse(data);
      console.log('PR created:', json.html_url);
      process.exit(0);
    } else {
      console.error('Failed to create PR. Status:', res.statusCode);
      try { console.error(JSON.parse(data)); } catch(e) { console.error(data); }
      process.exit(4);
    }
  });
});

req.on('error', e => {
  console.error('Request error:', e);
  process.exit(5);
});

req.write(postData);
req.end();
