# Project Shiny Palm Tree — Phase 4 Backlog

This backlog is derived from `Backlog Management/Phase 4 - Project MCP/REQUIREMENTS.md` and aligns items to FR1–FR8, NFRs, and the rollout plan (4.0–4.3).

## Conventions
- ID format: MCP-<phase>-<seq>, e.g., MCP-4.0-001
- Priority: P0 (critical), P1 (high), P2 (normal), P3 (low)
- Type: Epic, Story, Task, Spike
- Dependencies use IDs; Phase indicates delivery target

## Epics
- E1. MCP transport and validation (FR1)
- E2. File generation suite (FR2)
- E3. Row operations suite (FR3)
- E4. EaziPay support (FR4)
- E5. SDDirect support (FR5)
- E6. Calendar utilities (FR6)
- E7. Filesystem tools (Phase 4.1) (FR7)
- E8. Configuration and health (FR8)
- E9. Quality, performance, and observability (NFR)
- E10. Testing and integration (NFR)

## Release Plan (slicing)
- Phase 4.0: Minimal MCP router + 3 tools (file.preview, row.generate, calendar.nextWorkingDay) and service layer foundations
- Phase 4.1: Remaining tools (file.generate, file.estimateFilename, file.parseAndValidate, row.validate, calendar.isWorkingDay, eazipay.pickOptions) + FS tools (fs.read/list/delete)
- Phase 4.2: Observability, performance tuning; reliability hardening
- Phase 4.3: Optional auth and admin tools

---

## Backlog Items

### E1. MCP transport and validation (FR1)
- MCP-4.0-001 [P0][Story] Minimal MCP router and method registry
  - Acceptance: Register a dummy method; handle JSON-RPC 2.0; return structured errors.
  - Done when: `src/mcp/server.ts` starts router, accepts method map, validates JSON-RPC envelope.
- MCP-4.0-002 [P0][Story] JSON Schema validation pipeline
  - Acceptance: Params validated against draft-07; invalid requests yield VALIDATION_ERROR with issues array.
  - Done when: Schema loader caches schemas from `documentation/Schemas/**`.
- MCP-4.0-003 [P1][Story] Error mapping and trace IDs
  - Acceptance: Map to { code, message, details? }; internal errors include stable traceId.
- MCP-4.1-004 [P2][Task] Tool discovery endpoint
  - Acceptance: List registered tools with method, description, $id of schemas.

### E2. File generation suite (FR2)
- MCP-4.1-010 [P0][Story] file.generate (in-memory by default)
  - Acceptance: Returns { fileContent, meta, filePath? }; only writes when write=true; default path `output/{fileType}/{SUN}/...`.
- MCP-4.0-011 [P0][Story] file.preview
  - Acceptance: Returns { content, meta }; zero writes.
- MCP-4.1-012 [P1][Story] file.estimateFilename
  - Acceptance: Predicts filename deterministically from inputs.
- MCP-4.1-013 [P1][Story] file.parseAndValidate
  - Acceptance: Parses content and returns validation summary for supported file types.

### E3. Row operations (FR3)
- MCP-4.0-020 [P0][Story] row.generate (valid/invalid)
  - Acceptance: Returns { fields[], asLine } with option to generate invalid; deterministic with seed.
- MCP-4.1-021 [P0][Story] row.validate
  - Acceptance: Returns { valid, violations[] } with machine-readable codes.

### E4. EaziPay support (FR4)
- MCP-4.0-030 [P0][Story] EaziPay fixed format enforcement
  - Acceptance: 14 columns, last empty; headerless; date formats: YYYY-MM-DD, DD-MMM-YYYY, DD/MM/YYYY.
- MCP-4.1-031 [P1][Task] eazipay.pickOptions tool
  - Acceptance: Returns enums/options for UI pickers (dates, separators, etc.).

### E5. SDDirect support (FR5)
- MCP-4.1-040 [P1][Story] SDDirect includeHeaders option
  - Acceptance: When requested, headers included; column count from generator config.

### E6. Calendar utilities (FR6)
- MCP-4.0-050 [P0][Story] calendar.nextWorkingDay
  - Acceptance: Respects weekends and UK bank holidays.
