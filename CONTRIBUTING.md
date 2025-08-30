# Contributing

Welcome! This guide covers toolchain setup (Volta or nvm), local workflows, backlog execution, and PR expectations.

## Table of Contents

-   Toolchain
-   Development environment & VS Code setup
-   Project setup
-   Dev loop
-   Backlog execution workflow
-   Branching and commits
-   Pull Requests
-   Quality gates checklist
-   Environment notes
-   Troubleshooting
-   Ajv v8 + TypeScript typing tips
-   Filetype adapter pattern (developer guide)

## Toolchain

Required: Node.js 22 LTS and npm.

The repo provides both:

-   Volta pin in `package.json` → `{ volta: { node: "22.17.0" } }`
-   `.nvmrc` → `22`

Choose one of the setups below.

### Option A — Volta (recommended, works well on Windows)

-   If you already have Volta installed, nothing to do: Volta auto-uses Node 22.17.0 when you `cd` into the project.
-   To confirm:
    ```bash
    node -v   # v22.17.0 (or 22.x compatible)
    ```

### Option B — nvm (or nvm-windows)

-   Use the version from `.nvmrc`:
    ```bash
    nvm install 22
    nvm use 22
    node -v   # v22.x
    ```

## Development environment & VS Code setup

This project ships a tuned VS Code workspace for a smooth DX.

Recommended extensions:

-   TypeScript & Testing: TypeScript Next, Vitest Explorer
-   HTTP Testing: REST Client (for .http files)
-   Code Quality: ESLint, Prettier, Code Spell Checker
-   Git Integration: GitLens, GitHub PR/Issues
-   Node.js Tools: NPM Intellisense, Azure Node Pack
-   Documentation: Markdown All-in-One, Mermaid support
-   Productivity: Error Lens, Path Intellisense, Todo Highlight

Pre-configured settings:

-   Auto-format on save with Prettier
-   ESLint auto-fix on save
-   TypeScript import organization
-   REST Client optimization for .http files
-   Vitest integration for test running
-   Custom spell checker dictionary with project terms

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

## Backlog execution workflow

Single-source process for executing code review backlog items efficiently. Origin: Implementation Plan — Code Review Backlog (now consolidated here).

Rules and scope:

-   One branch and one PR per backlog item. Do not batch unrelated changes.
-   Source of truth for status remains the backlog summary file; this section defines how to execute items.

Workflow:

1. Pick the next item from the backlog summary (prefer lowest ID within the highest priority bucket).
2. Create a dedicated branch using the naming scheme below.
3. Implement the minimal change that meets the Acceptance criteria.
4. Add/update unit tests (Vitest) and run lint/build/tests locally.
5. Commit with a conventional message including the backlog ID.
6. Push branch and open a PR linked to the backlog item; request review.
7. Merge after approvals and green checks; update backlog status emoji.

Automation helpers:

-   Optional: set `GITHUB_TOKEN`/`GH_TOKEN`/`GITHUB_PAT` to enable API PR creation.
-   One-time (optional) commit template:
    -   `npm run git:commit-template`
-   Start work for an item (creates/pushes branch):
    -   `npm run backlog:start -- <ID>`
-   Create a PR for an item (from its branch):
    -   `npm run backlog:pr -- <ID>`
    -   With token: PR created via API; without token: opens prefilled compare page.

Advanced:

-   Base override: `BACKLOG_BASE=master` (auto-detects otherwise).
-   Debug: `BACKLOG_DEBUG=1` prints origin/upstream/base/head and API error bodies.
-   Forks: When origin≠upstream, uses `owner:branch` for cross-fork PRs.
-   Windows: Browser fallback uses PowerShell; no GitHub CLI required.

Branch naming:

-   Format: `<type>/<short-slug>-<backlog-id>`
-   Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `ci`, `perf`, `security`
-   Examples:
    -   `chore/config-env-pattern-1`
    -   `refactor/domain-structure-2`
    -   `test/integration-api-6`

Commit message template:

-   Conventional Commit including the backlog ID, e.g.: `feat(config): establish typed /config module (Backlog #1)`

Pull request template (lightweight):

-   Title: `[Backlog-<ID>] <Short description>`
-   Body:
    -   Summary: What changed and why
    -   Linked item: `Backlog #<ID>` (and link to the section in the backlog file)
    -   Changes: bullets
    -   Tests: unit/integration added/updated
    -   Risk/impact: compatibility, rollbacks if needed
    -   Quality gates: lint/build/tests PASS

Definition of Done (per item):

-   Acceptance criteria met
-   Build (tsc), Lint (eslint), Tests (vitest) are green
-   Docs updated where behavior changes
-   PR merged; backlog status updated (🟢 Complete)

## Branching and commits

-   Branch per issue: `feature/MCP-4.0-011-file-preview` (or similar)
-   Commit prefix with issue ID: `MCP-4.0-011: implement file.preview handler`
-   Link issues in PR description with `Closes #<issue>`

## Pull Requests

-   Use the PR template sections (Summary, Linked issues, Changes, Tests, Docs, Risk/impact, Notes).
-   Apply the “Quality gates checklist” before requesting review:
    -   Build (tsc), Lint (eslint), Tests (vitest)
    -   Smoke test if behavior changed
    -   Docs updated or N/A
    -   Security: no secrets, sandboxed IO
    -   Backward-compat preserved unless requirements say otherwise
    -   Schemas (if touched) validated and in sync
    -   Linked issue(s) included

## Quality gates checklist

