# DDCMS Direct File Creator - Implementation Plan

**Project:** DDCMS Direct File Creator  
**Version:** 1.0.0  
**Date:** July 19, 2025  
**Status:** Ready for Development  

## 🎯 Implementation Overview

This implementation plan provides a detailed roadmap for building the DDCMS Direct File Creator based on the requirements document. The plan follows a modular, test-driven development approach with emphasis on extensibility and maintainability.

## 🏗 Architecture Design

### Project Structure
```
shiny-palm-tree/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── generate.ts
│   │   │   └── health.ts
│   │   ├── middleware/
│   │   │   ├── validation.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── logging.ts
│   │   └── server.ts
│   ├── services/
│   │   ├── fileGenerator/
│   │   │   ├── FileGeneratorFactory.ts
│   │   │   ├── SDDirectGenerator.ts
│   │   │   └── BaseFileGenerator.ts
│   │   ├── dataGenerator/
│   │   │   ├── DataGeneratorService.ts
│   │   │   ├── FieldValidators.ts
│   │   │   └── InvalidDataGenerator.ts
│   │   ├── validation/
│   │   │   ├── RequestValidator.ts
│   │   │   ├── FieldValidator.ts
│   │   │   └── ValidationRules.ts
│   │   └── storage/
│   │       ├── FileStorageService.ts
│   │       └── FileNamingService.ts
│   ├── lib/
│   │   ├── calendar.ts (existing)
│   │   ├── logger.ts
│   │   └── config.ts
│   ├── types/
│   │   ├── api.ts
│   │   ├── fileFormats.ts
│   │   └── common.ts
│   └── app.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── output/ (created at runtime)
├── documentation/ (existing)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── eslint.config.js
└── .env.example
```

### Design Patterns & Principles

#### 1. Factory Pattern
- **FileGeneratorFactory**: Creates appropriate file generators based on file type
- **Extensibility**: Easy addition of new file formats (Bacs18PaymentLines, Bacs18StandardFile)

#### 2. Strategy Pattern
- **ValidationStrategy**: Different validation rules per file format
- **DataGenerationStrategy**: Format-specific data generation logic

#### 3. Dependency Injection
- **Service Container**: Centralized dependency management
- **Testability**: Easy mocking for unit tests

#### 4. Single Responsibility Principle
- Each service has one clear responsibility
- Promotes modularity and testability

#### 5. Open/Closed Principle
- Extensible for new file formats without modifying existing code
- Plugin-based architecture for future enhancements

## 📋 Implementation Phases

### Phase 1: Core Infrastructure Setup (Days 1-2)

#### 1.1 Project Initialization
**Tasks:**
- [ ] Initialize npm project with TypeScript
- [ ] Configure Vite for build and development
- [ ] Set up Vitest for testing
- [ ] Configure ESLint and TypeScript strict mode
- [ ] Create basic project structure

**Files to Create:**
```bash
package.json
tsconfig.json
vite.config.ts
vitest.config.ts
eslint.config.js
.env.example
src/app.ts
src/lib/config.ts
src/lib/logger.ts
```

**Dependencies:**
```json
{
  "dependencies": {
    "express": "^4.x.x",
    "luxon": "^3.x.x",
    "@faker-js/faker": "^8.x.x",
    "zod": "^3.x.x"
  },
  "devDependencies": {
    "@types/express": "^4.x.x",
    "@types/luxon": "^3.x.x",
    "@types/node": "^20.x.x",
    "typescript": "^5.x.x",
    "vite": "^5.x.x",
    "vitest": "^1.x.x",
    "eslint": "^8.x.x",
    "@typescript-eslint/parser": "^6.x.x",
    "@typescript-eslint/eslint-plugin": "^6.x.x"
  }
}
```

#### 1.2 Basic Express Setup
**Tasks:**
- [ ] Create Express application with TypeScript
- [ ] Set up basic middleware (CORS, JSON parsing, logging)
- [ ] Configure environment-based settings
- [ ] Create health check endpoint

**Test Coverage:**
- Basic server startup
- Health endpoint response
- Environment configuration loading

### Phase 2: Type System & Validation (Days 3-4)

#### 2.1 Core Type Definitions
**Tasks:**
- [ ] Define API request/response interfaces
- [ ] Create file format type definitions
- [ ] Implement validation schemas using Zod
- [ ] Set up request validation middleware

