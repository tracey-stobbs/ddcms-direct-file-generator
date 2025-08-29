## MCP tools

### Creating GitHub issues from the code review

Artifacts

- `documentation/review-issues.md` — curated list of issues derived from the repo’s Code Review.
- `scripts/create-review-issues.sh` — helper script that opens all issues via GitHub CLI.

Usage

1. Install GitHub CLI and login (once):
	- https://cli.github.com/
	- Run: `gh auth login`
2. From repo root, run:
	- `bash scripts/create-review-issues.sh`
3. The script is idempotent; issues with identical titles are skipped.

If CLI is unavailable, open `documentation/review-issues.md` and create issues manually.

