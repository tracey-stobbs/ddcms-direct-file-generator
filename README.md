# DDCMS Direct File Creator

A Node.js API for generating DDCMS Direct files in predefined formats with random, valid, or intentionally invalid data for testing purposes.

Note: MCP server requirements and payload contracts live in `documentation/Phase 2 - MCP Server/DDCMS Direct MCP Server – Requirements.md`.

## MCP server (JSON-RPC 2.0 over stdio) ⚙️

- Entry: `dist/mcp/server.js` (build first), npm script: `npm run start:mcp`.
- Tools implemented: EaziPay (generate_file, get_valid_row, get_invalid_row), SDDirect (generate_file, get_valid_row, get_invalid_row), and Common utilities.
- Error semantics: standardized JSON-RPC errors with named codes via `JsonRpcErrorCodes`.
  - ParseError (-32700) on invalid JSON lines (id: null)
  - InvalidRequest (-32600) for malformed requests
  - MethodNotFound (-32601) for unknown tools
  - InvalidParams (-32602) for validation failures (e.g., bad SUN)
  - InternalError (-32603) for unexpected exceptions

### Common tools (Epic E5) 🧰

These helper tools assist discovery, validation, and safe file browsing.

- `common.list_supported_formats`
  - Returns available file types, header support, date formats, filename patterns.
- `common.preview_file_name`
  - Predicts the file name, column count, and extension for a given request without writing a file.
- `common.validate_processing_date`
  - Validates and normalizes processing dates per file type rules (e.g., EaziPay working-day constraints).
- `common.list_output_files`
  - Lists files under the output root for an optional `{ fileType, sun }` filter with safe path enforcement.
- `common.read_output_file`
  - Reads a file by path relative to output root with offset/length limits and binary/text mode; prevents traversal.

All common tools use strict Zod validation and return `InvalidParams (-32602)` with details on bad input.

### Validation helpers (Zod) ✅

To keep tool handlers lean, use centralized helpers that convert Zod issues into standardized JSON-RPC InvalidParams errors with useful details.

- `parseOrInvalidParams(schema, input)`
  - Synchronously parses using `schema.parse(input)`.
  - On failure, throws `InvalidParams (-32602)` with `data.details` as an array like `["field: message"]`. Root-level errors are labeled as `(root)`.
- `parseOrInvalidParamsAsync(schema, input)`
  - Async variant using `schema.parseAsync(input)`—useful when schemas include async refinements.

Example usage inside a tool handler:

```ts
// src/mcp/tools/example.ts
import { parseOrInvalidParams } from '../validation';
import { z } from 'zod';

const zParams = z.object({ sun: z.string().regex(/^\d{6}$/), numberOfRows: z.number().min(1).max(100000) });

export function exampleHandler(rawParams: unknown) {
  const params = parseOrInvalidParams(zParams, rawParams);
  // ...use params safely
  return { ok: true };
}
```

### HTTP API parity and deprecation

- Legacy `POST /api/generate` is preserved and now returns a `Deprecation: true` header.
- Per-file-type HTTP endpoints mirror the MCP row payload shape (headers + rows[].fields[] ordered 1-based).

## Features

- Single `/api/generate` endpoint (JSON, body optional)
- **Multiple File Formats:**
  - **SDDirect** (.csv) - Complete implementation
  - **EaziPay** (.csv/.txt) - Complete implementation ✨ **NEW**
  - **Bacs18PaymentLines** (.txt) - Future support
  - **Bacs18StandardFile** (.bacs) - Future support
- **EaziPay Specific Features:** ✨ **NEW**
  - **3 Date Format Options**: YYYY-MM-DD, DD-MMM-YYYY, DD/MM/YYYY
  - **Smart Header Handling**: Always headerless (automatically overrides requests)
  - **Dynamic Column Count**: 15 columns (quoted trailer) or 23 columns (unquoted trailer)
  - **Random File Extensions**: Intelligent .csv/.txt selection
  - **Advanced Field Validation**: Fixed zero, empty fields, conditional SUN numbers
  - **Transaction Code Rules**: Special handling for 0C, 0N, 0S codes
  - **Working Day Calculations**: UK Bank Holiday aware processing dates
