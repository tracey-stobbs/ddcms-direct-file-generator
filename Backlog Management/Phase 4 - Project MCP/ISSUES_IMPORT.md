# Importing Backlog as GitHub Issues

This folder includes a CSV (`github-issues.csv`) and a JSON (`github-issues.json`). GitHub does not provide a native CSV import for issues. Use one of the supported options below.

## Option A — GitHub CLI (recommended)
Use GitHub CLI to precreate labels/milestones and then create issues from the JSON file.

1) Create labels and milestones (idempotent):

```bash
# labels
for l in "Epic" "Story" "Task" "Spike" "FR1" "FR2" "FR3" "FR4" "FR5" "FR6" "FR7" "FR8" "NFR" \
         "Area:Transport" "Area:File" "Area:Row" "Area:EaziPay" "Area:SDDirect" "Area:Calendar" "Area:FS" "Area:Config" "Area:Runtime" "Area:Quality" "Area:Observability" "Area:Performance" "Area:Reliability" "Area:Testing" "MCP" \
         "P0" "P1" "P2" "P3"; do
  gh label create "$l" --color FFEE99 --force
done

# milestones
for m in "Phase 4.0" "Phase 4.1" "Phase 4.2" "Phase 4.3"; do
  gh milestone create "$m" || true
done
```

2) Create issues from JSON using bash + gh (no jq needed):

```bash
node -e "
const fs=require('fs');
const path='Backlog Management/Phase 4 - Project MCP/github-issues.json'.replaceAll('\\\\','/');
const issues=JSON.parse(fs.readFileSync(path,'utf8'));
for (const it of issues) {
  const labels = (it.labels||[]).map(s=>`--label \"${s}\"`).join(' ');
  const ms = it.milestone ? `--milestone \"${it.milestone}\"` : '';
  const cmd = `gh issue create --title \"${it.title}\" --body \"${it.body.replaceAll('"','\\"')}\" ${labels} ${ms}`;
  console.log(cmd);
}
" | bash
```

Notes:
- The loop prints gh commands and pipes them to bash. Review first by removing `| bash` to dry-run.
- Ensure you’re authenticated: `gh auth login`.

## Option B — Direct REST API via Node (no gh)
If gh isn’t available, use a small Node script to call GitHub’s REST API with a PAT (no admin rights needed). Set `GITHUB_TOKEN` and run a script to:
- Ensure labels exist (create if missing)
- Ensure milestones exist (create if missing)
- Create issues from `github-issues.json`

Script provided: `src/scripts/github/issues-import.ts`

Run from repo root (Windows bash):

```bash
export GITHUB_REPOSITORY="<owner>/<repo>"   # e.g., tracey-stobbs/shiny-palm-tree
export GITHUB_TOKEN="<your_pat_with_repo_scope>"
npm run issues:import
```

Notes:
- The script is idempotent for labels/milestones. Re-running only creates missing ones.
- Input file path: `Backlog Management/Phase 4 - Project MCP/github-issues.json`

## Why JSON, not CSV?
Issue bodies and titles include commas and newlines; JSON avoids fragile CSV parsing and works well in bash on Windows.

---

Generated from `REQUIREMENTS.md` (Phase 4). If you adjust requirements, regenerate `github-issues.json`/`github-issues.csv` to keep issues in sync.
