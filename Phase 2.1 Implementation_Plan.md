# Phase 2.1: EaziPay Implementation Plan

**Project:** DDCMS Direct File Creator - EaziPay Support  
**Version:** 1.1.0  
**Date:** July 21, 2025  
**Phase:** 2.1 - EaziPay Implementation  
**Duration:** 0.5 weeks (2-3 days)  
**Prerequisites:** Phase 1 & Phase 2 (Core Infrastructure & SDDirect) completed

## 📋 Executive Summary

This implementation plan details the specific tasks required to add EaziPay file format support to the existing DDCMS Direct File Creator application. EaziPay introduces unique requirements including multiple date formats, conditional field logic, and special trailer handling that require careful implementation.

## 🎯 Implementation Objectives

- **Primary Goal:** Add complete EaziPay file generation capability
- **Key Features:** Date format selection, EaziPayTrailer handling, header validation override
- **Quality:** Maintain 100% test coverage and zero linting errors
- **Integration:** Seamless integration with existing SDDirect functionality

## 🏗 Technical Architecture Changes

### New Components Required

1. **EaziPay File Generator** (`src/lib/fileType/eazipay.ts`)
2. **Date Format Handler** (`src/lib/utils/dateFormatter.ts`)
3. **EaziPay Validator** (`src/lib/validators/eazipayValidator.ts`)
4. **EaziPay Types** (extensions to `src/lib/types.ts`)

### Modified Components

1. **Factory Pattern** (`src/lib/fileType/factory.ts`) - Add EaziPay case
2. **Request Validator** (`src/lib/validators/requestValidator.ts`) - Header validation logic
3. **Main Types** (`src/lib/types.ts`) - Add dateFormat property
4. **File Writer** (`src/lib/fileWriter/fileWriter.ts`) - Extension selection logic

## 📊 Detailed Task Breakdown

### Task 1: Core Type Definitions (1 hour)

**File:** `src/lib/types.ts`

**Deliverables:**
- Add `dateFormat` property to Request interface
- Define `EaziPayDateFormat` union type
- Define `EaziPayTrailerFormat` type
- Add EaziPay-specific field interfaces

**Code Structure:**
```typescript
// New types to add
export type EaziPayDateFormat = "YYYY-MM-DD" | "DD-MMM-YYYY" | "DD/MM/YYYY";
export type EaziPayTrailerFormat = "quoted" | "unquoted";

export interface EaziPaySpecificFields {
  transactionCode: string;
  originatingSortCode: string;
  originatingAccountNumber: string;
  destinationSortCode: string;
  destinationAccountNumber: string;
  destinationAccountName: string;
  paymentReference: string;
  amount: number;
  fixedZero: 0;
  processingDate: string;
  empty: undefined;
  sunName: string;
  bacsReference: string;
  sunNumber?: string;
  eaziPayTrailer: string;
}

// Extend existing Request interface
export interface Request {
  // ... existing properties
  dateFormat?: EaziPayDateFormat; // EaziPay only
}
```

**Tests:**
- Type validation tests
- Interface compatibility tests

---

### Task 2: Date Format Handler (2 hours)

**File:** `src/lib/utils/dateFormatter.ts`

**Purpose:** Handle EaziPay-specific date formatting with multiple format options

**Deliverables:**
- Date format conversion functions
- Random format selection logic
- Luxon integration for date calculations

**Key Functions:**
```typescript
export class DateFormatter {
  static formatEaziPayDate(date: DateTime, format: EaziPayDateFormat): string;
  static getRandomDateFormat(): EaziPayDateFormat;
  static parseEaziPayFormat(formatString: string): EaziPayDateFormat;
  static validateDateFormat(format: string): boolean;
}
```

**Implementation Details:**
- `YYYY-MM-DD` → `2025-07-23`
- `DD-MMM-YYYY` → `23-JUL-2025` (uppercase month)
- `DD/MM/YYYY` → `23/07/2025`
- Random selection uses crypto.randomBytes for true randomness
- Consistent format across entire file

**Tests:**
- Format conversion accuracy
- Random selection distribution
- Edge cases (year boundaries, leap years)
- Invalid format handling

---

### Task 3: EaziPay Field Validator (2 hours)

**File:** `src/lib/validators/eazipayValidator.ts`

**Purpose:** Implement EaziPay-specific field validation rules

**Deliverables:**
- Fixed zero validation (always 0)
- Empty field validation (always undefined)
- SUN Number conditional logic
- EaziPayTrailer format validation

**Key Functions:**
```typescript
export class EaziPayValidator {
  static validateFixedZero(value: any): boolean;
  static validateEmptyField(value: any): boolean;
  static validateSunNumber(sunNumber: any, transactionCode: string): boolean;
  static validateEaziPayTrailer(trailer: string): EaziPayTrailerFormat;
  static generateValidTrailer(format: EaziPayTrailerFormat): string;
}
```

