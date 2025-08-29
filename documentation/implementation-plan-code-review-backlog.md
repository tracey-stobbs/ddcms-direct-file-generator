# Implementation Plan — Code Review Backlog

Last updated: 2025-08-29

Purpose

-   Execute the items in `documentation/review-issues.md` in a disciplined, trackable way.
-   Rule: One branch and one PR per backlog item. Do not batch unrelated changes.

Scope

-   Applies to all items listed in `documentation/review-issues.md` (Backlog summary).
-   Source of truth for status remains the backlog file; this plan defines the how.

Workflow overview

1. Pick the next item from the backlog summary (prefer lowest ID within the highest priority bucket).
2. Create a dedicated branch using the naming scheme below.
3. Implement the change minimally to meet the Acceptance criteria.
4. Add/update unit tests per project testing policy (Vitest) and run lint/build/tests locally.
5. Commit with a conventional message including the backlog ID.
6. Push branch and open a PR linked to the backlog item; request review.
7. Merge after approvals and green checks; update backlog status emoji.

Automation helpers

-   Prereqs: None required. Optional: create a `.env` (based on `.env.example`) and set `GITHUB_TOKEN` (or `GH_TOKEN`/`GITHUB_PAT`) to enable API PR creation; otherwise the script opens a prefilled compare page in your browser.
-   Set up commit template (optional, one-time):
    -   Run: npm run git:commit-template
-   Start work for an item (creates/pushes branch):
    -   Run: npm run backlog:start -- <ID>
-   Create a PR for an item (from its branch):
    -   Run: npm run backlog:pr -- <ID>
    -   With token: PR created via GitHub API (token should have repo or public_repo scope). Without token: browser opens on compare page prefilled with title/body.

Advanced: base override and debug

-   Base branch: By default, the script detects the remote HEAD (prefers `upstream`, then `origin`). If uncertain, it falls back to `master` or `main`. You can force a base branch via env: `BACKLOG_BASE=master`.
-   Debug output: Set `BACKLOG_DEBUG=1` to print the resolved origin/upstream, base branch, and head ref, plus any API error bodies (e.g., 422) for faster troubleshooting.
-   Forks: When `origin` and `upstream` point to different repos, the script uses `owner:branch` for `head` so cross-fork PRs work.
-   Windows note: Browser fallback uses PowerShell with safe quoting; no GitHub CLI dependency.

Branch naming

-   Format: `<type>/<short-slug>-<backlog-id>`
-   Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `ci`, `perf`, `security`
-   Examples:
    -   `chore/config-env-pattern-1`
    -   `refactor/domain-structure-2`
    -   `test/integration-api-6`
    -   `security/input-validation-15`

Commit message template

-   Conventional Commit with ID reference:
    -   `feat(config): establish typed /config module (Backlog #1)`

Pull request template (lightweight)

-   Title: `[Backlog-<ID>] <Short description>`
-   Body:
    -   Summary: What changed and why
    -   Linked item: `Backlog #<ID>` (and link to the section in the backlog file)
    -   Changes: bullets
    -   Tests: unit/integration added/updated
    -   Risk/impact: compatibility, rollbacks if needed
    -   Quality gates: lint/build/tests PASS

Definition of Done (per item)

-   Acceptance criteria in the backlog are satisfied.
-   Code compiles (tsc) and lints cleanly (eslint/prettier).
-   Tests added/updated; Vitest suite passes locally and in CI.
-   Docs updated where behavior changes (README/module docs/schemas).
-   PR merged; backlog status updated (🟢 for complete).

Sequencing

-   Priority order: P1 → P2 → P3.
-   Within the same priority, pick the lowest ID first unless a dependency dictates otherwise.
-   Suggested first passes:
    -   Security baseline (IDs 15, 16, 21)
    -   Testing foundation (ID 6), then CI coverage (ID 7)
    -   DevX enablers (IDs 12, 25), then structure (ID 2) and config (ID 1)

Risk management

-   Keep changes minimal; avoid cross-cutting refactors in feature PRs.
-   If scope grows, split into follow-up backlog items with new IDs and branches.
-   For risky changes, add a quick smoke test script or test case.

Item-to-branch mapping (initial)

-   1 → `chore/config-env-pattern-1`
-   2 → `refactor/domain-structure-2`
-   3 → `chore/interfaces-vs-types-policy-3`
-   4 → `chore/tsconfig-path-aliases-4`
-   5 → `docs/complex-types-docs-5`
-   6 → `test/integration-api-6`
-   7 → `ci/coverage-threshold-7`
-   8 → `test/e2e-critical-journeys-8`
-   9 → `docs/module-readmes-9`
-   10 → `docs/jsdoc-public-apis-10`
-   11 → `docs/openapi-swagger-11`
-   12 → `chore/precommit-hooks-12`
-   13 → `chore/static-analysis-13`
-   14 → `refactor/error-handling-standard-14`
-   15 → `security/input-validation-15`
-   16 → `security/ci-scanning-16`
-   17 → `security/rate-limiting-17`
-   18 → `perf/metrics-instrumentation-18`
-   19 → `perf/caching-strategy-19`
-   20 → `perf/profiling-setup-20`
-   21 → `ci/pipeline-completeness-21`
-   22 → `docs/deployment-rollback-22`
-   23 → `chore/utility-types-23`
-   24 → `chore/logging-monitoring-24`
-   25 → `chore/vscode-devcontainer-25`
-   26 → `process/tech-debt-backlog-26`

Operational checklist (per item)

1. Create branch (see mapping) and sync main.
2. Implement minimal changes for acceptance.
3. Update or add tests; run lint/build/tests locally.
4. Commit with message including Backlog #ID.
5. Push and open PR; ensure CI is green.
6. Merge after review; set backlog status to 🟢 Complete.

Notes

-   For items that add tooling (e.g., Husky, ESLint config), ensure reproducible setup in `package.json` and commit any required config files. Prefer minimal, pinned dependencies.
-   For structural refactors (IDs 1–2, 14), prefer incremental adoption with clear migration notes in the PR.
