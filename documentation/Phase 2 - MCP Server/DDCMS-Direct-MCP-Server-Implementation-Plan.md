# DDCMS Direct MCP Server – Implementation Plan

Version: 1.0.0
Status: Draft for Review

Last updated: 2025-08-20

## overview

Goal: convert the existing Express/TypeScript solution into a standards-compliant MCP server that exposes tools for generating files and returning sample rows (starting with EaziPay and SDDirect; Bacs18 is deferred). The MCP server should reuse current generators, validators, and logging, while providing a clean tool contract for agents.

Success criteria:

- Tools to generate EaziPay files and return valid/invalid rows work via MCP with the same behavior as the HTTP routes.
- Standardized error/warning model and progress events for long-running tasks.
- Strong validation and safe filesystem boundaries (no traversal; constrained to output/…).
- Unit and integration tests for tool handlers; overall green test suite.

## scope

In scope (Phase 2):

- MCP transport over stdio; JSON-RPC 2.0 implementation (via an MCP Node SDK or minimal transport shim).
- Tools for EaziPay + SDDirect: generate_file, get_valid_row, get_invalid_row.
- Common tools: list_supported_formats, preview_file_name, validate_processing_date, list_output_files, read_output_file.
- Resource exposure: read-only access to generated artifacts under `output/`.
- Logging/metrics using existing logger.

Out of scope (now):

- Authentication/authorization.
- Cloud storage destinations.
- Bacs18 file types (post-MCP foundation).

Assumptions:

- Node.js 18+ runtime available.
- Keep existing HTTP server during transition; MCP runs alongside (separate entrypoint).

## architecture

High-level components:

- mcp/server (transport + registration)
- mcp/tools (tool handlers)
- mcp/adapters (bridge tool params → existing validators/generators)
- mcp/schemas (JSON Schemas for params/results)
- mcp/resources (listing/reading artifacts)
- reuse existing: `src/lib/fileType/*`, `src/lib/validators/*`, `src/lib/utils/logger`

Design patterns:

- Adapter: MCP tools adapt to existing generator contracts without changing core logic.
- Factory: continue using `getFileGenerator(fileType)` to select implementation (OCP).
- Template Method (lightweight): common wrapper for validation/logging/progress; per-tool business logic injected.

## deliverables

- New code under `src/mcp/`:
  - `src/mcp/server.ts` – bootstrap MCP server (stdio), tool registration, graceful shutdown
  - `src/mcp/tools/*.ts` – tool handlers (eazipay, sddirect, common)
  - `src/mcp/adapters/*.ts` – normalization + generator bridges
  - `src/mcp/schemas/*.ts` – Zod or TS-to-JSON Schema for tool params/results
  - `src/mcp/resources/*.ts` – list/read output files with path safety
- Tests:
  - `src/mcp/**/*.test.ts` for unit/integration
- Docs:
  - This implementation plan
  - Update `README.md` with MCP usage

## phases & tasks

Phase 0 – baseline (done/verify)

- Ensure tests are green; build/lint clean.
- Confirm EaziPay/SDDirect routes and mappers are stable.

Phase 1 – project scaffolding

- Create `src/mcp/server.ts` with stdio transport and JSON-RPC handler registration.
- Add npm scripts: `build` includes `src/mcp/**`, and `start:mcp` to run the built server.
- Add graceful shutdown and health logging.

Phase 2 – core schemas and validation

- Define common error model: `{ status, code, message, details: string[] }`.
- Define tool param/result schemas (Zod preferred) and export JSON Schemas for MCP introspection.
- Reuse `validateAndNormalizeMcpRequest` and `isValidSun`; expose MCP-ready adapters.

Phase 3 – EaziPay tools

- Tools: `eazipay.generate_file`, `eazipay.get_valid_row`, `eazipay.get_invalid_row`.
- Implement adapters:
  - Normalize request, apply SUN defaults (using SUN_STUB), set output path, ensure dir exists.
  - Call `getFileGenerator('EaziPay')` for file generation; map response.
  - For rows, call `generateValidEaziPayRow`/`generateInvalidEaziPayRow` + `mapEaziPayFieldsToRecord` and `getEaziPayHeaders`.
- Emit progress events (0/25/50/75/100) for generate_file.

Phase 4 – SDDirect tools

- Tools: `sddirect.generate_file`, `sddirect.get_valid_row`, `sddirect.get_invalid_row`.
- Implement using existing SDDirect generator and `getSDDirectHeaders` + `mapSDDirectRowToRecord`.

Phase 5 – common tools

- `common.list_supported_formats` – static description per file type (headers support, date formats, filename patterns).
- `common.preview_file_name` – use existing naming rules and date formatting to project filename.
- `common.validate_processing_date` – validate and normalize date per file type.
- `common.list_output_files` – enumerate outputs under constrained root; sort by mtime desc; bounded `limit`.
- `common.read_output_file` – safe path resolution; partial reads with `offset`/`length` caps.

Phase 6 – observability & robustness

- Integrate `logRequest`/`logResponse` semantics at tool boundaries (tool name + params redaction).
- Map exceptions to error model and log full stack.
- Add concurrency guard (queue/worker pool) with config.

Phase 7 – tests

- Unit: schemas, validators, adapters, path safety, filename preview.
- Integration: simulate MCP tool calls end-to-end; generate files; inspect small samples.
- Contract: validate tool params/results against JSON Schemas.

Phase 8 – docs & packaging

- Update `README.md` with MCP server usage, tools list, and examples.
- Add `CHANGELOG.md` entry; include deprecation note pointing to MCP from HTTP where relevant.

