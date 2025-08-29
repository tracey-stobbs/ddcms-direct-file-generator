#!/usr/bin/env bash
set -euo pipefail

# Creates GitHub issues derived from documentation/review-issues.md
# Prereqs: GitHub CLI (gh) authenticated with repo scope, and git remote origin set to the target repo.

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) not found. Install from https://cli.github.com/ and login with 'gh auth login'." >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "GitHub CLI isn't authenticated. Run: gh auth login" >&2
  exit 1
fi

# Repo detection
repo=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)
if [ -z "${repo}" ]; then
  echo "Unable to detect repo with 'gh repo view'. Ensure you're in the repo folder and 'origin' points to GitHub." >&2
  exit 1
fi

echo "Using repo: ${repo}" >&2

# Helper to create issues idempotently (skip if a title already exists)
create_issue() {
  local title="$1"
  local body="$2"
  local labels="$3"
  local exists
  exists=$(gh issue list --search "${title} in:title" --json title -q '.[].title' | grep -Fx "${title}" || true)
  if [ -n "${exists}" ]; then
    echo "Skip (exists): ${title}"
    return 0
  fi
  gh issue create --title "${title}" --body "${body}" --label ${labels}
  echo "Created: ${title}"
}

nl=$'\n'

# Structure & Organization
create_issue \
  "Establish /config and environment-specific configuration pattern" \
  "Introduce a typed configuration module with env var validation and per-environment overrides.${nl}${nl}Acceptance:${nl}- /config module with typed getConfig()${nl}- Env validation (Zod/Envalid)${nl}- Local/dev/test/prod profiles" \
  "enhancement,devx,P2"

create_issue \
  "Restructure src into domain-driven modules (services, models, controllers)" \
  "Adopt a domain-driven folder structure with clear module boundaries and migration guidance." \
  "refactor,code-quality,P2"

create_issue \
  "Enforce consistent use of interfaces vs types across codebase" \
  "Document policy and add lint guidance for when to prefer interface vs type." \
  "code-quality,P3"

create_issue \
  "Add path aliases to tsconfig and refactor imports" \
  "Define @app/* path aliases in tsconfig and refactor a few modules as examples." \
  "enhancement,devx,P3"

create_issue \
  "Add inline docs for complex/advanced type definitions" \
  "Add JSDoc/markdown notes to explain tricky types and their intent." \
  "documentation,code-quality,P3"

# Testing
create_issue \
  "Add integration tests for API endpoints (Vitest)" \
  "Create minimal app context and cover 1–2 core endpoints including error cases." \
  "testing,P1"

create_issue \
  "Enable coverage reporting and add CI coverage threshold" \
  "Enable vitest --coverage and set a coverage threshold gate in CI." \
  "testing,ci-cd,P2"

create_issue \
  "Add E2E tests for critical user journeys" \
  "Automate 1–2 critical flows using Playwright/Cypress." \
  "testing,P3"

# Documentation
create_issue \
  "Add module-level README files with purpose and usage" \
  "Create or update READMEs for key modules under src/ explaining responsibilities and usage." \
  "documentation,P3"

create_issue \
  "Add JSDoc comments for public APIs" \
  "Add/expand JSDoc on exported functions/classes to improve IDE hints and docs generation." \
  "documentation,code-quality,P3"

create_issue \
  "Generate and publish API documentation (OpenAPI/Swagger)" \
  "Define OpenAPI spec for endpoints and publish via swagger-ui or redoc." \
  "documentation,enhancement,P2"

# Code Quality
create_issue \
  "Add pre-commit hooks for linting/formatting" \
  "Add Husky + lint-staged + Prettier to enforce style and run lint on staged files." \
  "devx,code-quality,ci-cd,P2"

create_issue \
  "Add complexity metrics and static analysis" \
  "Introduce eslint complexity, dependency-cruiser diagrams, and ts-prune to find dead code." \
  "code-quality,P3"

create_issue \
  "Standardize error handling (error types, handler/middleware)" \
  "Define error types, normalize thrown errors, and centralize handling/mapping." \
  "code-quality,refactor,P2"

# Security
create_issue \
  "Implement input validation for all API endpoints" \
  "Use zod/ajv schemas and centralized validation middleware for request payloads." \
  "security,P1"

create_issue \
  "Add security scanning (npm audit, CodeQL) to CI pipeline" \
  "Integrate npm audit checks and GitHub CodeQL analysis into CI." \
  "security,ci-cd,P1"

create_issue \
  "Add rate limiting middleware for API endpoints" \
  "Add basic rate limiter (e.g., express-rate-limit) with sane defaults and env controls." \
  "security,performance,P2"

# Performance & Observability
create_issue \
  "Add performance metrics and instrumentation" \
  "Instrument with pino logging and OpenTelemetry/Prometheus metrics for critical operations." \
  "performance,observability,P2"

create_issue \
  "Introduce caching strategy for frequent operations" \
  "Identify hot paths and add caching (in-memory/Redis) with invalidation strategy." \
  "performance,enhancement,P3"

create_issue \
  "Add profiling setup and short guide" \
  "Add clinic.js or node --prof setup and a short how-to doc to profile workloads." \
  "performance,P3"

# CI/CD & Deployment
create_issue \
  "Ensure CI builds, lints, tests, and publishes coverage badges" \
  "Audit CI to ensure full pipeline coverage with artifacts and status badges." \
  "ci-cd,P1"

create_issue \
  "Add deployment documentation and rollback strategy" \
  "Document deployment steps, env requirements, and rollback/quick-restore procedures." \
  "documentation,ci-cd,P2"

# Typing & DX
create_issue \
  "Add utility types to reduce duplication and improve safety" \
  "Introduce shared utility types/generics where repeated patterns exist." \
  "code-quality,enhancement,P3"

create_issue \
  "Improve structured logging and monitoring defaults" \
  "Adopt pino config, log levels, correlation IDs, and minimal dashboards." \
  "observability,P2"

create_issue \
  "Add VS Code debug configurations and Dev Container" \
  "Provide .vscode/launch.json and .devcontainer/ for easy onboarding and parity." \
  "devx,P2"

# Process
create_issue \
  "Establish tech debt backlog process and labels" \
  "Create labels, a template, and a weekly triage cadence for tech debt items." \
  "process,documentation,P3"