**Validation Rules:**
- **Fixed Zero:** Must be exactly number `0`
- **Empty Field:** Must be `undefined` (not empty string or null)
- **SUN Number:** If Transaction Code ≠ (0C, 0N, 0S) → must be null/undefined
- **EaziPayTrailer:** Must be `",,,,,,,,"` (quoted) or `,,,,,,,,,` (unquoted)

**Tests:**
- Valid/invalid value testing for each field
- Transaction code conditional logic
- Trailer format validation
- Edge cases and boundary conditions

---

### Task 4: EaziPay File Generator (3 hours)

**File:** `src/lib/fileType/eazipay.ts`

**Purpose:** Core EaziPay file generation logic

**Deliverables:**
- EaziPay-specific data generation
- Field ordering and CSV formatting
- Column count logic (15 vs 23)
- Integration with existing validation

**Class Structure:**
```typescript
export class EaziPayGenerator implements FileGenerator {
  private dateFormat: EaziPayDateFormat;
  private trailerFormat: EaziPayTrailerFormat;
  
  constructor(request: Request);
  
  generateFile(): Promise<GeneratedFile>;
  private generateRow(isValid: boolean): EaziPaySpecificFields;
  private formatRow(fields: EaziPaySpecificFields): string;
  private getColumnCount(): number; // 15 or 23
  private generateTrailer(): string;
  private generateProcessingDate(): string;
}
```

**Implementation Details:**
- **Field Order:** Exact sequence per specification (15 fields)
- **No Headers:** Always headerless regardless of request
- **Extension:** Random selection between .csv and .txt
- **Date Consistency:** Same format for all dates in file
- **Trailer Logic:** Random selection of quoted/unquoted format

**Tests:**
- File generation with all date formats
- Column count validation (15/23)
- Field ordering accuracy
- Invalid data generation
- Edge cases (empty rows, boundary values)

---

### Task 5: Request Validator Enhancement (1 hour)

**File:** `src/lib/validators/requestValidator.ts`

**Purpose:** Add header validation logic for different file types

**Changes Required:**
- Validate `includeHeaders` based on `fileType`
- Silently override for EaziPay and Bacs18PaymentLines
- Add `dateFormat` validation for EaziPay requests

**New Validation Logic:**
```typescript
export class RequestValidator {
  // ... existing methods
  
  static validateHeaderSupport(request: Request): Request {
    const headerSupportedTypes = ['SDDirect', 'Bacs18StandardFile'];
    
    if (!headerSupportedTypes.includes(request.fileType) && request.includeHeaders) {
      // Silently override to false for EaziPay and Bacs18PaymentLines
      return { ...request, includeHeaders: false };
    }
    
    return request;
  }
  
  static validateDateFormat(request: Request): boolean {
    if (request.fileType === 'EaziPay' && request.dateFormat) {
      const validFormats = ['YYYY-MM-DD', 'DD-MMM-YYYY', 'DD/MM/YYYY'];
      return validFormats.includes(request.dateFormat);
    }
    return true;
  }
}
```

**Tests:**
- Header validation for all file types
- Date format validation
- Silent override behavior
- Invalid format rejection

---

### Task 6: Factory Pattern Extension (30 minutes)

**File:** `src/lib/fileType/factory.ts`

**Purpose:** Add EaziPay to the factory pattern

**Changes Required:**
```typescript
export class FileGeneratorFactory {
  static create(request: Request): FileGenerator {
    switch (request.fileType) {
      case 'SDDirect':
        return new SDDirectGenerator(request);
      case 'EaziPay':
        return new EaziPayGenerator(request);
      // ... other cases
      default:
        throw new Error(`Unsupported file type: ${request.fileType}`);
    }
  }
}
```

**Tests:**
- Factory creation for EaziPay
- Error handling for invalid types
- Integration with existing patterns

---

### Task 7: File Writer Enhancement (1 hour)

**File:** `src/lib/fileWriter/fileWriter.ts`

**Purpose:** Add random file extension selection for EaziPay

**Changes Required:**
- Extension selection logic based on file type
- Update filename generation for EaziPay column count

**New Logic:**
```typescript
export class FileWriter {
  // ... existing methods
  
  private getFileExtension(fileType: string): string {
    switch (fileType) {
      case 'SDDirect':
        return '.csv';
      case 'EaziPay':
        return Math.random() < 0.5 ? '.csv' : '.txt';
      case 'Bacs18PaymentLines':
        return '.txt';
      case 'Bacs18StandardFile':
        return '.bacs';
      default:
        return '.csv';
    }
  }
  
  private getColumnCount(fileType: string, data: any): string {
    if (fileType === 'EaziPay') {
      // Check if trailer is quoted (15) or unquoted (23)
      return data.trailerFormat === 'quoted' ? '15' : '23';
    }
    // ... existing logic for other types
  }
}
```