**Files to Create:**
```bash
src/types/api.ts
src/types/fileFormats.ts
src/types/common.ts
src/api/middleware/validation.ts
src/services/validation/RequestValidator.ts
src/services/validation/ValidationRules.ts
```

**Key Interfaces:**
```typescript
// API Types
interface GenerateRequest {
  fileType: FileType;
  canInlineEdit: boolean;
  includeHeaders?: boolean;
  numberOfRows?: number;
  hasInvalidRows?: boolean;
  includeOptionalFields?: boolean | OptionalField[];
  optionalFields?: OptionalFieldItem;
  outputPath?: string;
}

// SDDirect File Format Types (matching SDDirect.md specification)
interface SDDirectRecord {
  // Required fields (exact order from SDDirect.md)
  destinationAccountName: string;        // ≤18 chars, allowed chars only
  destinationSortCode: string;           // Exactly 6 digits
  destinationAccountNumber: string;      // Exactly 8 digits  
  paymentReference: string;              // 6-18 chars, specific rules
  amount: string;                        // Decimal as string, "0" for 0C/0N/0S codes
  transactionCode: TransactionCode;      // 01,17,18,99,0C,0N,0S only
  
  // Optional fields (exact order from SDDirect.md)
  realtimeInformationChecksum?: string;  // /XXX pattern, 0000, or empty
  payDate?: string;                      // YYYYMMDD, working day rules
  originatingSortCode?: string;          // Exactly 6 digits
  originatingAccountNumber?: string;     // Exactly 8 digits
  originatingAccountName?: string;       // ≤18 chars, allowed chars only
}

// Valid transaction codes (from field-level-validation.md)
type TransactionCode = '01' | '17' | '18' | '99' | '0C' | '0N' | '0S';
```

#### 2.2 Field Validation Engine
**Tasks:**
- [ ] Implement individual field validators
- [ ] Create validation rule engine
- [ ] Add working day validation logic
- [ ] Build comprehensive validation test suite

**Test Coverage:**
- All field validation rules
- Working day calculations
- Bank holiday exclusions
- Edge cases (year boundaries, special dates)

### Phase 3: Data Generation Engine (Days 5-6)

#### 3.1 Valid Data Generation
**Tasks:**
- [ ] Create Faker.js-based data generators with exact validation compliance
- [ ] Implement field-specific generation logic following field-level-validation.md
- [ ] Add working day calculation for dates using calendar service
- [ ] Create transaction code-specific logic with amount constraints

**Files to Create:**
```bash
src/services/dataGenerator/DataGeneratorService.ts
src/services/dataGenerator/FieldGenerators.ts
src/services/dataGenerator/DateCalculator.ts
src/services/dataGenerator/TransactionCodeHandler.ts
```

**Critical Generation Rules:**
- **Transaction Codes**: Only generate from: `01`, `17`, `18`, `99`, `0C`, `0N`, `0S`
- **Amount Logic**: If transaction code is `0C`, `0N`, or `0S` → amount MUST be "0"
- **Character Set**: All text fields use only `A-Za-z0-9.&/- ` (space included)
- **Payment Reference**: 6-18 chars, start with word char, not "DDIC", not all same chars
- **Account Names**: ≤18 characters with allowed character set only
- **Sort Codes**: Exactly 6 digits (use realistic UK bank prefixes)
- **Account Numbers**: Exactly 8 digits
- **Pay Date**: 3-30 working days future, special 3-day rule for 0C/0N/0S codes
- **Realtime Checksum**: Pattern `/XXX`, `0000`, or empty string only

**Key Features:**
- Generate realistic UK account names, sort codes, account numbers
- Create valid payment references with allowed characters only
- Calculate proper pay dates respecting working days and UK bank holidays
- Handle special transaction codes with exact business rules
- Ensure all generated data passes field validation

#### 3.2 Invalid Data Generation
**Tasks:**
- [ ] Create invalid data generation strategies
- [ ] Implement 50% invalid row logic with rounding
- [ ] Add canInlineEdit constraint (max 49 invalid rows)
- [ ] Ensure 1-3 violations per invalid row

**Test Coverage:**
- Invalid data generation percentages
- Field violation strategies
- CanInlineEdit limits
- Various row count scenarios

### Phase 4: File Generation System (Days 7-8)

#### 4.1 File Generator Architecture
**Tasks:**
- [ ] Create base file generator interface
- [ ] Implement SDDirect CSV generator
- [ ] Build file naming service
- [ ] Create file storage service

