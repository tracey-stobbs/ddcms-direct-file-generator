# Code Review → GitHub Issues Plan

This document enumerates actionable issues derived from `shiny palm tree/Code Review.md` and groups them by theme. Each item below maps 1:1 to a GitHub issue the script will create.

How to use

- Preferred: Run the script at `scripts/create-review-issues.sh` (requires GitHub CLI authenticated to this repo).
- Fallback: Copy any single issue’s Title/Body to create it manually on GitHub.

Labels

- Areas: testing, documentation, security, performance, ci-cd, code-quality, refactor, enhancement, devx, observability, process
- Priority: P1 (high), P2 (medium), P3 (low)

---

## Structure & Organization

1) Establish config directory and env config pattern [P2, enhancement, devx]
- Title: Establish /config and environment-specific configuration pattern
- Acceptance
  - `/config` module exists with typed getConfig()
  - Env validation with Zod/Envalid
  - Local, dev, test, prod profiles supported

2) Domain-driven src structure (services/models/controllers) [P2, refactor, code-quality]
- Title: Restructure src into domain-driven modules (services, models, controllers)
- Acceptance
  - Folder structure documented and implemented for one representative domain
  - Migration guide for incremental adoption

3) Interfaces vs types consistency policy [P3, code-quality]
- Title: Enforce consistent use of interfaces vs types across codebase
- Acceptance
  - Policy documented
  - ESLint rule(s) or lint docs to enforce guidance

4) Path aliases in tsconfig [P3, enhancement, devx]
- Title: Add path aliases to tsconfig and refactor imports
- Acceptance
  - tsconfig.json paths defined (e.g., @app/*)
  - A few modules refactored to use aliases

5) Document complex type definitions [P3, documentation, code-quality]
- Title: Add inline docs for complex/advanced type definitions
- Acceptance
  - JSDoc or MD notes for tricky types

## Testing

6) Integration tests for API endpoints [P1, testing]
- Title: Add integration tests for API endpoints (Vitest)
- Acceptance
  - Spin up minimal app context
  - Cover 1–2 core endpoints incl. error cases

7) Coverage reporting & CI threshold [P2, testing, ci-cd]
- Title: Enable coverage reporting and add CI coverage threshold
- Acceptance
  - vitest --coverage enabled
  - Threshold gate in CI

8) E2E tests for critical flows [P3, testing]
- Title: Add E2E tests for critical user journeys
- Acceptance
  - 1–2 journeys automated (Playwright/Cypress)

## Documentation

9) Module-level READMEs [P3, documentation]
- Title: Add module-level README files with purpose and usage

10) JSDoc for public APIs [P3, documentation, code-quality]
- Title: Add JSDoc comments for public APIs

11) API docs (OpenAPI/Swagger) [P2, documentation, enhancement]
- Title: Generate and publish API documentation (OpenAPI/Swagger)

## Code Quality

12) Pre-commit hooks (husky + lint-staged + prettier) [P2, devx, code-quality, ci-cd]
- Title: Add pre-commit hooks for linting/formatting

13) Complexity/static analysis [P3, code-quality]
- Title: Add complexity metrics and static analysis
- Notes: eslint complexity, dependency-cruiser, ts-prune

14) Error handling standardization [P2, code-quality, refactor]
- Title: Standardize error handling (error types, handler/middleware)

## Security

15) Input validation for endpoints [P1, security]
- Title: Implement input validation for all API endpoints
- Notes: zod/ajv schemas + centralized validation

16) Security scanning in CI [P1, security, ci-cd]
- Title: Add security scanning (npm audit, CodeQL) to CI pipeline

17) Rate limiting for API endpoints [P2, security, performance]
- Title: Add rate limiting middleware for API endpoints

## Performance & Observability

18) Performance metrics & instrumentation [P2, performance, observability]
- Title: Add performance metrics and instrumentation (pino + OpenTelemetry/Prometheus)

19) Caching strategy for hot paths [P3, performance, enhancement]
- Title: Introduce caching strategy for frequent operations

20) Profiling setup [P3, performance]
- Title: Add profiling setup (clinic.js) and a short guide

## CI/CD & Deployment

21) CI pipeline completeness [P1, ci-cd]
- Title: Ensure CI builds, lints, tests, and publishes coverage badges

22) Deployment docs and rollback [P2, documentation, ci-cd]
- Title: Add deployment documentation and rollback strategy

## Typing & DX

23) Enhanced typing with utility types/generics [P3, code-quality, enhancement]
- Title: Add utility types to reduce duplication, improve safety

24) Logging & monitoring improvements [P2, observability]
- Title: Improve structured logging and monitoring defaults

25) VS Code debug configs & dev container [P2, devx]
- Title: Add VS Code debug configurations and Dev Container

## Process

26) Tech debt backlog process [P3, process, documentation]
- Title: Establish tech debt backlog process and labels

---

Traceability to the review

- All items above come directly from sections “Areas for Improvement”, “Recommendations”, and “Next Steps” in `Code Review.md`.
