# Backlog: Code Review Issues (with Traffic Lights)

Last updated: 2025-08-29

This turns the review outputs into a single, trackable backlog. Use the traffic lights to reflect current health of each open item.

Legend

-   🟢 Complete
-   🟠 In Progress
-   🔴 Not Started

How to use

-   Update the Status emoji as things change; optionally set Owner and Due.
-   Keep Acceptance criteria as the definition of done.
-   Labels: testing, documentation, security, performance, ci-cd, code-quality, refactor, enhancement, devx, observability, process
-   Priority: P1 (high), P2 (medium), P3 (low)

Assumption for initial status

-   P1 items start as 🟠 In Progress. P2/P3 start as 🔴 Not Started unless otherwise noted.

---

## Backlog summary

|  ID | Title                                       | Priority | Status | Areas                       |
| --: | ------------------------------------------- | :------: | :----: | --------------------------- |
|   1 | Establish /config and env config pattern    |    P2    |   🔴   | enhancement, devx           |
|   2 | Domain-driven src structure                 |    P2    |   🔴   | refactor, code-quality      |
|   3 | Interfaces vs types consistency policy      |    P3    |   🔴   | code-quality                |
|   4 | Path aliases in tsconfig                    |    P3    |   🔴   | enhancement, devx           |
|   5 | Document complex type definitions           |    P3    |   🔴   | documentation, code-quality |
|   6 | Integration tests for API endpoints         |    P1    |   �    | testing                     |
|   7 | Coverage reporting & CI threshold           |    P2    |   🟢   | testing, ci-cd              |
|   8 | E2E tests for critical flows                |    P3    |   🔴   | testing                     |
|   9 | Module-level READMEs                        |    P3    |   🔴   | documentation               |
|  10 | JSDoc for public APIs                       |    P3    |   🔴   | documentation, code-quality |
|  11 | API docs (OpenAPI/Swagger)                  |    P2    |   🔴   | documentation, enhancement  |
|  12 | Pre-commit hooks                            |    P2    |   🔴   | devx, code-quality, ci-cd   |
|  13 | Complexity/static analysis                  |    P3    |   🔴   | code-quality                |
|  14 | Error handling standardization              |    P2    |   🔴   | code-quality, refactor      |
|  15 | Input validation for endpoints              |    P1    |   �    | security                    |
|  16 | Security scanning in CI                     |    P1    |   �    | security, ci-cd             |
|  17 | Rate limiting for API endpoints             |    P2    |   🔴   | security, performance       |
|  18 | Performance metrics & instrumentation       |    P2    |   🔴   | performance, observability  |
|  19 | Caching strategy for hot paths              |    P3    |   🔴   | performance, enhancement    |
|  20 | Profiling setup                             |    P3    |   🔴   | performance                 |
|  21 | CI pipeline completeness                    |    P1    |   �    | ci-cd                       |
|  22 | Deployment docs and rollback                |    P2    |   🟢   | documentation, ci-cd        |
|  23 | Enhanced typing with utility types/generics |    P3    |   🟢   | code-quality, enhancement   |
|  24 | Logging & monitoring improvements           |    P2    |   🟢   | observability               |
|  25 | VS Code debug configs & dev container       |    P2    |   🟢   | devx                        |
|  26 | Tech debt backlog process                   |    P3    |   🟢   | process, documentation      |

---

## Backlog details

### Structure & Organization

1. Establish /config and environment-specific configuration pattern

-   Priority: P2
-   Status: � Not Started
-   Areas: enhancement, devx
-   Owner: Unassigned
-   Due: —
-   Acceptance
    -   `/config` module exists with typed getConfig()
    -   Env validation with Zod/Envalid
    -   Local, dev, test, prod profiles supported

2. Restructure src into domain-driven modules (services, models, controllers)

-   Priority: P2
-   Status: � Not Started
-   Areas: refactor, code-quality
-   Owner: Unassigned
-   Due: —
-   Acceptance
    -   Folder structure documented and implemented for one representative domain
    -   Migration guide for incremental adoption

3. Enforce consistent use of interfaces vs types across codebase

-   Priority: P3
-   Status: � Not Started
-   Areas: code-quality
-   Owner: Unassigned
-   Due: —
-   Acceptance
    -   Policy documented
    -   ESLint rule(s) or lint docs to enforce guidance

4. Add path aliases to tsconfig and refactor imports

-   Priority: P3
-   Status: � Not Started
-   Areas: enhancement, devx
-   Owner: Unassigned
-   Due: —
-   Acceptance
    -   tsconfig.json paths defined (e.g., @app/\*)
    -   A few modules refactored to use aliases

5. Add inline docs for complex/advanced type definitions

-   Priority: P3
-   Status: � Not Started
-   Areas: documentation, code-quality
-   Owner: Unassigned
-   Due: —
-   Acceptance
    -   JSDoc or MD notes for tricky types

### Testing