**Files to Create:**
```bash
src/services/fileGenerator/BaseFileGenerator.ts
src/services/fileGenerator/FileGeneratorFactory.ts
src/services/fileGenerator/SDDirectGenerator.ts
src/services/storage/FileStorageService.ts
src/services/storage/FileNamingService.ts
```

**Architecture:**
```typescript
interface IFileGenerator {
  generateFile(request: GenerateRequest): Promise<string>;
  validateRequest(request: GenerateRequest): ValidationResult;
  generateData(request: GenerateRequest): FileData;
  formatOutput(data: FileData): string;
}

class SDDirectGenerator implements IFileGenerator {
  // Implementation for SDDirect CSV format
}
```

#### 4.2 File Naming & Storage
**Tasks:**
- [ ] Implement filename convention logic
- [ ] Create output directory management
- [ ] Add custom path support
- [ ] Ensure atomic file operations

**File Naming Logic:**
- Component calculation (FileType, ColumnCount, Headers, Validity)
- Timestamp generation in correct format
- Path validation and sanitization

### Phase 5: API Layer (Days 9-10)

#### 5.1 Generate Endpoint
**Tasks:**
- [ ] Implement POST /api/generate endpoint
- [ ] Add request validation middleware
- [ ] Create error handling middleware
- [ ] Implement proper HTTP status codes

**Files to Create:**
```bash
src/api/routes/generate.ts
src/api/routes/health.ts
src/api/middleware/errorHandler.ts
src/api/middleware/logging.ts
src/api/server.ts
```

#### 5.2 Error Handling & Logging
**Tasks:**
- [ ] Create comprehensive error handling
- [ ] Implement structured logging
- [ ] Add request/response logging
- [ ] Create user-friendly error messages

**Error Categories:**
- Validation errors (400 Bad Request)
- File system errors (500 Internal Server Error)
- Business logic errors (422 Unprocessable Entity)

### Phase 6: Testing & Quality (Days 11-12)

#### 6.1 Unit Testing
**Test Categories:**
- **Calendar Service Tests:** Bank holiday detection, working day calculations, 3/30 day rules
- **Validation Engine Tests:** All 7 transaction codes, character set validation, field length limits
- **Data Generation Tests:** Valid/invalid data generation, transaction code constraints, amount rules
- **Field Validation Tests:** Payment reference rules, account name/number formats, date calculations
- **File Generation Tests:** CSV formatting with exact SDDirect.md field order, file naming, storage
- **API Tests:** Request/response handling, error scenarios, edge cases

**Critical Test Scenarios:**
- Transaction codes `0C`, `0N`, `0S` always generate amount "0"
- Pay dates respect 3-working-day rule for special transaction codes
- Payment references never start with "DDIC" or contain all same characters
- All text fields only use allowed character set: `A-Za-z0-9.&/- `
- Sort codes and account numbers are exactly 6 and 8 digits respectively
- Realtime checksum follows `/XXX`, `0000`, or empty patterns only
- Working day calculations exclude weekends and UK bank holidays

**Coverage Requirements:**
- 100% line coverage
- All validation rules tested
- Edge cases covered
- Error scenarios tested

#### 6.2 Integration Testing
**Test Scenarios:**
- End-to-end file generation workflow
- API request/response cycle
- File system operations
- Error handling flows

**Test Data:**
- Various request configurations
- Edge case dates (holidays, weekends)
- Large file generation (performance testing)
- Invalid request scenarios

### Phase 7: Performance & Security (Days 13-14)

#### 7.1 Performance Optimization
**Tasks:**
- [ ] Optimize data generation for large files
- [ ] Implement efficient CSV writing
- [ ] Add memory usage monitoring
- [ ] Create performance benchmarks

**Performance Targets:**
- < 2 seconds for 1000 rows
- Efficient memory usage for large files
- Concurrent request handling

#### 7.2 Security Implementation
**Tasks:**
- [ ] Input sanitization and validation
- [ ] Path traversal prevention
- [ ] Rate limiting consideration
- [ ] Security headers

**Security Measures:**
- Zod schema validation for all inputs
- Path sanitization for outputPath
- Error message sanitization
- Dependency security audit

## 🧪 Testing Strategy