Phase 9 – rollout

- Keep HTTP server; introduce MCP in parallel.
- Collect feedback; iterate; then consider deprecating HTTP for agent use.

## tools inventory (initial)

1. eazipay.generate_file

- Params: { sun, numberOfRows?, hasInvalidRows?, forInlineEditing?, dateFormat?, processingDate?, outputPath?, includeHeaders? (ignored) }
- Result: { fileType, sun, fileName, outputPath, rowsWritten, includeHeadersEffective, processingDate, warnings[] }
- Errors: VALIDATION_ERROR, GENERATION_FAILED
- Maps to: `getFileGenerator('EaziPay')` and adapters

2. eazipay.get_valid_row

- Params: { sun, rowCount? }
- Result: { headers, rows, metadata }
- Maps to: `generateValidEaziPayRow` + `mapEaziPayFieldsToRecord` + `getEaziPayHeaders`

3. eazipay.get_invalid_row

- Params: { sun, rowCount? }
- Result: { headers, rows, metadata }
- Maps to: `generateInvalidEaziPayRow` + `mapEaziPayFieldsToRecord` + `getEaziPayHeaders`

4. sddirect.generate_file

- Params: analogous to eazipay.generate_file, honoring `includeHeaders`
- Maps to: `getFileGenerator('SDDirect')`

5. sddirect.get_valid_row / sddirect.get_invalid_row

- Maps to: `generateValidSDDirectRow` / `generateInvalidSDDirectRow` + `mapSDDirectRowToRecord` + `getSDDirectHeaders`

6. common.list_supported_formats

- Static capability description per file type.

7. common.preview_file_name

- Computes filename per rules (rows, headers flag, validity designator, timestamp); returns column count and extensions.

8. common.validate_processing_date

- Validates business day/formatting; returns normalized date + warnings.

9. common.list_output_files

- Safe directory enumeration with filters and limits.

10. common.read_output_file

- Safe file read with `offset`/`length` and encoding.

## adapters (contracts)

- Inputs: JSON from MCP tools → Zod-validated → internal Request shape.
- Outputs: Internal results → tool result JSON matching schemas.
- Error model: unify to `{ status, code, message, details[] }`.

Pseudo-flow (generate_file):

- validate sun (\d{6})
- parse body → normalized
- normalized.defaultValues.originatingAccountDetails = SUN_STUB
- normalized.outputPath ||= output/{fileType}/{sun}
- ensure directory
- progress(0)
- const generator = getFileGenerator(fileType)
- const filePath = await generator(normalized, nodeFs)
- progress(100)
- map to result JSON (relative path pieces)

## transport & runtime

- Transport: stdio (primary). Optional WebSocket later.
- Cancellation: honor MCP cancellation token if available; otherwise best-effort.
- Concurrency: configurable worker pool (default = CPU cores); queue overflow returns 429-equivalent error.
- Config via env:
  - OUTPUT_ROOT=./output
  - MAX_ROWS=10000
  - READ_MAX_LENGTH=1048576
  - WORKERS=os.cpus().length
  - LOG_LEVEL=info

## security & safety

- Filesystem: resolve and normalize paths; assert they remain within OUTPUT_ROOT/fileType/sun.
- Inputs: strict schema validation; numeric caps; sanitize strings for filenames.
- No secrets in code; no process kills; graceful shutdown only.

## observability

- Log structure: { timestamp, level, tool, durationMs, success, warnings, errorCode? }.
- Progress events at milestones.
- Metrics (future): counters by tool; avg duration; failure rates.

## performance

- EaziPay/SDDirect generation (<1k rows): target <2s on typical dev hardware.
- Stream writes; avoid loading whole files in memory.
- Partial reads for large files; cap read length.

## testing strategy

- Unit tests: schemas, adapters, path safety, filename preview.
- Integration tests: invoke tools end-to-end; verify file artifacts and row payloads.
- Contract tests: validate params/results with JSON Schemas.
- Coverage: maintain existing green tests; add MCP tests without disabling any current tests.

## migration plan

- Keep HTTP API for manual/legacy usage; add Deprecation links nudging to MCP.
- MCP server runs via `npm run start:mcp` alongside HTTP server.
- Clients (agents) move to MCP tools; HTTP remains until sunset after feedback window.

## risks & mitigations

- SDK maturity (MCP/JSON-RPC libs): keep transport layer thin; swap if needed.
- Path traversal: double-check normalization + prefix guard; add tests.
- Concurrency spikes: add queue limits; return informative errors.
- Date/format drift: reuse existing validators; snapshot tests for filenames.

## acceptance criteria

- All listed tools implemented for EaziPay and SDDirect.
- Tool behavior matches HTTP responses for same inputs (functional parity).
- Progress events emitted for generate_file.
- Path traversal attempts rejected; safe reads enforced.
- Tests green (unit + integration) with coverage for new MCP code.
- README documents the tools and basic usage.

## timeline (indicative)

- Phase 1–2: 0.5 day
- Phase 3: 0.5 day
- Phase 4: 0.5 day
- Phase 5–6: 0.5 day
- Phase 7–8: 0.5 day
- Buffer/Rollout: 0.5 day

Total: ~3 days elapsed effort for EaziPay + SDDirect. Bacs18 to follow as Phase 3.

## open questions

- Any auth requirement for MCP server usage?
- Maximum allowed numberOfRows and read length caps?
- Retention policy for generated files (prune older than N days)?
- Do we need WebSocket transport in addition to stdio at this stage?