6. Add integration tests for API endpoints (Vitest)

-   Priority: P1
-   Status: � Complete
-   Areas: testing
-   Owner: Unassigned
-   Due: —
-   Acceptance
    -   Spin up minimal app context
    -   Cover 1–2 core endpoints incl. error cases

7. Enable coverage reporting and add CI coverage threshold

-   Priority: P2
-   Status: 🟢 Complete
-   Areas: testing, ci-cd
-   Owner: Unassigned
-   Due: —
-   Acceptance
    -   vitest --coverage enabled (see `vitest.config.ts`)
    -   Threshold gate enforced in CI (job runs `npm run test:coverage`)

8. Add E2E tests for critical user journeys

-   Priority: P3
-   Status: � Not Started
-   Areas: testing
-   Owner: Unassigned
-   Due: —
-   Acceptance
    -   1–2 journeys automated (Playwright/Cypress)

### Documentation

9. Add module-level README files with purpose and usage

-   Priority: P3
-   Status: � Not Started
-   Areas: documentation
-   Owner: Unassigned
-   Due: —

10. Add JSDoc comments for public APIs

-   Priority: P3
-   Status: � Not Started
-   Areas: documentation, code-quality
-   Owner: Unassigned
-   Due: —

11. Generate and publish API documentation (OpenAPI/Swagger)

-   Priority: P2
-   Status: � Not Started
-   Areas: documentation, enhancement
-   Owner: Unassigned
-   Due: —

### Code Quality

12. Add pre-commit hooks for linting/formatting (husky + lint-staged + prettier)

-   Priority: P2
-   Status: � Not Started
-   Areas: devx, code-quality, ci-cd
-   Owner: Unassigned
-   Due: —

13. Add complexity metrics and static analysis

-   Priority: P3
-   Status: � Not Started
-   Areas: code-quality
-   Owner: Unassigned
-   Due: —
-   Notes: eslint complexity, dependency-cruiser, ts-prune

14. Standardize error handling (error types, handler/middleware)

-   Priority: P2
-   Status: � Not Started
-   Areas: code-quality, refactor
-   Owner: Unassigned
-   Due: —

### Security

15. Implement input validation for all API endpoints

-   Priority: P1
-   Status: � Complete
-   Areas: security
-   Owner: Unassigned
-   Due: —
-   Notes: zod/ajv schemas + centralized validation

16. Add security scanning (npm audit, CodeQL) to CI pipeline

-   Priority: P1
-   Status: � Complete
-   Areas: security, ci-cd
-   Owner: Unassigned
-   Due: —

17. Add rate limiting middleware for API endpoints

-   Priority: P2
-   Status: � Not Started
-   Areas: security, performance
-   Owner: Unassigned
-   Due: —

### Performance & Observability

18. Add performance metrics and instrumentation (pino + OpenTelemetry/Prometheus)

-   Priority: P2
-   Status: � Not Started
-   Areas: performance, observability
-   Owner: Unassigned
-   Due: —

19. Introduce caching strategy for frequent operations

-   Priority: P3
-   Status: � Not Started
-   Areas: performance, enhancement
-   Owner: Unassigned
-   Due: —

20. Add profiling setup (clinic.js) and a short guide

-   Priority: P3
-   Status: � Not Started
-   Areas: performance
-   Owner: Unassigned
-   Due: —

### CI/CD & Deployment

21. Ensure CI builds, lints, tests, and publishes coverage badges

-   Priority: P1
-   Status: 🟠 In Progress
-   Areas: ci-cd
-   Owner: Unassigned
-   Due: —

22. Add deployment documentation and rollback strategy

-   Priority: P2
-   Status: � Not Started
-   Areas: documentation, ci-cd
-   Owner: Unassigned
-   Due: —

### Typing & DX

23. Add utility types to reduce duplication, improve safety

-   Priority: P3
-   Status: � Not Started
-   Areas: code-quality, enhancement
-   Owner: Unassigned
-   Due: —

24. Improve structured logging and monitoring defaults

-   Priority: P2
-   Status: � Not Started
-   Areas: observability
-   Owner: Unassigned
-   Due: —

25. Add VS Code debug configurations and Dev Container

-   Priority: P2
-   Status: � Not Started
-   Areas: devx
-   Owner: Unassigned
-   Due: —

### Process

26. Establish tech debt backlog process and labels

-   Priority: P3
-   Status: � Not Started
-   Areas: process, documentation
-   Owner: Unassigned
-   Due: —

-   All items above come directly from sections “Areas for Improvement”, “Recommendations”, and “Next Steps” in `Code Review.md`.

New item template

```
ID: <next number>
Title: <short actionable title>
Priority: P1|P2|P3
Status: 🟢|🟠|🔴
Areas: <labels from list>
Owner: <name>
Due: <YYYY-MM-DD or —>
Acceptance:
- <criterion>
- <criterion>
Notes:
- <optional context>
```
