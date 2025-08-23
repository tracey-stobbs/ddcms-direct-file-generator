Zod vs Yup

Here’s a concise, practical take:

Why Zod is preferred

TypeScript-first: infers types directly from schemas (no duplicate interfaces, no drift).
Strong unions and literals: great support for discriminated unions, tuples, records, enums, branded types.
Transform + refine: built-in preprocess/transform and refinements with correct inferred output types.
Predictable parsing APIs: parse/safeParse with clear sync/async behavior and a consistent error shape.
DX and portability: zero deps, works the same in Node/browser, tree-shakeable ESM.
Why not Yup

Weaker TS inference: types often need manual help and can drift from the runtime schema.
Limited unions/enums ergonomics: unions and discriminators are clunky compared to Zod.
Mutable builder pattern: harder to compose and reason about; side effects are easier.
Transforms/types mismatch: transformed output types aren’t inferred as cleanly.
Maintenance/modern TS: historically slower to align with TS-first patterns.
When Yup still makes sense

Legacy codebases or teams standardized on Formik+Yup.
Simple form validation where Yup’s builder style is already pervasive and good enough.
In this repo’s context

Zod lets you define MCP/HTTP payload schemas once and get precise handler types “for free,” especially for unions and transforms (less glue, fewer bugs).
