<!--
Sync Impact Report
- Version change: [TEMPLATE] → 1.0.0 (initial ratification)
- Modified principles: n/a (first adoption, all placeholders replaced)
- Added sections:
  - Core Principles: I. Next.js App Router + TypeScript, II. Unified JSON API Responses,
    III. No `any` Type
  - Technology Constraints (Section 2)
  - Quality Gates (Section 3)
  - Governance
- Removed sections: none
- Deferred/TODO placeholders: none
- Templates requiring follow-up: none checked in this run (constitution-only scope; plan/spec/
  tasks templates read this file at runtime and are not modified here)
-->

# mini-todo-sqlite Constitution

## Core Principles

### I. Next.js App Router + TypeScript
This project MUST be built with Next.js using the App Router (the `app/` directory) exclusively;
the legacy Pages Router (`pages/`) MUST NOT be introduced. All source files MUST be authored in
TypeScript (`.ts`/`.tsx`); plain JavaScript source files MUST NOT be added to `app/`, `lib/`, or
any other application source directory.
Rationale: The project was scaffolded on Next.js 16 with the App Router and a strict TypeScript
config (`tsconfig.json` has `"strict": true`). Standardizing on one routing model and one
language keeps the codebase consistent and lets the type system catch errors before runtime.

### II. Unified JSON API Responses
Every API route (route handlers under `app/api/**/route.ts` or equivalent) MUST respond with
`Content-Type: application/json`, on both success and error paths. Responses MUST follow one
consistent shape across all endpoints (the same envelope/field names for success and error
cases) rather than each route inventing its own format. Non-JSON responses (plain text, HTML
fragments, redirects used as an API result) MUST NOT be returned from API routes.
Rationale: A single, predictable response format lets any client (the app's own UI, tests, or
future integrations) parse API results without per-endpoint special-casing.

### III. No `any` Type (NON-NEGOTIABLE)
The `any` type MUST NOT appear anywhere in the codebase — no explicit `any` annotations, no
`as any` casts, and no implicit `any` left unaddressed. Where a type is genuinely unknown, use
`unknown` and narrow it before use; otherwise use precise interfaces, type aliases, or generics.
The `@typescript-eslint/no-explicit-any` lint rule (or equivalent) MUST be enabled and enforced
in CI/local linting so violations are caught automatically rather than relying on review alone.
Rationale: `any` silently disables type checking wherever it is used, defeating the purpose of
building this project in TypeScript and hiding bugs that the compiler would otherwise catch.

## Technology Constraints

The project's dependency baseline is Next.js (App Router) and TypeScript, as already reflected
in `package.json` and `tsconfig.json`. Any dependency or tool added to the project MUST be
compatible with this baseline — e.g., no libraries that require the Pages Router, and no
JavaScript-only tooling that cannot be typed. `tsconfig.json` MUST keep `"strict": true` enabled;
it MUST NOT be relaxed to accommodate untyped code.

## Quality Gates

Before code is merged: `next build` (or `tsc --noEmit`) MUST succeed with no type errors, and
`npm run lint` MUST pass with no `no-explicit-any` violations. Any API route added or changed
MUST be checked against Principle II (consistent JSON shape, correct `Content-Type`) as part of
review. These gates are enforced through the existing `lint` script and TypeScript compiler; no
separate tooling is assumed beyond what is already configured in this repository.

## Governance

This constitution supersedes any conflicting practice or prior informal convention in this
project. All PRs and code reviews MUST verify compliance with the Core Principles above;
non-compliant code (a Pages Router file, a non-JSON API response, an `any` type) MUST be fixed
before merge, not waived silently. Any exception MUST be recorded in the relevant PR description
with a stated reason, since this constitution's rules are otherwise non-negotiable.

Amendments to this constitution MUST be made by editing this file and following the same
Sync Impact Report process used to create it, with the version bumped per semantic versioning:
MAJOR for backward-incompatible principle removals or redefinitions, MINOR for new principles or
materially expanded guidance, PATCH for wording/clarification fixes. `LAST_AMENDED_DATE` MUST be
updated on every amendment; `RATIFICATION_DATE` MUST NOT change once set.

**Version**: 1.0.0 | **Ratified**: 2026-09-16 | **Last Amended**: 2026-09-16
