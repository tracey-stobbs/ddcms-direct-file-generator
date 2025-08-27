#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const backlogPath = path.join(__dirname, '..', 'Backlog Management', 'Phase 4 - Project MCP', 'BACKLOG.md');
if (!fs.existsSync(backlogPath)) {
  console.error('BACKLOG.md not found at expected path:', backlogPath);
  process.exit(2);
}

const content = fs.readFileSync(backlogPath, 'utf8');

// Find completed items section by searching for 'Detailed item mapping (completed items):' or lines matching MCP-4.0-\d{3}
const completedSectionMatch = content.match(/Detailed item mapping \(completed items\):([\s\S]*?)\n\n/);
let ids = [];
if (completedSectionMatch) {
  const section = completedSectionMatch[1];
  const re = /MCP-\d\.\d-\d{3}/g;
  ids = Array.from(new Set(section.match(re) || []));
}

if (ids.length === 0) {
  console.log('No completed backlog IDs found in BACKLOG.md; nothing to check.');
  process.exit(0);
}

// Collect PR title/body if running in GitHub Actions with an event payload
let prText = '';
const ghEventPath = process.env.GITHUB_EVENT_PATH;
if (ghEventPath && fs.existsSync(ghEventPath)) {
  try {
    const evt = JSON.parse(fs.readFileSync(ghEventPath, 'utf8'));
    if (evt && evt.pull_request) {
      const pr = evt.pull_request;
      prText = `${pr.title || ''}\n${pr.body || ''}`;
    }
  } catch (err) {
    // ignore; fallback to commit search
  }
}

let missing = [];
ids.forEach(id => {
  // if PR text contains the id, consider it found
  if (prText && prText.includes(id)) return;

  try {
    // search commit messages across all refs
    const out = execSync(`git log --all --grep='${id}' --pretty=format:%H`, { encoding: 'utf8' }).trim();
    if (!out) missing.push(id);
  } catch (err) {
    missing.push(id);
  }
});

if (missing.length) {
  console.error('The following backlog IDs were not found in any commit message:', missing.join(', '));
  process.exit(3);
}

console.log('All completed backlog IDs found in commit history:', ids.join(', '));
process.exit(0);
