# Contributing

Welcome! This guide covers toolchain setup (Volta or nvm), local workflows, and PR expectations for this repo.

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

## Environment notes

-   OS: Windows; default shell in this workspace: bash.exe
-   If you need to persist env vars across sessions, add `export` lines to `~/.bashrc` (avoid committing secrets).

## Troubleshooting

-   Node version mismatch: ensure Volta or nvm picks Node 22.x (`node -v`).
-   Type errors: run `npm run build` locally to mirror CI.
-   Test failures: run `npm test` and `npm run test:watch` to iterate.

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
