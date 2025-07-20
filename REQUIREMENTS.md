# DDCMS Direct File Creator - Requirements Document

**Project:** DDCMS Direct File Creator  
**Version:** 1.0.0  
**Date:** July 19, 2025  
**Status:** Ready for Implementation  

## 📋 Executive Summary

The DDCMS Direct File Creator is a Node.js API application that generates DDCMS Direct files in predefined formats with randomly generated data. The primary purpose is to create test files for DDCMS Direct, supporting multiple file formats with comprehensive data validation and configurable output options.

## 🎯 Project Objectives

- **Primary Goal:** Generate standardized DDCMS Direct files with random but valid data
- **MVP Scope:** Support SDDirect file format (.csv)
- **Future Scope:** Extensible architecture for Bacs18PaymentLines (.txt), Bacs18StandardFile (.bacs) and EaziPasy (.csv)
- **Quality:** Production-ready code with comprehensive testing and validation

## 🛠 Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Node.js | Latest LTS |
| Language | TypeScript | Latest |
| Framework | Express.js | Latest |
| Build Tool | Vite | Latest |
| Testing | Vitest | Latest |
| Data Generation | Faker.js | Latest |
| Date/Time | Luxon | Latest |
| Linting | ESLint + TypeScript | Latest |

## 🏗 System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   HTTP Client   │───▶│  Express API    │───▶│ File Generator  │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Validation    │    │  File System    │
                       │    Engine       │    │                 │
                       └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  UK Bank        │
                       │  Holidays       │
                       └─────────────────┘
```

### Core Modules

1. **API Layer** - Express.js REST endpoints
2. **Validation Engine** - Field-level data validation
3. **Data Generator** - Faker.js powered random data generation
4. **File Generator** - Format-specific file creation
5. **Calendar Service** - Working day and bank holiday calculations
6. **File System Service** - File storage and naming

## 📊 Functional Requirements

### FR1: API Endpoint - Generate File

**Endpoint:** `POST /api/generate`  
**Content-Type:** `application/json`  
**Body:** Optional JSON (defaults applied if empty)

#### Request Interface
```typescript
interface Request {
  fileType: "SDDirect" | "Bacs18PaymentLines" | "Bacs18StandardFile";
  canInlineEdit: boolean;
  includeHeaders?: boolean;
  numberOfRows?: number;
  hasInvalidRows?: boolean;
  includeOptionalFields?: boolean | OptionalField[];
  optionalFields?: OptionalFieldItem;
  outputPath?: string;
}
```

#### Default Values
```typescript
const defaultRequest: Request = {
  fileType: "SDDirect",
  canInlineEdit: true,
  includeHeaders: true,
  hasInvalidRows: false,
  numberOfRows: 15,
  includeOptionalFields: true,
  optionalFields: {
    originatingAccountDetails: {
      canBeInvalid: true,
      sortCode: "912291",
      accountNumber: "51491194",
      accountName: "Test Account"
    }
  }
};
```

#### Response Interface
```typescript
interface SuccessResponse {
  success: true;
  filePath: string;
}