-   Build: TypeScript compiles (tsc)
-   Lint: ESLint passes
-   Tests: unit tests pass (Vitest)
-   Behavior change? Small smoke test added/executed
-   Docs: README/schemas updated or N/A
-   Security: no secrets, sandboxed IO, no unsafe ops
-   Backward-compat: preserved unless explicitly changed
-   JSON Schemas (if touched): validated and in sync with code
-   Observability (if relevant): logs structured and minimal
-   Linked issue(s): included; PR auto-closes target issues

## Environment notes

-   OS: Windows; default shell in this workspace: bash.exe
-   If you need to persist env vars across sessions, add `export` lines to `~/.bashrc` (avoid committing secrets).

## Troubleshooting

-   Node version mismatch: ensure Volta or nvm picks Node 22.x (`node -v`).
-   Type errors: run `npm run build` locally to mirror CI.
-   Test failures: run `npm test` and `npm run test:watch` to iterate.

### Ajv v8 + TypeScript (ESM) typing tips

Ajv v8 is ESM-first. Use default import for the constructor and type-only imports for types. Avoid using the `Ajv` namespace as a type.

-   Symptoms you might see:
    -   TS2709: Cannot use namespace 'Ajv' as a type
    -   TS2351: This expression is not constructable (Ajv has no construct signatures)

Recommended pattern:

```ts
import Ajv from 'ajv';
import type { ErrorObject, ValidateFunction } from 'ajv';

type AjvInstance = import('ajv').default;

interface RouterOptions {
    ajv?: AjvInstance;
}

class ExampleRouter {
    private readonly ajv: AjvInstance;
    constructor(opts?: RouterOptions) {
        this.ajv = opts?.ajv ?? new Ajv({ allErrors: true, strict: true, allowUnionTypes: true });
    }
    // ...
}
```

Why: the default export is the constructor; types should be imported type-only to keep emit clean and avoid namespace-type errors.

Thanks for contributing!

## Filetype adapter pattern (developer guide)

We keep filetype-specific logic co-located with each filetype using a small adapter interface. Services stay thin and transport-agnostic; the factory routes to the right adapter.

-   Interface: see `src/lib/fileType/adapter.ts`

    -   `FileTypeAdapter`
        -   `buildPreviewRows(params) => string[][]`
        -   `serialize(rows, params) => string` (CSV with escaping)
        -   `previewMeta(rows, params) => { rows, columns, header, validity, fileType, sun }`
        -   `buildRow(params) => { row: { fields: string[], asLine: string } }`
    -   Shared helpers
        -   `computeInvalidRowsCap(numberOfRows, forInlineEditing)`
        -   `toCsvLine(fields)` (quotes fields containing comma/quote/newline; doubles quotes inside)
        -   `toInternalRequest(fileType, params)` bridges to legacy generator `Request` type

-   Factory: `src/lib/fileType/factory.ts`

    -   `getFileTypeAdapter(fileType)` returns the adapter for EaziPay, SDDirect, and Bacs18PaymentLines.
    -   Backward compat file-writer APIs remain for SDDirect/EaziPay (e.g., `generateEaziPayFile`).
    -   Bacs18PaymentLines is experimental and not supported by legacy file generators.

-   Services: thin orchestration

    -   `src/services/file.ts` delegates to adapter: `buildPreviewRows` → `serialize` → `previewMeta`.
    -   `src/services/row.ts` delegates to adapter: `buildRow`.
    -   MCP server adapts typed services to JsonValue at the transport boundary.

-   File writer orchestration

    -   `src/lib/fileWriter/fileWriter.ts` is transport-agnostic and now generates files entirely in-memory.
        -   `generateFile(request, sun)` uses the adapter to build rows, serialize content, compute meta, and compose a deterministic filename.
        -   Returns `{ filePath, fileContent }` where filePath is a virtual path rooted at `output/<fileType>/<SUN>` (overridden by `request.outputPath`).
        -   No disk writes occur in `generateFile`.
    -   `generateFileWithFs(request, fs, sun)` is a thin wrapper that ensures the target directory exists and persists the in-memory result using the provided `fs` implementation. Keeps backward compatibility for callers that expect files on disk.
    -   Public API behavior: `/generate` returns `fileContent` and sets `X-Generated-File` to the relative virtual path for traceability.

-   SDDirect headers contract
    -   Shared constants live in `sddirect.ts` as `SDFields` to avoid drift.
    -   Required headers + optional headers; when `includeOptionalFields` is a string[], only those optionals are included; meta.columns reflects the actual header set.

### Adding a new filetype (checklist)

1. Create `src/lib/fileType/<name>.ts` exporting `<name>Adapter: FileTypeAdapter`.
    - Implement `buildPreviewRows`, `serialize`, `previewMeta`, and `buildRow`.
    - Keep CSV correctness via `toCsvLine`.
    - Put filetype constants (headers, column counts) here alongside generators.
2. Register in `getFileTypeAdapter` (and any legacy generators if needed).
3. Add unit tests covering:
    - Header selection (required vs optional subset).
    - CSV escaping edge-cases.
    - Meta correctness (rows/columns/header/validity).
4. Update schemas if the public contract changes.
5. Run quality gates (lint/build/tests) before PR.

### Bacs18PaymentLines notes

-   Adapter: `src/lib/fileType/bacs18PaymentLines.ts`
-   Variants: `MULTI` (12 fields, 106 chars) and `DAILY` (11 fields, 100 chars)
-   Serializer produces fixed-width lines; no headers
-   Sanitization: uppercase and replace disallowed chars with spaces (allowed: A–Z, 0–9, ., &, /, -, space)
-   Disclaimer: Provided for preview/testing only. No guarantee of BACS acceptance.
