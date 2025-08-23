# DDCMS Direct MCP Server – Requirements

Version: 1.0.0  
Status: Draft for Review

Purpose

- Provide an MCP server that exposes tools for agents to generate files and retrieve sample rows for supported file types.
- Reuse existing validation and generation logic while adapting to the MCP tool contract.
- Align with existing API requirements in:
    - documentation/REQUIREMENTS_MCP.md
    - documentation/REQUIREMENTS.md
    - documentation/IMPLEMENTATION_PLAN_MCP.md

In-scope

- MCP tools to:
    - Generate files
    - Retrieve valid/invalid rows
    - Validate and normalize request parameters
    - Inspect capabilities and preview naming
    - Enumerate and read generated artifacts
- Observability, security, and resource controls for agent use.

Out-of-scope

- Authentication/authorization (TBD; see Open Questions)
- Non-local file stores (cloud storage)

References to existing modules

- Request validator: validateAndNormalizeMcpRequest in src/lib/validators/requestValidator.ts
- Requirements and route plans:
    - documentation/REQUIREMENTS_MCP.md
    - documentation/IMPLEMENTATION_PLAN_MCP.md
- Project overview: README.md

1. Transport and Protocol

- Protocol: MCP (JSON-RPC 2.0 over stdio by default; WebSocket optional).
- Server identity:
    - name: ddcms-direct-mcp
    - version: semver from package.json
- Capabilities:
    - tools: yes
    - resources: yes (generated files as read-only byte content)
    - prompts: no (initially)
    - cancellation: yes (JSON-RPC cancel or MCP cancel, if supported by the client)
    - progress: yes (progress events for long-running file generations)
- Concurrency: Support parallel tool invocations with bounded worker pool.

2. Tools (inventory)
   All tools use JSON Schema for params and results. Errors follow the common error model in documentation/REQUIREMENTS_MCP.md (status, code, message, details[]).

2.1 generate_file

- Intent: Generate a file for a specific SUN and file type.
- Params:
    - fileType: enum ["SDDirect","Bacs18PaymentLines","Bacs18StandardFile","EaziPay"]
    - sun: string (^\d{6}$)
    - forInlineEditing?: boolean (default true)
    - processingDate?: string (format depends on fileType; see docs)
    - includeHeaders?: boolean (honored only for SDDirect and Bacs18StandardFile)
    - hasInvalidRows?: boolean
    - numberOfRows?: number (default 15; positive integer)
    - outputPath?: string (default output/{fileType}/{sun})
    - dateFormat?: "YYYY-MM-DD" | "DD-MMM-YYYY" | "DD/MM/YYYY" (EaziPay only)
- Behavior:
    - Validate params using validateAndNormalizeMcpRequest (route-supplied fileType in API version; tool param here).
    - Enforce EaziPay header rule (always ignored; warning only).
    - Ensure output directory exists; 400 if creation fails.
    - Call generator layer with normalized request.
    - Stream progress events: 0%, 25%, 50%, 75%, 100%.
- Result:
    - fileType, sun, fileName, outputPath, rowsWritten, includeHeadersEffective, processingDate, warnings[]
- Errors:
    - 400 VALIDATION_ERROR (bad sun, numberOfRows, processingDate format per file type, non-writable outputPath)
    - 500 GENERATION_FAILED (I/O or generator error)

        2.2 get_valid_row

- Intent: Return representative valid rows for a file type.
- Params:
    - fileType: enum
    - sun: string (^\d{6}$)
    - rowCount?: number (default 1; positive integer)
- Behavior:
    - Validate sun format.
    - Return headers (1-based order), rows[].fields[] with order, and metadata.
- Result:
    - { headers: {name, order}[], rows: [{ fields: {value, order}[] }...], metadata: { fileType, sun, rowKind: "valid", generatedAt, notes? } }
- Errors: 400 on invalid sun or rowCount.

    2.3 get_invalid_row

- Same contract as get_valid_row but returns deliberately invalid values for testing.

    2.4 validate_processing_date

- Intent: Validate and normalize processingDate without generating a file.
- Params:
    - fileType: enum
    - processingDate: string
    - dateFormat?: EaziPay-only formats (see docs)