- MCP-4.1-051 [P1][Story] calendar.isWorkingDay
  - Acceptance: True/false for date against same calendar set.

### E7. Filesystem tools (FR7)
- MCP-4.1-060 [P1][Story] fs.read
  - Acceptance: Reads within output/ sandbox only; deny by default paths.
- MCP-4.1-061 [P2][Story] fs.list
  - Acceptance: Lists within sandbox directories; supports basic filters.
- MCP-4.1-062 [P2][Story] fs.delete
  - Acceptance: Deletes within sandbox; safe-guards against path traversal.

### E8. Configuration and health (FR8)
- MCP-4.0-070 [P1][Story] config.get
  - Acceptance: Returns safe defaults; no secrets.
- MCP-4.0-071 [P1][Story] config.setDefaults
  - Acceptance: Updates in-memory defaults; persisted only if FS enabled in 4.1.
- MCP-4.1-072 [P2][Story] runtime.health
  - Acceptance: Returns status, uptime, versions.

### E9. Quality, performance, and observability (NFR)
- MCP-4.0-080 [P0][Story] Unit tests for router and first 3 tools
  - Acceptance: Vitest suite; coverage for happy/unhappy paths.
- MCP-4.2-081 [P1][Story] Structured logging with toggleable verbosity
  - Acceptance: JSON logs; redact sensitive values.
- MCP-4.2-082 [P1][Story] Performance: 1k-row preview < 1s on dev machine
  - Acceptance: Bench test + README note; memory growth ~ linear.
- MCP-4.2-083 [P2][Story] Reliability hardening and error retries (where applicable)

### E10. Testing and integration (NFR)
- MCP-4.0-090 [P0][Story] Integration tests for 3 initial tools
  - Acceptance: JSON-RPC tests cover schema validation and service calls.
- MCP-4.1-091 [P0][Story] Integration tests for remaining tools
- MCP-4.1-092 [P1][Task] Backward-compat checks with existing generators

---

## Dependencies
- E2 depends on E1 validation and router.
- E3 depends on E1; shares service layer.
- E4/E5 depend on E2/E3 service abstractions.
- E7 depends on E1 and adapter interfaces; gated to 4.1.
- E8 touches all layers; config.setDefaults usable in-memory from 4.0.

## Acceptance Criteria — Global
- All tools validate inputs (draft-07) and return typed results
- Deny-by-default IO; writes only on write=true (Phase 4.1 supports FS tools)
- Errors map to standardized shape with codes
- Docs updated (README + Schemas index) with examples for ≥ 3 tools

## Definition of Done
- Tests green (unit + integration where applicable)
- Lint/typecheck clean
- README updated with run instructions for MCP server
- Requirement(s) mapped in Coverage section

## Coverage Matrix (Requirement → Backlog IDs)
- FR1 → MCP-4.0-001, MCP-4.0-002, MCP-4.0-003, MCP-4.1-004
- FR2 → MCP-4.0-011, MCP-4.1-010, MCP-4.1-012, MCP-4.1-013
- FR3 → MCP-4.0-020, MCP-4.1-021
- FR4 → MCP-4.0-030, MCP-4.1-031
- FR5 → MCP-4.1-040
- FR6 → MCP-4.0-050, MCP-4.1-051
- FR7 → MCP-4.1-060, MCP-4.1-061, MCP-4.1-062
- FR8 → MCP-4.0-070, MCP-4.0-071, MCP-4.1-072
- NFR (Reliability, Performance, Security, Observability, Compatibility, Testability) → MCP-4.0-080, MCP-4.2-081, MCP-4.2-082, MCP-4.2-083, MCP-4.0-090, MCP-4.1-091

## Risks and Mitigations
- JSON Schema drift vs. code: Add schema loader tests (MCP-4.0-002) and CI check.
- Performance regressions: Bench in 4.2 (MCP-4.2-082); lazy generation in services.
- FS safety: Sandbox, path normalization, explicit write=true (all FS items in 4.1).

## Notes
- Phase 4 defaults to in-memory processing; FS tools are staged to 4.1 per REQUIREMENTS.md.