- Configurable output location and file content
- Field-level validation and invalid data generation
- Working day calculations with UK Bank Holiday support
- Structured logging of all requests, errors, and responses
- 100% unit test coverage (Vitest)
- Extensible architecture for future file types

### Safe file browsing and reading (lib/fileReader) 🔐

Centralized, safe filesystem utilities used by MCP Common tools and available to other modules:

- `listOutputFiles({ fileType, sun, limit? })`
  - Returns `{ root, files: [{ name, size, modified }] }` for `output/<fileType>/<sun>`.
  - Enforces a limit (default 100) and ignores non-file entries.
- `readOutputFile({ fileType, sun, fileName, offset?, length?, mode? })`
  - Reads a slice of a file with safe defaults: `offset=0`, `length=64KB`, `mode='utf8' | 'base64'`.
  - Prevents path traversal using strict root-anchored joins and throws on missing files.

Example:

```ts
import { listOutputFiles, readOutputFile } from './src/lib/fileReader/fileReader';

const listing = listOutputFiles({ fileType: 'SDDirect', sun: '123456', limit: 5 });
const chunk = readOutputFile({ fileType: 'SDDirect', sun: '123456', fileName: listing.files[0].name, offset: 0, length: 1024, mode: 'utf8' });
```

## Getting Started

### Prerequisites

- Node.js (Latest LTS)
- npm
- **VS Code** (recommended IDE with configured workspace)

### VS Code Setup 🔧

This project includes a complete VS Code workspace configuration for optimal development experience:

**Recommended Extensions** (auto-prompted on workspace open):

- **TypeScript & Testing**: TypeScript Next, Vitest Explorer
- **HTTP Testing**: REST Client (for `.http` files)
- **Code Quality**: ESLint, Prettier, Code Spell Checker
- **Git Integration**: GitLens, GitHub PR/Issues
- **Node.js Tools**: NPM Intellisense, Azure Node Pack
- **Documentation**: Markdown All-in-One, Mermaid support
- **Productivity**: Error Lens, Path Intellisense, Todo Highlight

**Pre-configured Settings**:

- Auto-format on save with Prettier
- ESLint auto-fix on save
- TypeScript import organization
- REST Client optimization for `.http` files
- Vitest integration for test running
- Custom spell checker dictionary with project terms

### Install

```sh
npm install
```

### Build

```sh
npm run build
```

### Run

```sh
npm start
```

### Test

```sh
npm run test
```

## API Usage

### POST /api/generate

- Accepts JSON body matching the `Request` interface (see `documentation/types.ts`)
- Returns the full path of the generated file or an error summary

#### SDDirect Example

```json
{
  "fileType": "SDDirect",
  "numberOfRows": 20,
  "hasInvalidRows": true,
  "hasHeader": true
}
```

#### EaziPay Example

```json
{
  "fileType": "EaziPay",
  "numberOfRows": 10,
  "hasInvalidRows": false,
  "dateFormat": "DD-MMM-YYYY"
}
```

#### EaziPay Advanced Examples ✨ **NEW**

```json
// Basic EaziPay generation
{
  "fileType": "EaziPay",
  "numberOfRows": 15,
  "canInlineEdit": true
}

// EaziPay with specific date format
{
  "fileType": "EaziPay",
  "numberOfRows": 50,
  "dateFormat": "YYYY-MM-DD",
  "hasInvalidRows": true,
  "canInlineEdit": true
}

// EaziPay with header request (will be silently ignored)
{
  "fileType": "EaziPay",
  "numberOfRows": 100,
  "includeHeaders": true,  // Automatically overridden to false
  "dateFormat": "DD/MM/YYYY",
  "canInlineEdit": true
}
```

#### Example Response

```json
{
  "success": true,
  "filePath": "output/EaziPay_23_x_10_NH_V_20250721_141500.txt"
}
```

#### Filename Format