### Test Structure
```
tests/
├── unit/
│   ├── services/
│   │   ├── dataGenerator.test.ts
│   │   ├── fileGenerator.test.ts
│   │   ├── validation.test.ts
│   │   └── storage.test.ts
│   ├── lib/
│   │   └── calendar.test.ts
│   └── api/
│       └── routes.test.ts
├── integration/
│   ├── api.test.ts
│   ├── fileGeneration.test.ts
│   └── endToEnd.test.ts
└── fixtures/
    ├── sampleRequests.json
    ├── expectedOutputs/
    └── testData/
```

### Test Data Management
- **Fixtures:** Sample requests and expected outputs matching exact SDDirect.md format
- **Mock Data:** Controlled test scenarios for all 7 transaction codes
- **Real Data:** Actual UK bank holiday dates for working day validation
- **Edge Cases:** Weekend dates, bank holidays, year boundaries, special transaction codes
- **Character Set Testing:** Validate allowed characters `A-Za-z0-9.&/- ` in all text fields
- **Field Order Testing:** Ensure CSV output matches exact field order from SDDirect.md

### Continuous Testing
- Run tests on every code change
- Coverage reporting with Vitest
- Integration with build process

## 🚀 Deployment Preparation

### Build Configuration
**Tasks:**
- [ ] Configure production build with Vite
- [ ] Optimize bundle size
- [ ] Set up environment configuration
- [ ] Create startup scripts

### Docker Configuration (Optional)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3001
CMD ["node", "dist/app.js"]
```

### Environment Configuration
```bash
# .env.example
NODE_ENV=development
PORT=3001
LOG_LEVEL=info
OUTPUT_PATH=./output
```

## 📊 Development Workflow

### Daily Development Process
1. **Start with Tests:** Write failing tests first
2. **Implement Features:** Make tests pass with minimal code
3. **Refactor:** Improve code quality while maintaining tests
4. **Document:** Update documentation as needed
5. **Review:** Self-review for coding standards compliance

### Code Quality Gates
- All tests must pass
- 100% test coverage maintained
- No ESLint errors or warnings
- TypeScript strict mode compliance
- Performance targets met

### Git Strategy
- Feature branches for each major component
- Descriptive commit messages
- Regular commits with working functionality
- Clean merge history

## 🔍 Risk Mitigation

### Technical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Complex transaction code business rules | High | Comprehensive testing with all 7 codes and amount constraints |
| Working day calculations with special cases | High | Step-by-step testing with UK bank holiday data |
| Character set validation complexity | Medium | Regex validation and comprehensive character testing |
| Field order compliance with SDDirect.md | High | Interface matching and CSV format validation |
| File system permissions | Medium | Graceful error handling and validation |
| Memory usage with large files | Medium | Streaming approach and monitoring |
| Invalid data generation complexity | Medium | Step-by-step implementation and testing |

### Quality Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Insufficient test coverage | High | TDD approach and coverage monitoring |
| Performance degradation | Medium | Regular performance testing |
| Security vulnerabilities | High | Input validation and security review |

## 📈 Success Metrics

### Functional Metrics
- [ ] All API endpoints functional
- [ ] Correct file generation matching exact SDDirect.md field order
- [ ] All 7 transaction codes properly handled with business rules
- [ ] Amount constraints enforced for 0C/0N/0S transaction codes
- [ ] Character set validation for all text fields (`A-Za-z0-9.&/- `)
- [ ] Working day calculations accurate with UK bank holidays
- [ ] Payment reference validation (6-18 chars, no "DDIC", no all-same-chars)
- [ ] Realtime checksum patterns correctly implemented

### Quality Metrics
- [ ] 100% test coverage achieved
- [ ] Zero linting errors
- [ ] All TypeScript strict mode compliance
- [ ] Performance targets met

### User Experience Metrics
- [ ] Clear error messages
- [ ] Intuitive API design
- [ ] Comprehensive documentation
- [ ] Easy deployment process

## 🎯 Next Steps

1. **Phase 1 Kickoff:** Begin with project setup and infrastructure
2. **Daily Standups:** Track progress against timeline
3. **Code Reviews:** Ensure quality standards throughout
4. **Testing Gates:** No progression without passing tests
5. **Documentation:** Keep documentation current with implementation

---

**Implementation Plan Prepared By:** GitHub Copilot  
**Review Status:** Ready for Development  
**Estimated Timeline:** 14 days  
**Next Action:** Begin Phase 1 - Core Infrastructure Setup
