# Deployment and Rollback Guide (P2)

This guide documents how to deploy Shiny Palm Tree and roll back safely.

Environments

-   Development: ad-hoc local runs. Metrics and docs enabled by default.
-   Test/CI: Automated pipeline. Metrics enabled; docs optional.
-   Production: Long-running service. Rate limiting and metrics enabled.

Configuration

-   Managed via environment variables (see `src/config/index.ts`).
-   Key vars:
    -   NODE_ENV: development|test|production
    -   PORT: number (default 3001)
    -   ENABLE_RATE_LIMIT: true|false (default true)
    -   RATE_LIMIT_WINDOW_MS: number (default 60000)
    -   RATE_LIMIT_MAX: number (default 100)
    -   ENABLE_METRICS: true|false (default true)
    -   ENABLE_API_DOCS: true|false (default true)
    -   REQUEST_LOG_BODY: true|false (default false)

Deploy Steps

1. Build artifacts
    - CI runs `npm ci && npm run build && npm test` and publishes `dist/`.
2. Provision runtime
    - Ensure Node 22.x available; set environment vars above.
3. Start service
    - Run `node dist/index.js` behind your process manager (PM2/systemd/Container).
4. Health and metrics
    - Verify `/metrics` exposes Prometheus metrics when enabled.
5. Smoke test
    - POST to `/api/{sun}/{filetype}/valid-row` with `{ "numberOfRows": 1 }`.

Rollback

-   Strategy: Blue/Green or rolling with ability to pin previous image/artifact.
-   Steps:
    1. Identify last known good build artifact (tag or commit).
    2. Redeploy that artifact using same environment configuration.
    3. Validate with the same smoke test above.
    4. Monitor logs and metrics for anomalies.

Observability

-   Logs are structured JSON via `logger.ts`.
-   Prometheus metrics via `/metrics`. Add your scrape job to pull metrics.

Security

-   Rate limiting is enabled by default; tune via env.
-   No secrets are committed; inject via environment or your secret manager.

Notes

-   Keep changes small and reversible. Prefer feature flags when introducing risky behavior.