- Behavior:
    - Apply file-type-specific rules (working day logic, bank holidays).
    - On success, return normalized/echoed date in expected output format.
- Result:
    - { isValid: boolean, normalized?: string, warnings?: string[] }
- Errors: 400 with details when invalid.

    2.5 preview_file_name

- Intent: Preview the filename that would be produced for given options.
- Params:
    - fileType, sun, numberOfRows?, includeHeaders?, hasInvalidRows?, dateFormat? (EaziPay)
- Result:
    - { fileName, columnCount, extension, headersDesignator, validityDesignator, timestampPreview }
- Notes: Column count rules per documentation/REQUIREMENTS.md (e.g., EaziPay 15/23 logic, SDDirect 06/11).

    2.6 list_supported_formats

- Intent: Return capabilities per file type.
- Result:
    - For each file type: supportsHeaders, defaultExtension(s), dateRules, rowPreviewSupported, processingDateFormats, filenamePattern.

        2.7 list_output_files

- Intent: Enumerate generated files for a SUN and optional file type.
- Params:
    - sun: string (^\d{6}$)
    - fileType?: enum
    - limit?: number (default 50, max 500)
- Result:
    - [{ fileName, absolutePath, sizeBytes, createdAt, fileType, sun }]
- Security: Only under output root; no path traversal.

    2.8 read_output_file

- Intent: Read content of a generated file (for quick inspection).
- Params:
    - sun, fileType, fileName
    - offset?: number (default 0)
    - length?: number (default 65536) – cap to prevent large transfers
- Result:
    - { encoding: "utf-8" | "binary", content: string, eof: boolean }
- Security: Validate that resolved path stays under allowed output directory.

3. Tool-to-Module Mapping

- Validation:
    - Use validateAndNormalizeMcpRequest in src/lib/validators/requestValidator.ts for normalization rules identical to the HTTP API.
- Generation:
    - Reuse the existing file generation layer (factory-based per file type) as described in documentation/IMPLEMENTATION_PLAN_MCP.md.
- Rows:
    - Reuse or add per-file-type row builders aligning with documentation/REQUIREMENTS_MCP.md row payload contract.

4. Resources

- Expose generated files as read-only resources:
    - Resource URIs: mcp://output/{fileType}/{sun}/{fileName}
    - List via list_output_files; read via read_output_file
    - No write/delete tools in v1 for safety.

5. Data and Validation Rules

- Follow documentation/REQUIREMENTS.md:
    - FR2 File naming convention and storage
    - FR3 Data generation rules (Faker.js, invalid row proportions)
    - FR4 SDDirect column/headers rules
    - FR4.1 EaziPay format, date formats, trailer columns, header override (ignored)
    - FR5 Field-level validation (Transaction Code, Pay Date, allowed character sets)
- MCP-specific emphasis:
    - processingDate validation and normalization per documentation/REQUIREMENTS_MCP.md
    - Include warnings when options are ignored (e.g., includeHeaders for EaziPay).

6. Security and Safety

- Path safety:
    - All file operations constrained to ./output/{fileType}/{sun}.
    - Deny path traversal (normalize and verify prefix).
- Input validation:
    - Strict schema validation for all params.
    - SUN validation: ^\d{6}$ (reject otherwise).
    - Limits:
        - numberOfRows: positive integer, configurable max (default 10,000).
        - list limits: max 500.
        - read length: cap to 1 MiB by default.
- Credentials:
    - No secrets in code; read env config if needed.
- Process safety:
    - Never kill Node.js process; support graceful shutdown only.
- Dependency hygiene:
    - Keep dependencies patched; audit regularly.

7. Observability and Logging

- Structure logs: level, timestamp, tool, params redaction (no sensitive data), duration, outcome.
- Progress events: emit during generation.
- Error logging: full stack internally; summarize in tool result error model.
- Metrics: counters (tool calls), durations, file sizes, failures.

8. Performance and Reliability Targets

- Generation under typical load (<1,000 rows): <2 seconds average (see NFR1 in documentation/REQUIREMENTS.md).
- Memory: avoid loading entire large files into memory; stream where possible.
- Concurrency: configurable worker pool size; backpressure with queueing.
- File writes: atomic (write temp + rename).

9. Testing Requirements

