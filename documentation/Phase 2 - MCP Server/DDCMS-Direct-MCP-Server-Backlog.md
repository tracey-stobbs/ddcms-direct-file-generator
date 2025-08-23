# DDCMS Direct MCP Server – Backlog

Last updated: 2025-08-23 (post E5)

This backlog translates the implementation plan into actionable, prioritized work. Use as a Kanban source (To Do → In Progress → Review → Done).

Legend

- Priority: P0 (Critical), P1 (High), P2 (Medium), P3 (Low/Deferred)
- Size: XS (<0.5d), S (0.5d), M (1d), L (2d+)
- Status: To Do | In Progress | Blocked | Review | Done
- Traffic Light: 🟢 Done · 🟡 In Progress/Review · 🔴 Blocked · ⚪ To Do

## progress dashboard

| Scope          | 🟢 Done | 🟡 In Progress/Review | 🔴 Blocked | ⚪ To Do |
| :------------- | :-----: | :-------------------: | :--------: | :------: |
| Overall        |    0    |           0           |     4      |    0     |
| Open Questions |    0    |           0           |     4      |    0     |

## guiding principles

- Reuse existing generators/validators; keep adapters thin.
- Strong validation and path safety; no traversal beyond output root.
- Emit progress for long operations; structured logging for all tools.
- MCP and HTTP can run in parallel during rollout.

## milestones

- M1: MCP skeleton + schemas + EaziPay tools
- M2: SDDirect tools + common utilities
- M3: Observability + tests + docs + rollout
- M4: Bacs18 tools (deferred until MCP foundation is complete)

---

## 🟢 epic E1: MCP server scaffolding (M1)

<details open>
<summary>...</summary>

1. Story E1-S1: Create MCP stdio server bootstrap

- Priority: P0, Size: S, Status: Done 🟢
- Description: Add `src/mcp/server.ts` with stdio transport, JSON-RPC handler registration, graceful shutdown.
- Acceptance:
    - Process starts and responds to `initialize` with server info and capabilities.
    - Clean shutdown on SIGINT/SIGTERM; no unhandled rejections.
- Dependencies: None

2. Story E1-S2: Register tool registry and dispatch

- Priority: P0, Size: S, Status: Done 🟢
- Description: Central registry for tools with typed params/results and error mapping.
- Acceptance:
    - Tools can be registered/unregistered.
    - Unknown method returns MCP-compliant error.
- Dependencies: E1-S1

3. Story E1-S3: Add NPM scripts and build wiring

- Priority: P1, Size: XS, Status: Done 🟢
- Description: Add `start:mcp` and ensure `build` compiles `src/mcp/**`.
- Acceptance:
    - `npm run start:mcp` starts server from dist.
- Dependencies: E1-S1
  </details>

---

## 🟢 epic E2: Core schemas and validation (M1)

<details open>
<summary>...</summary>
4. Story E2-S1: Define common error model

- Priority: P0, Size: XS, Status: Done 🟢
- Description: Standardize `{ status, code, message, details[] }` and map exceptions.
- Acceptance:
    - All tools return standardized errors; unit tests cover mapping.
- Dependencies: E1-S2

5. Story E2-S2: Define tool param/result schemas (Zod)

- Priority: P0, Size: S, Status: To Do ⚪
- Description: Zod schemas for generate_file, get_valid_row, get_invalid_row, preview, validate_date, list/read.
- Acceptance:
    - JSON Schemas can be exported for introspection.
    - Invalid inputs yield 400 VALIDATION_ERROR with details.
- Dependencies: E1-S2

6. Story E2-S3: MCP adapters to existing validators

- Priority: P0, Size: S, Status: To Do ⚪
- Description: Adapter functions that call `validateAndNormalizeMcpRequest` and `isValidSun`.
- Acceptance:
    - Normalization parity with HTTP observed in tests.
- Dependencies: E2-S2
  </details>

---

## 🟢 epic E3: EaziPay tools (M1)