- **SDDirect**: `SDDirect_{columns}_{rows}_{header}_{validity}_{timestamp}.csv`
- **EaziPay**: `EaziPay_{columns}_{rows}_{header}_{validity}_{timestamp}.{csv|txt}`

Where:

- `columns`: Number of columns in the file (15 for quoted trailer, 23 for unquoted)
- `rows`: Number of data rows (always excludes headers for EaziPay)
- `header`: Always `NH` (no header) for EaziPay
- `validity`: `V` (valid data) or `I` (includes invalid data)
- `timestamp`: YYYYMMDD_HHMMSS format

## EaziPay File Format Specification ✨ **NEW**

### Field Structure (15 fields in exact order)

1. **Transaction Code** - One of: 01, 17, 18, 99, 0C, 0N, 0S
2. **Originating Sort Code** - 6 digit numeric
3. **Originating Account Number** - 8 digit numeric
4. **Destination Sort Code** - 6 digit numeric
5. **Destination Account Number** - 8 digit numeric
6. **Destination Account Name** - Max 18 characters
7. **Fixed Zero** - Always `0` (literal zero)
8. **Amount** - Integer (0 for transaction codes 0C, 0N, 0S)
9. **Processing Date** - Formatted according to dateFormat
10. **Empty** - Always empty/undefined
11. **SUN Name** - Max 18 characters
12. **Payment Reference** - 7-17 characters, specific validation rules
13. **SUN Number** - Optional, conditional on transaction code
14. **BACS Reference** - (same as Payment Reference)
15. **EaziPayTrailer** - `",,,,,,,,"` (quoted) or `,,,,,,,,,` (unquoted)

### Date Format Options

- **`"YYYY-MM-DD"`** → `2025-07-30`
- **`"DD-MMM-YYYY"`** → `30-JUL-2025` (uppercase month)
- **`"DD/MM/YYYY"`** → `30/07/2025`

If not specified, a random format is selected for the entire file.

### EaziPayTrailer Behavior

- **Quoted format** (`",,,,,,,,"`) → **15 total columns** in file
- **Unquoted format** (`,,,,,,,,,`) → **23 total columns** in file
- Format is randomly selected per file generation

### Special Validation Rules

- **Fixed Zero**: Must always be exactly `0`
- **Empty Field**: Must always be `undefined` (appears as empty in CSV)
- **SUN Number**: Only allowed when Transaction Code is 0C, 0N, or 0S
- **Amount**: Must be `0` when Transaction Code is 0C, 0N, or 0S
- **Processing Date**: Exactly 2 working days in future for codes 0C, 0N, 0S

### File Characteristics

- **Headers**: Never included (always headerless)
- **Extensions**: Randomly selected `.csv` or `.txt`
- **Column Count**: Varies (15 or 23) based on trailer format
- **Working Days**: UK Bank Holiday aware calculations

## Project Structure

```
.vscode/
├── extensions.json             # Recommended VS Code extensions
└── settings.json              # Workspace-specific settings

src/
├── index.ts                     # Express server entry point
├── index.test.ts               # Integration tests
└── lib/
    ├── types.ts                # Core type definitions
    ├── calendar.ts             # UK working day calculator
    ├── fileType/
    │   ├── factory.ts         # File type factory pattern
    │   ├── sddirect.ts        # SDDirect file generator
    │   └── eazipay.ts         # EaziPay file generator
    ├── fileWriter/
    │   ├── fileWriter.ts      # Universal file writer
    │   └── fsWrapper.ts       # File system abstraction
    ├── utils/
    │   ├── logger.ts          # Structured JSON logging
    │   └── dateFormatter.ts   # EaziPay date formatting
    └── validators/
        ├── requestValidator.ts     # API request validation
        └── eazipayValidator.ts    # EaziPay field validation

documentation/
├── types.ts                    # Shared type definitions
├── REQUIREMENTS.md            # Original requirements
├── field-level-validation.md  # Validation specifications
└── FileFormats/              # Format specifications
    ├── SDDirect.md
    ├── EaziPay.md
    ├── Bacs18PaymentLines.md
    └── Bacs18StandardFile.md

# HTTP Test Files
SDDirect.http                   # SDDirect API test requests
eazipay.http                   # EaziPay API test requests
```

