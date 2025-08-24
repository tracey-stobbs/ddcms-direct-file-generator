# DDCMS Direct File Creator

A Node.js API for generating DDCMS Direct files in predefined formats with random, valid, or intentionally invalid data for testing purposes.

## Features
- Per-filetype API endpoints scoped by SUN
- **Multiple File Formats:**
  - **SDDirect** (.csv) - Complete implementation
  - **EaziPay** (.csv/.txt) - Complete implementation ✨ **NEW**
  - **Bacs18PaymentLines** (.txt) - Future support
  - **Bacs18StandardFile** (.bacs) - Future support
- **EaziPay Specific Features:**
  - **3 Date Format Options**: YYYY-MM-DD, DD-MMM-YYYY, DD/MM/YYYY
  - **Smart Header Handling**: Always headerless (automatically overrides requests)
  - **Fixed Column Count**: 14 columns (last column is an empty trailer placeholder)
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

New endpoints are namespaced by SUN and file type.

### POST /api/:sun/:filetype/generate
- Body: GenerateRequest
  - processingDate?: string
  - forInlineEditing?: boolean
  - numberOfRows?: number
  - includeOptionalFields?: boolean | string[]
  - dateFormat?: 'YYYY-MM-DD' | 'DD-MMM-YYYY' | 'DD/MM/YYYY' (EaziPay only)
  - includeHeaders?: boolean (SDDirect only)
  - hasInvalidRows?: boolean
  - outputPath?: string
- Returns: { success: true, fileContent: string } and sets header `X-Generated-File` with the relative file path

Example (SDDirect):
```json
{
  "numberOfRows": 20,
  "hasInvalidRows": true,
  "includeHeaders": true
}
```

Example (EaziPay):
```json
{
  "numberOfRows": 10,
  "hasInvalidRows": false,
  "dateFormat": "DD-MMM-YYYY"
}
```

### POST /api/:sun/:filetype/valid-row
### POST /api/:sun/:filetype/invalid-row
- Body: RowPreviewRequest (same as GenerateRequest minus includeHeaders/hasInvalidRows/outputPath)
- Returns:
  - headers: { name: string, value: number }[]
  - rows: { fields: { value: string | number | boolean, order: number }[] }[]
  - metadata: object

#### Filename Format
- Output directory: `output/{filetype}/{SUN}/...`
- **SDDirect**: `SDDirect_{columns}_{rows}_{header}_{validity}_{timestamp}.csv`
- **EaziPay**: `EaziPay_{columns}_{rows}_{header}_{validity}_{timestamp}.{csv|txt}`

Where:
- `columns`: Number of columns in the file (SDDirect varies; EaziPay fixed at 14)
- `rows`: Number of data rows (EaziPay always headerless)
- `header`: `H` or `NH` (EaziPay is always `NH`)
- `validity`: `V` (valid data) or `I` (includes invalid data)
- `timestamp`: YYYYMMDD_HHMMSS format

## EaziPay File Format Specification

### Field Structure (14 fields in exact order)
1. Transaction Code — One of: 01, 17, 18, 99, 0C, 0N, 0S
2. Originating Sort Code — 6 digit numeric
3. Originating Account Number — 8 digit numeric
4. Destination Sort Code — 6 digit numeric
5. Destination Account Number — 8 digit numeric
6. Destination Account Name — Max 18 characters
7. Fixed Zero — Always 0 (literal zero)
8. Amount — Integer (0 for 0C, 0N, 0S)
9. Processing Date — Formatted per dateFormat
10. Empty — Always empty/undefined (renders as empty string)
11. SUN Name — Max 18 characters
12. Payment Reference — 7-17 chars, specific validation rules
13. SUN Number — Optional; only allowed for 0C, 0N, 0S
14. Empty Trailer 1 — Always empty string

### Date Format Options
- **`"YYYY-MM-DD"`** → `2025-07-30`
- **`"DD-MMM-YYYY"`** → `30-JUL-2025` (uppercase month)
- **`"DD/MM/YYYY"`** → `30/07/2025`

If not specified, a random format is selected for the entire file.

### Trailer Behavior
- Trailer field removed and replaced with a single empty trailing column.
- EaziPay column count is fixed at 14.

### Special Validation Rules
- **Fixed Zero**: Must always be exactly `0`
- **Empty Field**: Must always be `undefined` (appears as empty in CSV)
- **SUN Number**: Only allowed when Transaction Code is 0C, 0N, or 0S
- **Amount**: Must be `0` when Transaction Code is 0C, 0N, or 0S
- **Processing Date**: Exactly 2 working days in future for codes 0C, 0N, 0S

### File Characteristics
- Headers: Never included (always headerless)
- Extensions: Randomly selected `.csv` or `.txt`
- Column Count: Fixed at 14
- Working Days: UK Bank Holiday aware calculations

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
eazipay.http                    # EaziPay API test requests
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
- ✅ SDDirect — Complete implementation (Phase 1)
- ✅ EaziPay — Complete implementation (Phase 2.2)
  - ✅ 3 date format options
  - ✅ Fixed 14 column output
  - ✅ Random file extensions (.csv/.txt)
  - ✅ Advanced field validation
  - ✅ Transaction code special handling
  - ✅ Working day calculations
  - ✅ 100% test coverage
- 🚧 Bacs18PaymentLines — Planned (Phase 3)
- 🚧 Bacs18StandardFile — Planned (Phase 4)

## Recent Updates 📈
- Phase 2.2: New per-filetype endpoints: `/api/:sun/:filetype/generate`, `/valid-row`, `/invalid-row`
- Generate returns fileContent and sets `X-Generated-File` header with relative path
- Public API: added `processingDate`, renamed `canInlineEdit` → `forInlineEditing`, removed `fileType` from body
- Row preview responses: headers `{name, value}`, rows `{fields:[{value, order}]}`
- EaziPay: trailer removed; fixed 14 columns with last column as empty
- Test suite: 123 passing tests (Vitest)

## License
MIT
