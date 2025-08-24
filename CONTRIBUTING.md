# Contributing

Welcome! This guide covers toolchain setup (Volta or nvm), local workflows, and PR expectations for this repo.

## Toolchain

Required: Node.js 22 LTS and npm.

The repo provides both:
- Volta pin in `package.json` → `{ volta: { node: "22.17.0" } }`
- `.nvmrc` → `22`

Choose one of the setups below.

### Option A — Volta (recommended, works well on Windows)
- If you already have Volta installed, nothing to do: Volta auto-uses Node 22.17.0 when you `cd` into the project.
- To confirm:
  ```bash
  node -v   # v22.17.0 (or 22.x compatible)
  ```

### Option B — nvm (or nvm-windows)
- Use the version from `.nvmrc`:
  ```bash
  nvm install 22
  nvm use 22
  node -v   # v22.x
  ```

## Project setup

From the repo root:
```bash
npm ci
npm run build
npm test
```

Dev loop:
```bash
npm run dev           # ts-node (or use watch)
npm run test:watch    # Vitest watch mode
npm run lint          # ESLint
```

## Branching and commits
- Branch per issue: `feature/MCP-4.0-011-file-preview` (or similar)
- Commit prefix with issue ID: `MCP-4.0-011: implement file.preview handler`
- Link issues in PR description with `Closes #<issue>`

## Pull Requests
- Use the PR template sections (Summary, Linked issues, Changes, Tests, Docs, Risk/impact, Notes).
- Apply the “Quality gates checklist” before requesting review:
  - Build (tsc), Lint (eslint), Tests (vitest)
  - Smoke test if behavior changed
  - Docs updated or N/A
  - Security: no secrets, sandboxed IO
  - Backward-compat preserved unless requirements say otherwise
  - Schemas (if touched) validated and in sync
  - Linked issue(s) included

## Environment notes
- OS: Windows; default shell in this workspace: bash.exe
- If you need to persist env vars across sessions, add `export` lines to `~/.bashrc` (avoid committing secrets).

## Troubleshooting
- Node version mismatch: ensure Volta or nvm picks Node 22.x (`node -v`).
- Type errors: run `npm run build` locally to mirror CI.
- Test failures: run `npm test` and `npm run test:watch` to iterate.

Thanks for contributing!