## Technical Implementation

### Architecture

- **Factory Pattern**: Extensible file type generation
- **Dependency Injection**: Clean separation of concerns
- **Type Safety**: Full TypeScript implementation
- **Modular Design**: Independent validators and generators

### Key Components

- **Calendar System**: UK Bank Holiday aware working day calculations
- **Date Formatting**: Multiple format support for EaziPay
- **Field Validation**: File type specific validation rules
- **Random Data**: Faker.js integration with realistic test data
- **File Extensions**: Smart extension selection (EaziPay: .csv/.txt)

## Logging

- All requests, errors, and responses are logged in structured JSON format for easy analysis.

## Contributing

- Follow TypeScript, Node.js, and linting best practices
- All code must be unit tested (Vitest) with 100% coverage
- Follow SOLID principles and design patterns
- Use meaningful variable names and self-documenting code
- See `documentation/REQUIREMENTS.md` and `IMPLEMENTATION_PLAN.md` for details

## Testing

```sh
# Run all tests with coverage
npm run test

# Run tests in watch mode
npm run test:watch

# Type checking
npm run type-check

# Linting
npm run lint
```

### Manual API Testing 🧪

The project includes HTTP request files for manual testing with VS Code's REST Client extension:

- **`SDDirect.http`** - Comprehensive test cases for SDDirect file generation
  - Basic requests with various configurations
  - Edge cases (min/max rows, invalid data)
  - Error scenarios and validation testing
  - Performance testing with large datasets
  - Future file type testing (Bacs18)
- **`eazipay.http`** - Complete test suite for EaziPay file generation
  - All three date format options (YYYY-MM-DD, DD-MMM-YYYY, DD/MM/YYYY)
  - Header validation testing (always headerless)
  - Invalid data generation testing
  - File extension verification (.csv/.txt)
  - Error handling and edge cases

**Usage**: Install the REST Client extension in VS Code, then click "Send Request" above any HTTP request in these files. Variables like `{{number_of_rows}}` are defined at the top of each file for easy modification.

## File Format Support Status

- ✅ **SDDirect** - Complete implementation (Phase 1)
- ✅ **EaziPay** - Complete implementation (Phase 2.1) ⭐ **NEWLY COMPLETED**
  - ✅ 3 Date format options
  - ✅ Dynamic column count (15/23)
  - ✅ Random file extensions (.csv/.txt)
  - ✅ Advanced field validation
  - ✅ Transaction code special handling
  - ✅ Working day calculations
  - ✅ 100% test coverage (132 tests)
- 🚧 **Bacs18PaymentLines** - Planned (Phase 3)
- 🚧 **Bacs18StandardFile** - Planned (Phase 4)

## Recent Updates 📈

- **MCP bootstrap ✅**: JSON-RPC stdio server with EaziPay and SDDirect tools; standardized error helpers and ParseError handling
- **Common tools ✅**: Added list/preview/validate/list-files/read-file utilities with path safety and schemas
- **Tooling ✅**: Prettier + ESLint TS 5.8 integration; repo formatted
- **Deps ✅**: Modernized Faker v8 APIs (removed deprecations)
- **Phase 2.1 Complete ✅**: Full EaziPay implementation with comprehensive features
- **Advanced Date Formatting**: 3 EaziPay date format options with consistent file-wide formatting
- **Dynamic Column Handling**: Smart 15/23 column generation based on trailer format
- **Enhanced Field Validation**: EaziPay-specific validation rules including conditional SUN numbers
- **Random File Extensions**: Intelligent .csv/.txt selection for EaziPay files
- **Header Override Logic**: Automatic headerless enforcement for EaziPay
- **Working Day Calculations**: UK Bank Holiday aware date calculations for processing dates
- **100% Test Coverage**: 141 passing tests with comprehensive unit and integration coverage
- **Performance Tested**: Validated with 1000+ row file generation

## License

MIT