interface ErrorResponse {
  success: false;
  error: string;
}
```

### FR2: File Generation Logic

#### File Naming Convention
```
[FileType]_[COLUMNCOUNT]_x_[ROWS]_[HEADERS]_[VALIDITY]_[TIMESTAMP].[extension]
```

**Components:**
- `[FileType]`: SDDirect, Bacs18PaymentLines, or Bacs18StandardFile
- `[COLUMNCOUNT]`: 06 (required only) or 11 (with optional fields)
- `[ROWS]`: Number of data rows (default: 15)
- `[HEADERS]`: _H (headers included) or NH (no headers)
- `[VALIDITY]`: V (all valid) or I (contains invalid rows)
- `[TIMESTAMP]`: YYYYMMDD_HHMMSS format
- `[extension]`: .csv, .txt, or .bacs

**Example:** `SDDirect_11_x_15_H_V_20250719_143022.csv`

#### File Storage
- **Default Location:** `./output` directory relative to application root
- **Custom Location:** Use `outputPath` from request if provided
- **Directory Creation:** Automatically create directories if they don't exist

### FR3: Data Generation Rules

#### Valid Data Generation
- Use **Faker.js** for realistic random data
- Use **Luxon** for all date/time operations
- Follow field-level validation rules (see FR5)
- Apply business logic for date calculations

#### Invalid Data Generation
When `hasInvalidRows: true`:
- Generate approximately 50% invalid rows (rounded down)
- Each invalid row must have 1-3 fields that violate validation rules
- Maximum 49 invalid rows when `canInlineEdit: true`
- Examples:
  - 15 rows → 7 invalid rows
  - 100 rows → 49 invalid rows (due to canInlineEdit limit)

#### Optional Fields Logic
- `includeOptionalFields: true` → Include ALL optional fields
- `includeOptionalFields: [array]` → Include only specified fields
- `optionalFields` provided → Use specified data for ALL rows, don't generate randomly
- Auto-include fields: If `optionalFields` contains a field not in `includeOptionalFields` array, automatically include it

### FR4: SDDirect File Format (MVP)

**File Extension:** `.csv`  
**Field Order:** Exact sequence required

#### Required Fields (Always Present)
1. Destination Account Name
2. Destination Sort Code  
3. Destination Account Number
4. Payment Reference
5. Amount
6. Transaction Code

#### Optional Fields (When includeOptionalFields: true)
7. Realtime Information Checksum
8. Pay Date
9. Originating Sort Code
10. Originating Account Number
11. Originating Account Name

#### Header Row Examples
**Required Fields Only:**
```csv
Destination Account Name,Destination Sort Code,Destination Account Number,Payment Reference,Amount,Transaction code
```

**All Fields:**
```csv
Destination Account Name,Destination Sort Code,Destination Account Number,Payment Reference,Amount,Transaction code,Realtime Information Checksum,Pay Date,Originating Sort Code,Originating Account Number,Originating Account Name
```

### FR5: Field-Level Validation Rules

#### Destination Account Name
- **Length:** ≤ 18 characters
- **Characters:** Allowed character set only (see FR5.11)

#### Destination Sort Code
- **Format:** Exactly 6 numeric digits
- **Example:** "123456"

#### Destination Account Number  
- **Format:** Exactly 8 numeric digits
- **Example:** "12345678"

#### Payment Reference
- **Length:** > 6 and < 18 characters
- **Start:** Must begin with word character (letter/number)
- **Restrictions:** Cannot start with "DDIC" or space
- **Validation:** Cannot contain all identical characters
- **Characters:** Allowed character set only

#### Amount
- **Format:** Decimal or integer
- **Separators:** Must not contain separator characters
- **Special Rule:** If Transaction Code is 0C, 0N, or 0S → Amount must be "0"

#### Transaction Code
- **Valid Values:** 01, 17, 18, 99, 0C, 0N, 0S
- **Required:** Must not be null

#### Realtime Information Checksum (Optional)
- **Pattern 1:** Forward slash + exactly 3 allowed characters (/XXX)
- **Pattern 2:** Exactly four zeros (0000)  
- **Pattern 3:** Empty string
- **Example:** "/ABC", "0000", ""

#### Pay Date (Optional)
- **Format:** YYYYMMDD
- **Minimum:** At least 3 working days in future
- **Maximum:** No more than 30 days in future
- **Exclusions:** Not Saturday, Sunday, or UK Bank Holiday
- **Special Rule:** If Transaction Code is 0N, 0C, or 0S → EXACTLY 3 working days in future

#### Processing Date (Future File Types)
- **Format:** YYYYMMDD
- **Minimum:** At least 2 working days in future
- **Exclusions:** Not Saturday, Sunday, or UK Bank Holiday
- **Special Rule:** If Transaction Code is 0N, 0C, or 0S → EXACTLY 2 working days in future
- **Note:** Not used in SDDirect format

#### Originating Account Fields (Optional)
- **Originating Account Name:** ≤ 18 characters, allowed character set
- **Originating Sort Code:** Exactly 6 numeric digits
- **Originating Account Number:** Exactly 8 numeric digits

#### Allowed Character Set
- **Alpha:** A–Z, a–z
- **Numeric:** 0–9
- **Symbols:** . (full stop), & (ampersand), / (slash), - (hyphen), (space)

### FR6: Working Day Calculations

#### Definition
**Working Day:** Monday to Friday (weekday 1-5) AND not a UK Bank Holiday

#### UK Bank Holiday Data
- **Source:** `src/lib/calendar.ts`
- **Coverage:** 2019-2027
- **Function:** `IsBankHoliday(dt: luxon.DateTime): boolean`
- **Helper Functions:**
  - `IsWorkingDay(dt: luxon.DateTime): boolean`
  - `AddWorkingDays(startDate: luxon.DateTime, workingDays: number): luxon.DateTime`

#### Date Format Consistency
- **Internal:** YYYYMMDD format for all date comparisons
- **Display:** YYYYMMDD format in generated files
- **Timestamps:** YYYYMMDD_HHMMSS for file naming

## 🔧 Non-Functional Requirements

### NFR1: Performance
- **Response Time:** < 2 seconds for file generation (up to 1000 rows)
- **Memory Usage:** Efficient data streaming for large files
- **Concurrency:** Support multiple simultaneous requests

### NFR2: Reliability
- **Error Handling:** Comprehensive error logging and graceful degradation
- **Validation:** Input validation with clear error messages
- **File Operations:** Atomic file writes to prevent corruption

### NFR3: Maintainability
- **Code Quality:** Follow SOLID principles
- **Documentation:** Self-documenting code with meaningful names
- **Testing:** 100% unit test coverage
- **Linting:** Strict TypeScript and ESLint rules

### NFR4: Security
- **Input Validation:** Sanitize all user inputs
- **File Paths:** Prevent directory traversal attacks
- **Error Logging:** Full error details in logs, summary only in API responses
- **Dependencies:** Regular security updates

### NFR5: Extensibility
- **Architecture:** Plugin-based file format system
- **Future Formats:** Easy addition of Bacs18PaymentLines and Bacs18StandardFile
- **Configuration:** Environment-based configuration
- **API Versioning:** Prepare for future API changes

## 🧪 Testing Requirements

### Test Strategy
- **Unit Tests:** All business logic functions
- **Integration Tests:** API endpoints with real file generation
- **Validation Tests:** All field validation rules
- **Date Tests:** Working day calculations and bank holiday logic
- **Error Tests:** Error handling and edge cases

### Test Structure
- **Location:** Tests alongside source files (`*.test.ts`)
- **Framework:** Vitest with TypeScript support
- **Coverage:** Minimum 100% line coverage
- **Naming:** Descriptive test names without "Arrange/Act/Assert" comments

### Test Data
- **Real Bank Holidays:** Use actual UK bank holiday data
- **Edge Cases:** Weekend dates, bank holidays, year boundaries
- **Invalid Data:** Test all validation rule violations
- **Large Files:** Performance testing with 10000+ rows

## 🚀 Deployment Requirements

### Application Configuration
- **Port:** Default 3001 (configurable via PORT environment variable)
- **Environment:** Support for development/production configurations
- **Logging:** Structured logging with appropriate levels
- **Health Check:** Basic application health endpoint

### Build Process
- **TypeScript Compilation:** Clean build with type checking
- **Asset Bundling:** Vite for efficient bundling
- **Linting:** Pass all ESLint and TypeScript checks
- **Testing:** All tests pass before deployment

### Runtime Requirements
- **Node.js:** Latest LTS version
- **File System:** Write permissions for output directory
- **Memory:** Minimum 512MB for typical workloads
- **Storage:** Adequate space for generated files

## 🎭 User Stories

### US1: Basic File Generation
**As a** QA tester  
**I want to** generate a simple SDDirect file with default settings  
**So that** I can quickly create test data for my application

**Acceptance Criteria:**
- POST to `/api/generate` with empty body creates default file
- File contains 15 rows of valid data with headers
- All required fields are populated with realistic data
- File is saved to default output directory

### US2: Custom File Configuration
**As a** test data manager  
**I want to** specify the number of rows and include invalid data  
**So that** I can test various scenarios in my application

**Acceptance Criteria:**
- Can specify `numberOfRows` and `hasInvalidRows` in request
- Invalid rows contain 1-3 validation rule violations
- Approximately 50% of rows are invalid when requested
- File naming reflects validity status (V/I)

### US3: Optional Field Control
**As a** system integrator  
**I want to** control which optional fields are included  
**So that** I can test different file formats

**Acceptance Criteria:**
- Can include all optional fields with `includeOptionalFields: true`
- Can include specific fields with array specification
- Can provide custom data via `optionalFields`
- Column count in filename reflects actual columns (06/11)

### US4: Working Day Validation
**As a** financial system developer  
**I want to** ensure pay dates respect working days and bank holidays  
**So that** my test data matches real-world business rules

**Acceptance Criteria:**
- Pay dates are never weekends or UK bank holidays
- Special transaction codes have exact working day requirements
- Date calculations account for year boundaries and holiday periods

## 📅 Implementation Timeline

### Phase 1: Core Infrastructure (Week 1)
- [ ] Project setup with TypeScript, Express, Vite, Vitest
- [ ] Basic API structure and routing
- [ ] Calendar service implementation and testing
- [ ] Core types and interfaces

### Phase 2: SDDirect Implementation (Week 2)
- [ ] Data validation engine
- [ ] Faker.js data generation
- [ ] SDDirect file format generator
- [ ] File naming and storage logic

### Phase 3: Advanced Features (Week 3)
- [ ] Invalid data generation logic
- [ ] Optional fields handling
- [ ] Error handling and logging
- [ ] Comprehensive testing suite

### Phase 4: Polish & Documentation (Week 4)
- [ ] Performance optimization
- [ ] Security review
- [ ] API documentation
- [ ] Deployment preparation

## 🏆 Success Criteria

1. **✅ Functional Completeness:** All SDDirect requirements implemented
2. **✅ Quality Standards:** 100% test coverage, zero linting errors
3. **✅ Performance:** Sub-2-second response times for typical requests
4. **✅ Extensibility:** Clean architecture ready for future file formats
5. **✅ Documentation:** Comprehensive API and code documentation
6. **✅ User Experience:** Intuitive API with clear error messages

## 📚 Appendices

### Appendix A: API Examples
See `request.http` file for comprehensive API usage examples.

### Appendix B: File Format Specifications
- [SDDirect Format](documentation/FileFormats/SDDirect.md)
- [Bacs18PaymentLines Format](documentation/FileFormats/Bacs18PaymentLines.md) (Future)
- [Bacs18StandardFile Format](documentation/FileFormats/Bacs18StandardFile.md) (Future)

### Appendix C: Validation Rules
See [Field-Level Validation Rules](documentation/field-level-validation.md) for complete validation specifications.

---

**Document Prepared By:** GitHub Copilot  
**Review Status:** Ready for Implementation  
**Next Action:** Begin Phase 1 Implementation
