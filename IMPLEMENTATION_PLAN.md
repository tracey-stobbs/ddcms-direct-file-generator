# IMPLEMENTATION_PLAN.md

## DDCMS Direct File Creator – Implementation Plan

**Start Time (BST):** 20 July 2025, 14:00 BST

---

## 1. Project Structure

- **/src**
  - **/lib**
    - `calendar.ts` (date/time utilities)
    - `fileType/` (file type-specific logic)
    - `output/` (file output logic)
    - `utils/` (shared utilities)
    - `validators/` (field-level validation)
  - `index.ts` (Express app entry point)
- **/documentation**
  - `ABOUT.md` (project description)
  - `field-level-validation.md` (validation rules)
  - `types.ts` (shared types)
  - `FileFormats/` (file format specs)
- **/output** (generated files)
- `request.http` (manual API testing, do not modify)

---

## 2. Core Requirements

- **Single API endpoint** (`/generate`): Accepts JSON, body optional, must match `Request` interface.
- **File Generation**: Generates files in a predefined format with random data, saved to disk.
- **File Naming**: Strictly follow `[FileType]_[COLUMNCOUNT]_x_[ROWS]_[HEADERS]_[VALIDITY]_[TIMESTAMP].[extension]`.
- **File Storage**: Use `outputPath` if provided, else default to `./output`.
- **Logging**: Log all incoming requests (with timestamp, endpoint, and request body), all errors (with stack trace and context), and all API responses (status and summary). Use structured, parseable log format.
- **Response**: On success, return full path/filename. On error, log details and return a clear, actionable summary message. All responses must be useful and informative for the client.
- **Extensibility**: Structure code to easily add new file types in the future.

---

## 3. Data Generation

- Use **faker.js** for random data.
- Use **luxon** for date/time.
- All non-header rows must follow field-level validation rules (see `field-level-validation.md`).
- If `hasInvalidRows` is true:
  - ~50% of rows must have 1–3 invalid fields (rounded down).
  - If `canInlineEdit` is true, max 49 errored rows.
- If `includeOptionalFields` is true, include all optional fields. If array, only those fields. If `defaultValues` is provided, use its data for all rows.

---

## 4. Type Safety & Linting

- All code in **TypeScript**.
- Use types from `types.ts` where possible.
- Enforce linting and formatting best practices.

---

## 5. Testing

- Use **Vitest** for unit tests.
- All code must be unit tested (tests live alongside code: `{filename}.test.ts`).
- Prioritize fixing failing tests over new code or linting.

---

## 6. Security & Best Practices

- No hardcoded passwords or secrets.
- Use safe, secure coding practices.
- Follow SOLID principles and modular design.
- Code must be self-documenting and maintainable.

---

## 7. Design Patterns

- Use **Strategy Pattern** for file type handling (easily add new file types).
- Use **Factory Pattern** for file generator instantiation.
- Use **Single Responsibility Principle** for all modules.

---

## 8. Implementation Steps

1. **Setup Project**: Initialize Node.js/TypeScript project, install dependencies (express, faker, luxon, vitest, linter).
2. **Define Types**: Ensure all types/interfaces are in `types.ts`.
3. **Implement Validation**: Build validators per `field-level-validation.md`.
4. **File Generators**: Implement SDDirect generator (Strategy), structure for future file types.
5. **Random Data Logic**: Use faker/luxon for data, handle optional/invalid fields logic.
6. **File Output**: Implement file writing logic, naming, and output path handling.
7. **API Endpoint**: Create `/generate` endpoint, validate input, call generator, return response.
8. **Error Handling**: Log errors, return summary messages.
9. **Unit Tests**: Write tests for all modules and edge cases.
10. **README**: Document usage, API, and contribution guidelines.

---

## 9. Extensibility & Maintenance

- All modules must be easily extendable for new file types and validation rules.
- Code must be modular, DRY, and follow best practices.

---

**End Time (BST):** _(To be filled on completion)_

---

:rocket: Ready to build a robust, maintainable, and extensible file generation API!
