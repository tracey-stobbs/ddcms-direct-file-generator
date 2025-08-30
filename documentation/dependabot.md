# Dependabot in this repo

This repository uses Dependabot to keep npm dependencies and GitHub Actions up-to-date with low maintenance overhead.

## What it updates

-   npm dependencies (root `package.json`/`package-lock.json`)
-   GitHub Actions workflow actions

## Schedule

-   npm: weekly on Mondays at 04:00 UTC
-   GitHub Actions: weekly on Mondays at 04:30 UTC

Configuration lives in `.github/dependabot.yml`.

## PR conventions

-   Commit message prefixes:
    -   `deps`: npm package updates
    -   `deps(actions)`: GitHub Actions updates
-   Limit: up to 5 open PRs per ecosystem to avoid noise.

## Handling PRs

1. Let CI run (lint/build/tests + security checks).
2. If green, prefer squash-merge with a clear message (e.g., `deps: bump <name> from x to y`).
3. If a bump causes breaking changes, label the PR (e.g., `breaking`) and raise a follow-up task to adapt code.

## TypeScript version note

Tooling currently warns about TypeScript >=5.5 with `@typescript-eslint`. We temporarily ignore TS updates >=5.5 in Dependabot to avoid churn. Once the ESLint tooling supports newer TS, remove the ignore:

```yaml
ignore:
    - dependency-name: 'typescript'
      versions: ['>=5.5.0']
```

## Tips

-   Rebase stale PRs by commenting `@dependabot rebase`.
-   Temporarily pause updates by changing the schedule to `monthly`.
-   For security fixes only, add a separate weekly job with `security-updates: true`.
