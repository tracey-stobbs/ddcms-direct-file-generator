# Phase 4 — Project MCP: Requirements

Author: Project Shiny Palm Tree
Date: 2025-08-24

## 1. Purpose and Goals
Transform the existing file generator into a fully functional MCP server exposing tool-based capabilities for file generation, preview, row operations, validation, calendar utilities, and file IO. The server should be easy to embed, test, and automate.

Success criteria:
- Provides a stable JSON-RPC interface with discoverable tools and JSON Schemas
- Mirrors (and improves) current HTTP behavior while decoupling from Express
- Secure by default; no unintended filesystem or network access
- Fully tested (unit + integration) with reproducible builds

## 2. In Scope
- MCP server runtime exposing the toolset defined in `TOOLS.md`
- JSON Schema-backed tool registration (params and result)
- Service layer that adapts current generators/validators to pure functions
- No-FS preview by default; optional write via explicit flag
- Calendar utilities based on current working-day logic

## 3. Out of Scope
- New file formats beyond those already present
- UI/CLI clients (only server and tests)
- Authentication/authorization (can be added later)

## 4. Terms and Data Contracts
- File types: `EaziPay`, `SDDirect`, `Bacs18PaymentLines`, `Bacs18StandardFile`
- SUN: 6-char identifier (string)
- Row structure: `{ fields: (string|number|boolean)[], asLine?: string }`
- Headers shape for previews: `{ name: string, value: number }[]`
- JSON Schemas: housed under `documentation/Schemas/**` and referenced by server

## 5. Functional Requirements (FR)

FR1. Tool Registration and Discovery
- The server shall register each tool with `method`, `paramsSchema`, `resultSchema`, and `description`.
- Tools shall validate inputs against JSON Schema prior to execution.

FR2. File Generation
- Tools: `file.generate`, `file.preview`, `file.estimateFilename`, `file.parseAndValidate`.
- `file.generate` shall return `{ fileContent, meta, filePath? }` and perform no writes by default (`write=false`). When `write=true` is explicitly provided, the file shall be persisted and `filePath` included in the result.
- Output path defaults to `output/{fileType}/{SUN}/...` when `write=true`.
- `file.preview` shall return `{ content, meta }` with zero writes.

FR3. Row Operations
- Tools: `row.generate`, `row.validate`.
- `row.generate` supports `valid` and `invalid` output; includes `asLine` and structured `fields`.
- `row.validate` shall return `{ valid, violations[] }` with machine-readable codes.

FR4. EaziPay Specifics
- EaziPay date formats: `YYYY-MM-DD`, `DD-MMM-YYYY`, `DD/MM/YYYY`.
- EaziPay column count fixed at 14; last column is empty ("Empty Trailer 1").
- EaziPay is always headerless (`NH`).

FR5. SDDirect Specifics
- SDDirect may include headers when requested (`includeHeaders`).
- Column count derived from current generator configuration.

FR6. Calendar Utilities
- Tools: `calendar.nextWorkingDay`, `calendar.isWorkingDay`.
- Must respect weekends and UK bank holidays (as current logic).

FR7. Filesystem Utilities
- Deferred to Phase 4.1: `fs.read`, `fs.list`, `fs.delete`.
- Phase 4 operates in-memory only; no file IO by default.

FR8. Configuration and Health
- Tools: `config.get`, `config.setDefaults`, `runtime.health` (optional in this phase).
- `config.get` exposes safe defaults; `config.setDefaults` updates safe default request values; `runtime.health` returns `status`, `uptime`, versions.

## 6. Non-Functional Requirements (NFR)
- Reliability: ≥ 99.9% availability target under normal operation.
- Performance: file.preview for 1k rows completes in < 1s on typical dev machines; memory usage linear in rows.
- Security: deny-by-default file IO and network; only allow documented operations.
- Observability: structured logs; minimal, toggleable verbosity.
- Compatibility: JSON Schema draft-07; Node 18+; TypeScript strict mode.
- Testability: Vitest unit tests; integration tests against MCP interface.

## 7. Architecture and Design
- Layers:
  - Transport: MCP JSON-RPC router (method registry, validation, error mapping)
  - Service: pure functions wrapping existing generators/validators
  - Adapters: filesystem adapter (write/read), calendar adapter (existing code)
- Patterns:
  - Strategy: file type selection via a factory abstraction
  - Adapter: bridge between internal types and public DTOs
  - Facade: consolidated service surface for tools
- Schemas: Load from `documentation/Schemas/**` at runtime; cache and validate once.
- Errors: Map to `{ code: string, message: string, details?: any }` consistently.

## 8. Tool Catalog (initial)
- file.generate — params/result per schema
- file.preview — params/result per schema
- file.estimateFilename — params/result per schema
- file.parseAndValidate — params/result per schema
- row.generate — params/result per schema
- row.validate — params/result per schema
- eazipay.pickOptions — params/result per schema
- calendar.nextWorkingDay — params/result per schema
- calendar.isWorkingDay — params/result per schema
- fs.read — params/result per schema (Phase 4.1)

## 9. Error Model
- Validation errors: `{ code: 'VALIDATION_ERROR', issues: [...] }`
- Business rule violations: `{ code: 'BUSINESS_RULE_VIOLATION', field, message }`
- IO errors: `{ code: 'IO_ERROR', path, message }`
- Internal errors: `{ code: 'INTERNAL_ERROR', message, traceId? }`

## 10. Security Model
- Input validation via JSON Schema
- File IO limited to `output/` and read-only unless explicitly requested
- No dynamic code execution; no external network calls
- Redaction of sensitive values in logs
 - Phase 4 defaults to in-memory processing; any file writes require an explicit `write=true` flag.

## 11. Performance Considerations
- Streaming for large previews where possible (optional)
- Use lazy row generation to keep memory bounded
- Batched validation to reduce overhead

## 12. Deliverables
- `src/mcp/server.ts` — MCP server bootstrap and router
- `src/mcp/tools/*.ts` — Handlers per tool, bound to services
- `src/services/*.ts` — Pure service functions wrapping existing code
- `documentation/Schemas/**` — JSON Schemas (complete)
- Tests: `src/mcp/__tests__/*` for unit and integration
- README updates: add MCP section with run instructions

## 13. Acceptance Criteria
- All tools in catalog registered and discoverable
- Params/results validated against schemas
- End-to-end tests passing; no regressions in existing generator tests
- Documentation updated; examples for at least 3 tools

## 14. Open Questions
- Do we expose `fs.list`/`fs.delete` in Phase 4 or defer to Phase 4.1? — Defer to Phase 4.1.
- Should `config.setDefaults` be included now or later? — Include it now.
- Any auth needed for write operations? — No auth at this stage; prefer in-memory processing. If writes are enabled via `write=true`, they remain local and unauthenticated for dev use.

## 15. Rollout Plan
- Phase 4.0: Service layer + minimal MCP router + 3 tools (preview, row.generate, calendar.nextWorkingDay)
- Phase 4.1: Remaining tools + filesystem tools (`fs.read`, `fs.list`, `fs.delete`)
- Phase 4.2: Observability and performance tuning
- Phase 4.3: Optional auth and admin tools
