# MCP Implementation Plan

> Goal: Implement per-file-type API endpoints to generate files and retrieve valid/invalid row payloads, aligned with REQUIREMENTS_MCP.md.

## Scope checklist
- Add 4 base routes and 3 sub-endpoints each (generate, invalid-row, valid-row)
- Remove `fileType` from request body; infer from route
- Rename `canInlineEdit`→`forInlineEditing` (optional, default true)
- Add optional `processingDate`
- Generate-only options: `includeHeaders`, `hasInvalidRows`, `outputPath`
- Row endpoints: response shape with `headers` + `rows[ { fields: [...] } ]` and `metadata`
- Update validators, types, generators, and tests
- Update docs and REST Client files

## Architecture notes
- Continue using the existing Factory pattern for generators (`lib/fileType/factory.ts`).
- Keep Express app entry in `src/index.ts`; add new routes per file type.
- Centralize request normalization to avoid duplication across routes.

## Route design
Base paths:
- SDDirect: `api/sddirect/:sun`
- Bacs18PaymentLines: `api/bacs18paymentlines/:sun`
- Bacs18StandardFile: `api/bacs18standardfile/:sun`
- EaziPay: `api/eazipay/:sun`

Subroutes (for each base):
- POST `{base}/generate`
- GET `{base}/invalid-row`
 - Use a temporary SUN config stub until auth/config is integrated:
   - sortCode: "912291"
   - accountNumber: "51491194"
   - accountName: "Test Account"
   - sun: "797154"
   - sunName: "SUN-C-0QZ5A"
Inputs:
- Path: `sun` (6-digit string)
- Body: `{ forInlineEditing?: boolean; processingDate?: string; includeHeaders?: boolean; hasInvalidRows?: boolean; outputPath?: string; ...other file-type-specific flags }`
 - Auto-create `outputPath` directory if missing; 400 if creation fails.
- Use `getFileGenerator(fileType)` and pass a normalized internal request object, never using client-provided `fileType`.
Outputs (201):
- `{ fileType, sun, fileName, outputPath, rowsWritten, includeHeadersEffective, processingDate, warnings?: string[] }`
 Notes:
 - Headers and field orders are 1-based across all file types.
 - Support optional `rowCount` query param; default is 1.
- 400 validation, 404 config, 500 generation failure.

  - Add optional `rowCount?: number` for row endpoints’ request typing (router-level query parsing).
- Path: `sun`, inferred `fileType` from base.
Behavior:
- `{ headers: Array<{name:string,order:number}>, rows: [{ fields: Array<{ value: string|number|boolean, order:number }> }], metadata: {...} }`

    - Respect 1-based ordering and return exactly one row unless a `rowCount` is provided.
## Detailed steps

    - Set `Deprecation: true` header on legacy `/api/generate` endpoint responses if preserved.
  - Consider an internal `NormalizedGenerateRequest` that includes a required `fileType` (set by server) to reuse existing generators without public API change.
  - Deprecate or keep `Request` only for legacy `/api/generate` if still needed; otherwise migrate tests.
 - Create directories automatically when missing; return 400 on failure.
### 2) Validators
- Update `src/lib/validators/requestValidator.ts`:
  - Row endpoints with `rowCount` > 1: multiple rows returned, correct headers and ordering.
    - Defaults `forInlineEditing` to true.
    - Normalizes `includeHeaders` per file type (reuse existing logic by supplying `fileType`).
  - Include examples with `rowCount` query param.
  - Keep existing `validateAndNormalizeHeaders` for backward compatibility; call through from the new function.

### 3) File generators and sample row builders
- For each file type module under `src/lib/fileType/`:
  - Ensure the main generator function can accept the `NormalizedGenerateRequest` that includes `fileType` and `sun`.
  - Add two exported helpers per file type (new):
    - `buildValidRow(): { headers, rows: [{ fields }], metadata }`
    - `buildInvalidRow(): { headers, rows: [{ fields }], metadata }`
  - If headers already defined in docs/tests, construct deterministically; otherwise derive from formatter/field definitions within the module.
- Factory (`factory.ts`):
  - Expose a helper to map from route segment to `fileType` literal.

