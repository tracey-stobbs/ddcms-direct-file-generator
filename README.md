# DDCMS Direct File Creator

A Node.js API for generating DDCMS Direct files in predefined formats with random, valid, or intentionally invalid data for testing purposes.

## Features
- Single `/api/generate` endpoint (JSON, body optional)
- **Multiple File Formats:**
  - **SDDirect** (.csv) - Complete implementation
  - **EaziPay** (.csv/.txt) - Complete implementation with multiple date formats
  - **Bacs18PaymentLines** (.txt) - Future support
  - **Bacs18StandardFile** (.bacs) - Future support
- **EaziPay Specific Features:**
  - 3 date format options (YYYY-MM-DD, DD-MMM-YYYY, DD/MM/YYYY)
  - Automatic header validation (always headerless)
  - EaziPayTrailer with quoted/unquoted column handling (15 vs 23 columns)
  - Random file extension selection (.csv or .txt)
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
- `columns`: Number of columns in the file
- `rows`: Number of data rows (excluding header)
- `header`: `H` (has header) or `NH` (no header)
- `validity`: `V` (valid data) or `I` (includes invalid data)
- `timestamp`: YYYYMMDD_HHMMSS format

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
- ✅ **SDDirect** - Complete implementation
- ✅ **EaziPay** - Complete implementation  
- 🚧 **Bacs18PaymentLines** - Planned (Phase 3)
- 🚧 **Bacs18StandardFile** - Planned (Phase 4)

## Recent Updates 📈
- **Phase 2.1 Complete**: Full EaziPay implementation with 3 date formats
- **Enhanced Validation**: EaziPay-specific field validation rules
- **Random Extensions**: Smart .csv/.txt selection for EaziPay files
- **Working Day Logic**: UK Bank Holiday aware date calculations
- **100% Test Coverage**: Comprehensive unit and integration tests

## License
MIT
