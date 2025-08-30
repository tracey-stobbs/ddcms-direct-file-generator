# Documentation Index

Quick links to the main documents in this repository.

-   File Formats
    -   [SDDirect](./FileFormats/SDDirect.md) — CSV format and validation rules.
    -   [EaziPay](./FileFormats/EaziPay.md) — CSV/TXT format, date options, and special rules.
    -   [Bacs18PaymentLines](./FileFormats/Bacs18PaymentLines.md) — Fixed-width preview (DAILY/MULTI variants).
    -   [Bacs18StandardFile](./FileFormats/Bacs18StandardFile.md) — Planned format (notes and roadmap).
-   Schemas
    -   [Schemas README](./Schemas/README.md) — Ajv JSON Schemas for tools and APIs.
-   Validation & Specs
    -   [Field-level validation](./field-level-validation.md) — Cross-filetype validation specifications.
-   Deployment & Maintenance
    -   [Deployment](./deployment.md) — Deployment guidance and environment notes.
    -   [Dependabot](./dependabot.md) — Automated dependency update policy.
-   MCP Examples
    -   [MCP examples for Bacs18](./mcp-examples-bacs18.md) — JSON-RPC examples and notes.
-   Types
    -   [Shared types](./types.ts) — Shared type definitions for docs/examples.
-   Testing
    -   See project README → Testing for commands and policy; unit tests use Vitest.

If something seems out of date or duplicated, prefer the specific FileFormats page as the canonical spec and raise a PR to reconcile.
