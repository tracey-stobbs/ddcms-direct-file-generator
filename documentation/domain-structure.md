# Domain Structure (P2 exemplar)

This repo is evolving toward a domain-driven layout. As a first step, EaziPay exports are re-exposed via `src/domains/eazipay` to provide a stable import path.

Why

-   Makes business domains explicit
-   Enables incremental refactors without breaking imports

Usage

-   Prefer importing EaziPay behaviors from `src/domains/eazipay` in new code:

```ts
import { generateValidEaziPayRow } from '../domains/eazipay';
```

Migration

-   Existing `src/lib/fileType/eazipay.ts` remains the source of truth.
-   Over time, we can move implementation under `src/domains/eazipay` and keep the re-export for backward compatibility until callers are updated.