- Unit tests (Vitest):
    - Tool parameter schemas
    - Validation functions (including edge cases and warnings)
    - Path safety guards
    - Filename preview logic
- Integration tests:
    - End-to-end tool calls via MCP harness
    - File generation with output inspection
    - Row payload contracts for each file type
- Contract tests:
    - JSON Schema validation for tool params/results
- Coverage: strive for 100% line coverage (see documentation/REQUIREMENTS.md).

10. Compatibility and Migration

- Parity with HTTP API behavior documented in documentation/REQUIREMENTS_MCP.md.
- Error model compatibility with existing HTTP responses (translated to MCP tool errors).
- Deprecation notes:
    - If agents move to MCP, keep HTTP API for human/manual usage until sunset.

11. Configuration

- Environment variables:
    - OUTPUT_ROOT (default ./output)
    - MAX_ROWS (default 10000)
    - READ_MAX_LENGTH (default 1048576)
    - WORKERS (default: number of cores)
    - LOG_LEVEL (info|debug|warn|error)
- Bank holidays source:
    - Use existing calendar logic per documentation/REQUIREMENTS.md (real UK data; tests must include fixtures).

12. Design and Patterns

- Adapter pattern:
    - MCP tool handlers adapt from tool params to existing validators/generators without changing core logic.
- Factory pattern:
    - Continue to obtain generators per file type (keeps OCP and reduces conditional complexity).
- Template method (lightweight) in tool scaffolding:
    - Common pre/post handling (validation, logging, error mapping), with per-tool business logic injected.

13. Error Model

- status: number (400, 404, 500)
- code: VALIDATION_ERROR | NOT_FOUND | GENERATION_FAILED
- message: concise summary
- details: string[]
- Map internal exceptions to this model; redact sensitive info.

14. File Naming and EaziPay Specifics

- Follow documentation/REQUIREMENTS.md FR2 for naming:
  [FileType]_[COLUMNCOUNT]\_x_[ROWS]_[HEADERS]_[VALIDITY]\_[TIMESTAMP].[extension]
- EaziPay rules:
    - Headers: always NH
    - Date format: one of three formats; consistent per file
    - Trailer columns: quoted vs unquoted variant (randomly chosen per file)
    - Column count reflected in filename (15/23)

15. Acceptance Criteria

- Tools generate identical outputs to HTTP API paths for the same inputs.
- Warnings appear when options are ignored (e.g., includeHeaders for EaziPay).
- Path traversal attempts are rejected.
- Resources correctly list and read generated files with size caps.
- Tests pass with required coverage and no linting issues.

16. Implementation Notes

- Structure:
    - src/mcp/server.ts – bootstrap and transport
    - src/mcp/tools/\*.ts – individual tool handlers
    - src/mcp/schemas/\*.ts – JSON Schemas
    - src/mcp/adapters/\*.ts – bridges to validators and generators
    - src/mcp/resources/\*.ts – output resource listing/reading
    - tests/… – Vitest suites for unit and integration
- Reuse:
    - Call validateAndNormalizeMcpRequest for normalization parity with HTTP API.
    - Reuse existing file generation modules as-is; wrap with adapters.

17. Open Questions (please confirm)

- Authentication: should the MCP server require any form of auth/attestation?
- Allowed SUNs: is there a whitelist/known configuration to validate against?
- Max limits: acceptable caps for numberOfRows, list limits, and read length?
- Output retention: should old files be pruned automatically or kept indefinitely?
- Transport: stdio only, or also WebSocket for remote orchestration?
- Resource exposure: is read_output_file sufficient, or should we allow streaming as a resource subscription?

Appendix A: Tool JSON Schemas (outline)

- Use TypeScript-first schemas transpiled to JSON Schema, or Zod transformers, ensuring alignment with TypeScript types used in src/lib/validators/requestValidator.ts.

Appendix B: Example Flows

- Typical agent flow:
    1. list_supported_formats → pick fileType
    2. validate_processing_date (optional) → normalized date
    3. preview_file_name → verify naming
    4. generate_file → returns file metadata + path
    5. list_output_files → locate file
    6. read_output_file (small preview) or handoff path to another tool

Change Log

- 1.0.0: Initial draft
