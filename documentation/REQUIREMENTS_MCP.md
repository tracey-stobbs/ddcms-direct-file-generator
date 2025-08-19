# Project MCP – API and Request/Response Requirements

> User Story: As a user, I want to generate and retrieve specific rows from files based on their SUN and file type, so that I can easily access the information I need.

## Scope and goals

- Introduce three new endpoints scoped by SUN and file type.
- Change request payload shape to remove `fileType` from the body and rename `canInlineEdit` to `forInlineEditing`.
- Add optional `processingDate`.
- Restrict certain options to the `generate` endpoint only.
- Define the JSON response contract for row-inspection endpoints (`invalid-row` and `valid-row`).

## Terminology

- SUN: Service User Number (6-digit numeric string).
- Supported file types:
  - SDDirect
  - Bacs18PaymentLines
  - Bacs18StandardFile
  - EaziPay

## Endpoints

Endpoints are exposed per file type with static roots. Base paths by file type:

- SDDirect: `api/sddirect/{sun}`
- Bacs18PaymentLines: `api/bacs18paymentlines/{sun}`
- Bacs18StandardFile: `api/bacs18standardfile/{sun}`
- EaziPay: `api/eazipay/{sun}`

Path parameter(s):
- `sun` (string): 6-digit Service User Number. Example: `123456`.

### 1) Generate file

- Method: POST
- Path: `{base}/generate`
- Behavior: Generates a file of the specified type (based on the endpoint) using originating account details for the given `sun`. The default output location is `output/{filetype}/{sun}`.

Request body (JSON):
- forInlineEditing?: boolean (optional, default true) — replaces `canInlineEdit`.
- processingDate?: string (optional) — processing date for the file; if omitted, the system will pick the next available business day per calendar logic.
- includeHeaders?: boolean (optional; generate-only) — honored where the format supports headers (e.g., SDDirect, Bacs18StandardFile); ignored otherwise.
- hasInvalidRows?: boolean (optional; generate-only) — if true, generator may include or stage invalid rows for testing.
- outputPath?: string (optional; generate-only) — override for default output path; must resolve to a directory.

Notes:
- `fileType` MUST NOT appear in the request body (it is implied by the endpoint used).
- `defaultValues` MUST NOT appear in the request body (removed).
- `includeHeaders`, `hasInvalidRows`, and `outputPath` are ONLY accepted on the `generate` endpoint.

Response:
- 201 Created on success.
- Body:
  - fileType: string
  - sun: string
  - fileName: string
  - outputPath: string
  - rowsWritten: number
  - includeHeadersEffective: boolean (true/false after applying format rules)
  - processingDate: string (resolved/normalized date)
  - warnings?: string[] (e.g., header flag ignored due to unsupported file type)

- Error responses:
- 400 Bad Request — invalid path params, invalid body, unsupported options for the given endpoint, invalid `processingDate` format.
- 404 Not Found — unknown `sun` or configuration not found.
- 500 Internal Server Error — generation failure.

### 2) Get invalid row

- Method: GET
- Path: `{base}/invalid-row`
- Behavior: Returns an object representing an invalid row for the specified SUN and file type.

Response (200 OK):
- headers: Array<{ name: string; order: number }>
- rows: Array<{ fields: Array<{ value: string | number | boolean; order: number }> }>
- metadata: object (TBD; see Metadata section for baseline structure)

### 3) Get valid row

- Method: GET
- Path: `{base}/valid-row`
- Behavior: Returns an object representing a valid row for the specified SUN and file type.

Response (200 OK):
- headers: Array<{ name: string; order: number }>
- rows: Array<{ fields: Array<{ value: string | number | boolean; order: number }> }>
- metadata: object (TBD; see Metadata section for baseline structure)

## Request validation and normalization

Path params:
- sun: must be a 6-digit numeric string; reject otherwise with 400.