<details open>
<summary>...</summary>
7. Story E3-S1: eazipay.generate_file tool

- Priority: P0, Size: S, Status: Done 🟢
- Description: Generate file using `getFileGenerator('EaziPay')`; ensure output dir; emit progress.
- Acceptance:
    - Returns fileType, sun, fileName, outputPath, rowsWritten, warnings.
    - Ignores includeHeaders with a warning.
- Dependencies: E2-S3

8. Story E3-S2: eazipay.get_valid_row tool

- Priority: P0, Size: XS, Status: Done 🟢
- Description: Use `generateValidEaziPayRow` + `mapEaziPayFieldsToRecord` + `getEaziPayHeaders`.
- Acceptance:
    - Returns headers with 1-based order and rows[].fields[].
- Dependencies: E2-S3

9. Story E3-S3: eazipay.get_invalid_row tool

- Priority: P0, Size: XS, Status: Done 🟢
- Description: Use `generateInvalidEaziPayRow` path, same payload shape.
- Acceptance:
    - Returns deliberately invalid data; contract matches valid-row.
- Dependencies: E2-S3
  </details>

---

## 🟢 epic E4: SDDirect tools (M2)

<details open>
<summary>...</summary>
10. Story E4-S1: sddirect.generate_file tool

- Priority: P1, Size: S, Status: Done 🟢
- Description: Generate file with `getFileGenerator('SDDirect')`; honor includeHeaders.
- Acceptance:
    - Returns metadata matching HTTP behavior.
- Dependencies: E2-S3

11. Story E4-S2: sddirect.get_valid_row / get_invalid_row

- Priority: P1, Size: XS, Status: Done 🟢
- Description: Use `generateValidSDDirectRow`/`generateInvalidSDDirectRow` + mappers/headers.
- Acceptance:
    - Payload shape identical to EaziPay row tools.
- Dependencies: E2-S3
  </details>

---

## 🟢 epic E5: Common tools (M2)

<details open>
<summary>...</summary>
12. Story E5-S1: common.list_supported_formats

- Priority: P2, Size: XS, Status: Done 🟢
- Acceptance: Includes headers support, date formats, filename patterns.
- Dependencies: None

13. Story E5-S2: common.preview_file_name

- Priority: P2, Size: S, Status: Done 🟢
- Acceptance: Predicts fileName, columnCount, extension; snapshot-tested.
- Dependencies: E3-S1, E4-S1

14. Story E5-S3: common.validate_processing_date

- Priority: P2, Size: XS, Status: Done 🟢
- Acceptance: Validates/normalizes per fileType; returns warnings for edge cases.
- Dependencies: E2-S2

15. Story E5-S4: common.list_output_files

- Priority: P1, Size: XS, Status: Done 🟢
- Acceptance: Lists files under `output/{fileType}/{sun}` with limit cap; rejects traversal.
- Dependencies: E1-S1

16. Story E5-S5: common.read_output_file

- Priority: P1, Size: XS, Status: Done 🟢
- Acceptance: Reads with offset/length caps; UTF-8/binary modes; safe path resolution.
- Dependencies: E5-S4
  </details>

---

## ⚪ epic E6: Observability & robustness (M3)

<details open>
<summary>...</summary>
17. Story E6-S1: Structured logging for tools

- Priority: P1, Size: XS, Status: To Do ⚪
- Acceptance: Logs include tool, durationMs, success, warnings, errorCode.
- Dependencies: E1-S2

18. Story E6-S2: Progress events for generate_file

- Priority: P1, Size: XS, Status: To Do ⚪
- Acceptance: Emits at 0/25/50/75/100%; visible in client.
- Dependencies: E3-S1, E4-S1

19. Story E6-S3: Concurrency and queue limits

- Priority: P2, Size: S, Status: To Do ⚪
- Acceptance: Configurable workers; overflow returns clear error; tests cover backpressure.
- Dependencies: E1-S1
  </details>

---

## ⚪ epic E7: Testing (M3)

