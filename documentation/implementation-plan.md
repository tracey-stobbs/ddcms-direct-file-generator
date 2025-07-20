# DDCMS Direct File Creator – Implementation Plan

🕒 BST Time Tracking:  
Start: 20 July 2025, 14:00 BST

---

## Implementation Plan

### 1. Project Structure

- `/src`
  - `/lib`
    - `fileGenerator.ts` (core logic for file generation)
    - `dataGenerator.ts` (random data generation, field validation)
    - `fileType/` (one module per file type, e.g., `SDDirect.ts`)
    - `utils/` (helpers: path, naming, error handling)
    - `types.ts` (shared types/interfaces)
    - `validators/` (field-level validation rules)
    - `output/` (default output directory)
  - `server.ts` (Express API entry point)
- `/tests`
  - Unit tests for all modules (using Vitest, colocated as `{filename}.test.ts`)
- `/documentation`
  - As provided

---

### 2. Core Modules & Responsibilities

#### a. Types & Interfaces (`types.ts`)
- Define all request/response types, enums, and interfaces.
- Import and extend from provided types where possible.

#### b. FileType Modules (`fileType/SDDirect.ts`)
- Each file type gets its own module/class.
- Encapsulate file structure, headers, and field logic.
- Follows Open/Closed Principle for easy extension.

#### c. Data Generation (`dataGenerator.ts`)
- Use faker.js for random data.
- Use luxon for date/time.
- Implement logic for valid/invalid row generation.
- Respect `optionalFields` and `includeOptionalFields` logic.

#### d. File Generation (`fileGenerator.ts`)
- Accepts request, delegates to correct fileType module.
- Handles file naming, output path, and writing to disk.
- Returns full file path.

#### e. Validation (`validators/`)
- Implement field-level validation rules.
- Used by data generator to ensure validity/invalidity as required.

#### f. Utilities (`utils/`)
- Path resolution, error handling, logging, etc.

#### g. API Server (`server.ts`)
- Express server with a single POST endpoint.
- Parses and validates request.
- Handles errors securely (no sensitive info in responses).
- Returns file path or error summary.

---

### 3. Security & Best Practices

- No hardcoded passwords or secrets.
- All file writes use safe paths (prevent path traversal).
- Input validation on all API requests.
- Graceful error handling and logging.

---

### 4. Testing

- Vitest for all modules.
- 100% coverage for:
  - Data generation (valid/invalid)
  - File naming and output
  - API endpoint (integration tests)
- No commented-out or disabled tests.

---

### 5. Extensibility

- New file types: add new module in `fileType/`, register in factory.
- New validation rules: add to `validators/`.

---

### 6. Design Patterns Used

- **Factory Pattern**: For selecting the correct file type generator based on request.
  - Why: Cleanly supports new file types without modifying existing logic.
- **Strategy Pattern**: For field-level validation and data generation strategies.
  - Why: Allows swapping in different validation/generation logic per field or file type.

---

### 7. Next Steps

1. Scaffold project structure and install dependencies (`express`, `faker`, `luxon`, `vitest`).
2. Implement types and interfaces.
3. Build file type module for `SDDirect` (MVP).
4. Implement data generator and validators.
5. Implement file generator and utilities.
6. Build and test Express API.
7. Write and run unit tests.
8. Document usage and contribution guidelines.

---

📄 File names and structure are provided above.  
👍 Let me know if you want a detailed breakdown or code scaffolding for any module!