**Tests:**
- Extension randomization
- Column count accuracy
- Filename generation

---

### Task 8: Integration Testing (2 hours)

**Purpose:** Comprehensive testing of EaziPay integration

**Test Scenarios:**
1. **Basic EaziPay Generation**
   - Default request with EaziPay fileType
   - Verify file structure and content
   - Check filename format

2. **Date Format Testing**
   - Test all three date formats
   - Verify format consistency
   - Test random format selection

3. **Trailer Format Testing**
   - Test quoted trailer (15 columns)
   - Test unquoted trailer (23 columns)
   - Verify column count in filename

4. **Header Override Testing**
   - Send includeHeaders: true with EaziPay
   - Verify headers are not included
   - Check NH in filename

5. **Invalid Data Generation**
   - Test hasInvalidRows: true
   - Verify SUN Number conditional logic
   - Test other validation rule violations

6. **Edge Cases**
   - Large row counts (1000+)
   - Boundary date values
   - Special transaction codes

**Files to Test:**
- `src/lib/fileType/eazipay.test.ts`
- `src/lib/utils/dateFormatter.test.ts`
- `src/lib/validators/eazipayValidator.test.ts`
- `src/index.test.ts` (integration)

---

## 🔧 Configuration Changes

### Environment Variables
No new environment variables required.

### Package Dependencies
No new dependencies required - leveraging existing Faker.js and Luxon.

## 🧪 Testing Strategy

### Unit Tests (Target: 100% Coverage)
- **Date Formatter:** All format conversions and edge cases
- **EaziPay Validator:** All validation rules and conditional logic
- **EaziPay Generator:** File generation and data accuracy
- **Request Validator:** Header validation and date format checking

### Integration Tests
- **API Endpoint:** Full EaziPay generation via API
- **File Output:** Verify actual file contents and structure
- **Error Handling:** Invalid requests and edge cases

### Performance Tests
- **Large Files:** 1000+ rows generation time
- **Memory Usage:** Ensure no memory leaks
- **Concurrent Requests:** Multiple EaziPay generations

## 📚 Documentation Updates

### Code Documentation
- JSDoc comments for all new functions
- Type definitions with descriptions
- Example usage in comments

### API Documentation
- Update request.http with EaziPay examples
- Add dateFormat parameter documentation
- Include EaziPay-specific examples

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Zero linting errors
- [ ] Code review completed
- [ ] Documentation updated

### Post-Deployment Verification
- [ ] API endpoint accepts EaziPay requests
- [ ] Files generate with correct structure
- [ ] Date formats work correctly
- [ ] Header validation works as expected
- [ ] Performance meets requirements (<2s for typical requests)

## 🎯 Success Criteria

1. **✅ Functional Completeness:**
   - EaziPay files generate correctly
   - All date formats supported
   - Header validation works
   - Trailer formats implemented

2. **✅ Quality Standards:**
   - 100% test coverage maintained
   - Zero linting errors
   - Performance requirements met

3. **✅ Integration:**
   - Seamless integration with existing code
   - No breaking changes to SDDirect functionality
   - Factory pattern properly extended

## 🕒 Timeline & Milestones

### Day 1 (4 hours)
- **Morning:** Tasks 1-2 (Types & Date Formatter)
- **Afternoon:** Task 3 (EaziPay Validator)

### Day 2 (4 hours)
- **Morning:** Task 4 (EaziPay Generator - Part 1)
- **Afternoon:** Task 4 (EaziPay Generator - Part 2)

### Day 3 (3 hours)
- **Morning:** Tasks 5-7 (Validator, Factory, File Writer)
- **Afternoon:** Task 8 (Integration Testing)

**Total Effort:** 11 hours across 3 days

## 🏆 Definition of Done

- [ ] All 8 tasks completed and tested
- [ ] EaziPay API requests generate valid files
- [ ] All three date formats work correctly
- [ ] Header validation prevents headers in EaziPay files
- [ ] Trailer formats generate correct column counts
- [ ] File extensions randomize between .csv and .txt
- [ ] 100% test coverage maintained
- [ ] Zero linting errors
- [ ] Integration tests pass
- [ ] Performance requirements met
- [ ] Documentation updated
- [ ] Code reviewed and approved

---

**Document Prepared By:** GitHub Copilot  
**Review Status:** Ready for Implementation  
**Next Action:** Begin Task 1 - Core Type Definitions

## 🕐 End Time: 10:45 BST