<details open>
<summary>...</summary>
20. Story E7-S1: Unit tests for schemas and adapters

- Priority: P0, Size: S, Status: To Do ⚪
- Acceptance: Invalid inputs exercise all validation branches.
- Dependencies: E2-S2, E2-S3

21. Story E7-S2: Integration tests for tools

- Priority: P0, Size: S, Status: To Do ⚪
- Acceptance: End-to-end generate + read; row payload contracts; parity with HTTP.
- Dependencies: E3, E4, E5

22. Story E7-S3: Contract tests with JSON Schemas

- Priority: P1, Size: XS, Status: To Do ⚪
- Acceptance: Params/results validated against exported schemas.
- Dependencies: E2-S2
  </details>

---

## ⚪ epic E8: Docs & packaging (M3)

<details open>
<summary>...</summary>
23. Story E8-S1: README updates for MCP usage

- Priority: P1, Size: XS, Status: Done 🟢
- Acceptance: Quick start, tool list, examples, troubleshooting.
- Dependencies: E3, E4, E5

24. Story E8-S2: CHANGELOG entry and deprecation notes

- Priority: P2, Size: XS, Status: To Do ⚪
- Acceptance: HTTP → MCP guidance and timelines.
- Dependencies: E8-S1
  </details>

---

## ⚪ epic E9: Rollout (M3)

<details open>
<summary>...</summary>
25. Story E9-S1: Parallel run with HTTP

- Priority: P2, Size: XS, Status: To Do ⚪
- Acceptance: MCP and HTTP run concurrently; smoke validation done.
- Dependencies: All prior epics

26. Story E9-S2: Feedback iteration

- Priority: P2, Size: XS, Status: To Do ⚪
- Acceptance: Address issues discovered in first agent integrations.
- Dependencies: E9-S1
  </details>

---

## ⚪ epic E10: Bacs18 (Deferred – M4)

<details open>
<summary>...</summary>
27. Story E10-S1: bacs18paymentlines tools (generate/get rows)

- Priority: P3, Size: M, Status: To Do ⚪
- Dependencies: MCP foundation in place (E1–E7)

28. Story E10-S2: bacs18standardfile tools (generate/get rows)

- Priority: P3, Size: M, Status: To Do ⚪
- Dependencies: MCP foundation in place (E1–E7)
  </details>

---

## cross-cutting tasks

29. Task X1: Config flags (OUTPUT_ROOT, MAX_ROWS, READ_MAX_LENGTH, WORKERS, LOG_LEVEL)

- Priority: P1, Size: XS, Status: To Do ⚪

30. Task X2: Path safety utilities and tests

- Priority: P0, Size: XS, Status: To Do ⚪

31. Task X3: Error mapping utilities and tests

- Priority: P0, Size: XS, Status: Done 🟢

32. Task X4: Filename preview utilities and snapshot tests

- Priority: P2, Size: XS, Status: To Do ⚪

33. Task X5: Bank holiday/calendar validation reuse and tests

- Priority: P2, Size: XS, Status: To Do ⚪

34. Task X6: Zod schemas for tool params/results

- Priority: P1, Size: S, Status: To Do ⚪

35. Task X7: Modernize Faker API usages (remove deprecations)

- Priority: P2, Size: S, Status: Done 🟢

---

## open questions (track as blocked tasks)

- 🔴 Q1: Any authentication requirement for MCP? (Blocked: E1-S1 impact)
- 🔴 Q2: Confirm limits: MAX_ROWS and READ_MAX_LENGTH? (Blocked: X1)
- 🔴 Q3: Retention policy for output pruning? (Blocked: E5-S4 follow-up)
- 🔴 Q4: Add WebSocket transport now or later? (Blocked: E1-S1/E9)

---

Definition of Done

- Tools implemented with schema validation, path safety, progress (for generate), and structured logs.
- Unit and integration tests green; coverage added for new code paths.
- Docs updated; basic examples verified.

Time (BST): Start 10:41, End 10:48
