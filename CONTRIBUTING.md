# Contributing Guide

Thanks for contributing! This project uses TypeScript, Vitest, Zod, and JSON-RPC 2.0. Please follow the practices below for a smooth experience.

## Development workflow

- Create small, focused PRs.
- Keep code self-documenting, modular, and type-safe.
- Follow SOLID principles and avoid duplication (DRY).
- Use secure coding practices (no secrets in code, avoid hard-coded credentials, handle errors safely).

## Setup

1. Install dependencies

```sh
npm install
```

2. Run tests

```sh
npm test
```

3. Lint and format

```sh
npm run lint
npm run format:check
```

## Testing

- All code changes must include unit tests (Vitest).
- Keep tests fast and deterministic.
- Don’t add ad-hoc scripts for manual testing—cover functionality with tests.

## JSON-RPC error logging

The JSON-RPC server is quiet by default to keep tests/CLI noise-free. To enable logging, pass an `onError` listener to the router.

File: `src/mcp/jsonrpc.ts`

```ts
import { JsonRpcRouter } from './src/mcp/jsonrpc';

const router = new JsonRpcRouter({
    onError: (message, data) => {
        console.error(JSON.stringify({ level: 'error', message, data }));
    },
});
```

See README section: “JSON-RPC error logging”.

## Backlog progress dashboard

The progress dashboard in the backlog is generated automatically.

- Backlog file: `documentation/Phase 2 - MCP Server/DDCMS-Direct-MCP-Server-Backlog.md`
- Update dashboard:

```sh
npm run backlog:update
```

A pre-commit hook will auto-run the updater, then lint and tests.

Implementation:

- Parser/renderer: `src/tools/backlogProgress.ts`
- CLI: `scripts/backlog-progress.ts`

## Commit hooks

We use Husky to keep the repo healthy:

- Pre-commit: runs dashboard update, lint, tests

## Coding standards

- TypeScript everywhere; no `any` unless unavoidable, then narrow fast.
- ESLint + Prettier are mandatory.
- Avoid leaking sensitive data in logs; prefer structured JSON logs.
- Never attempt to kill Node.js processes; always use graceful shutdown.

## Questions

Open an issue or start a discussion if you’re unsure about anything.