Body (generate only):
- forInlineEditing: optional boolean; when omitted, default to `true`.
- processingDate: if provided, must be a valid date string accepted by the target file type rules; normalize to a canonical format internally. If omitted, compute the next business day (per calendar/business-day rules) and return that in the response.
- includeHeaders: allowed only when the endpoint’s file type supports headers (SDDirect, Bacs18StandardFile). If provided for other types (e.g., EaziPay), ignore and add a warning; do not fail the request.
- hasInvalidRows: optional boolean; used for test data generation.
- outputPath: optional string; if provided, must be a writable directory path. If missing, default to `output/{filetype}/{sun}`.

Removed/renamed fields:
- fileType: removed from body; file type is implied by the endpoint used.
- canInlineEdit: renamed to `forInlineEditing` (boolean).
- defaultValues: removed.

## Row payload contract (valid-row, invalid-row)

- headers: Array of column descriptors.
  - name: string — canonical column/field name for the file type.
  - order: number — column position (0- or 1-based; remain consistent per file type).
- rows: Array of row objects (these endpoints typically return a single row, but the array shape allows future extension).
  - fields: Array of ordered values.
    - value: string | number | boolean — representative value (valid or invalid depending on endpoint).
    - order: number — position matching the headers’ order.
- metadata: object (TBD), suggested baseline keys:
  - fileType: string
  - sun: string
  - generatedAt: string (ISO datetime)
  - rowKind: "valid" | "invalid"
  - notes?: string[]

## Examples

POST api/sddirect/123456/generate
Request body:
{
  "processingDate": "2025-08-20",
  "includeHeaders": true,
  "hasInvalidRows": false,
  "outputPath": "output/SDDirect/123456"
}

201 Created
{
  "fileType": "SDDirect",
  "sun": "123456",
  "fileName": "SDDirect_06_x_5_H_I_20250820_090000.csv",
  "outputPath": "output/SDDirect/123456",
  "rowsWritten": 5,
  "includeHeadersEffective": true,
  "processingDate": "2025-08-20",
  "warnings": []
}

GET api/bacs18paymentlines/123456/invalid-row
200 OK
{
  "headers": [
    { "name": "AccountNumber", "order": 1 },
    { "name": "SortCode", "order": 2 }
  ],
  "rows": [
    {
      "fields": [
        { "value": "XXXXXX", "order": 1 },
        { "value": "12-34-XX", "order": 2 }
      ]
    }
  ],
  "metadata": {
    "fileType": "Bacs18PaymentLines",
    "sun": "123456",
    "rowKind": "invalid",
    "generatedAt": "2025-08-19T10:00:00Z"
  }
}

## Processing date rules

- Optional in requests; defaults to the next business day when omitted.
- Must align with each file type’s formatting rules (e.g., EaziPay date formats). Invalid formats yield 400 with a message indicating the expected format(s).

## Output path rules

- Default: `output/{filetype}/{sun}`.
- If `outputPath` is provided in the generate request body, it overrides the default. The resolved path must exist or be creatable and writable by the service. On failure, return 400 with details.

## Error model (common)

Error responses should include:
{
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "includeHeaders is not supported for EaziPay",
  "details": [
    "includeHeaders is ignored for EaziPay"
  ]
}

Possible codes: `VALIDATION_ERROR`, `NOT_FOUND`, `GENERATION_FAILED`.

## Compatibility and migration notes

- Existing clients must migrate from `api/{sun}/{filetype}/...` to the per-file-type routes: `api/sddirect/{sun}/...`, `api/bacs18paymentlines/{sun}/...`, `api/bacs18standardfile/{sun}/...`, `api/eazipay/{sun}/...`.
- Clients that send `fileType` and `canInlineEdit` must remove `fileType` from the body and use `forInlineEditing` (optional, default true).
- `includeHeaders` behavior remains consistent with current validator logic: ignored (with a warning) for unsupported types based on the endpoint used.

## Open items (TBD)

- Exact `metadata` shape for row endpoints — proposed baseline provided; finalize per file type needs.
- Exact date format constraints per file type for `processingDate` — align with existing validators and file writers.
- Authentication/authorization requirements — out of scope for this spec.