### 4) Express routes
- In `src/index.ts`:
  - Add a small router factory `createMcpRouter(fileTypeLiteral)` that mounts the 3 endpoints for a base path.
  - Each handler:
    - Validates `sun` (regex `^\d{6}$`).
    - Normalizes generate body via `validateAndNormalizeMcpRequest(fileType, body)`.
    - Computes default `outputPath` if not provided.
    - Invokes `getFileGenerator(fileType)` with normalized request and `nodeFs`.
    - Translates absolute file path to relative path (existing logic) and returns 201 response payload.
    - For row endpoints, call the appropriate `buildValidRow/ buildInvalidRow` helper and return 200.
  - Mount routers:
    - `/api/sddirect/:sun`
    - `/api/bacs18paymentlines/:sun`
    - `/api/bacs18standardfile/:sun`
 - `rowCount` query missing/invalid (default to 1)

### 5) File writing and output path

### 6) Tests (Vitest)
- Update/extend `src/index.test.ts` or add new suites under `src/`:
  - Generate endpoint per file type: 201, file naming, output path defaulting, headers normalization.
  - Row endpoints per file type: 200, payload contract (`headers`, `rows[0].fields[]`, `metadata`).
  - Validation failures: bad SUN, unsupported flags for given endpoint, invalid `processingDate`.
  - EaziPay header ignored behavior and warning propagation.
- Update `src/lib/validators/requestValidator.test.ts` with MCP-specific tests for header normalization via route-supplied fileType.

### 7) REST Client files
- Under `RestClient - Http Requests/`:
  - Add or update: `sddirect.http`, `bacs18paymentlines.http`, `bacs18standardfile.http`, `eazipay.http` with the new routes and sample requests.
  - Include invalid/valid row sample GETs.

### 8) Documentation
- Ensure `documentation/REQUIREMENTS_MCP.md` remains the source of truth.
- Update `README.md` API section with new endpoints summary and a concise example.

### 9) Logging & errors
- Reuse `logRequest`, `logError`, `logResponse` for new endpoints.
- Adopt the error model described in the requirements (status, code, message, details[]).

### 10) Migration & deprecation (optional)
- If keeping legacy `/api/generate`, add a deprecation header in responses and note removal timeline in README.

## Pseudocode (high-level)

```ts
// src/index.ts
function createMcpRouter(fileType: FileTypeLiteral) {
  const r = express.Router({ mergeParams: true });
  r.post('/generate', async (req, res) => {
    const sun = req.params.sun; // validate ^\d{6}$
    const normalized = validateAndNormalizeMcpRequest(fileType, req.body);
    const outputPath = normalized.outputPath ?? path.join('output', fileType, sun);
    const generator = getFileGenerator(fileType);
    const filePath = await generator({ ...normalized, fileType, sun, outputPath }, nodeFs);
    return res.status(201).json(toGenerateResponse(fileType, sun, filePath, normalized));
  });
  r.get('/valid-row', (_req, res) => res.json(buildValidRow(fileType)));
  r.get('/invalid-row', (_req, res) => res.json(buildInvalidRow(fileType)));
  return r;
}

app.use('/api/sddirect/:sun', createMcpRouter('SDDirect'));
app.use('/api/bacs18paymentlines/:sun', createMcpRouter('Bacs18PaymentLines'));
app.use('/api/bacs18standardfile/:sun', createMcpRouter('Bacs18StandardFile'));
app.use('/api/eazipay/:sun', createMcpRouter('EaziPay'));
```

## Design patterns used
- Factory Pattern: Continue to obtain the correct file generator via `getFileGenerator(fileType)`. This keeps the code open for extension (SOLID: OCP) when new file types are added and avoids conditional complexity in route handlers.
- Router Factory: A small application of the Factory/Template Method concept to generate consistent per-file-type routers, reducing duplication and promoting DRY.

## Edge cases to handle
- Invalid SUN (non-numeric or wrong length)
- `includeHeaders` specified on a type that doesn’t support headers (ignore + warning)
- `processingDate` invalid format per file type
- Non-writable `outputPath`
- Large row counts for generation (performance)

## Quality gates
- Build: Typecheck clean
- Lint: ESLint/Prettier clean
- Tests: 100% passing incl. new suites for MCP routes
- Smoke test: Manual REST Client calls for each new endpoint

## Estimated effort
- Routes + normalization + types: 0.5–1 day
- Row builders (per file type): 0.5–1 day
- Tests (unit + integration): 1 day
- Docs/HTTP files/README updates: 0.5 day

## Rollout
- Branch: `mcp`
- PR with checklist above
- Tag release after tests pass
