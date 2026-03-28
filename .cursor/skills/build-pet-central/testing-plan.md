# Phase 4: Complete Testing & Validation Plan

Test every layer of Pet Central, fix all failures, and repeat until the entire system passes cleanly. **Never skip the correction loop.**

## Core Rule: Fix-Until-Clean

```
loop:
  1. Run validation command
  2. If errors → read output, fix root cause, goto 1
  3. If clean → move to next validation step
```

Apply this loop at every step below. Do not advance while errors remain.

## Step 1: TypeScript Compilation (all workspaces)

Run from monorepo root:

```bash
pnpm build
```

This triggers `turbo build` across all packages and apps. Fix every TS error before proceeding.

**Common fix patterns:**
- Missing/incorrect types → update `packages/types/src/`
- Import resolution → check `tsconfig.json` paths and package exports
- Strict null checks → add null guards or update types
- Missing module declarations → add to `*.d.ts` files

**Per-workspace isolation** — if the full build is too noisy, build one workspace at a time:

```bash
pnpm --filter @pet-central/database build
pnpm --filter @pet-central/types build
pnpm --filter @pet-central/auth build
pnpm --filter @pet-central/trust build
pnpm --filter @pet-central/messaging build
pnpm --filter @pet-central/search build
pnpm --filter @pet-central/partner-routing build
pnpm --filter @pet-central/ai-core build
pnpm --filter @pet-central/ui build
pnpm --filter @pet-central/api-gateway build
pnpm --filter @pet-central/web-consumer build
pnpm --filter @pet-central/web-vendor build
pnpm --filter @pet-central/web-admin build
pnpm --filter @pet-central/web-partner build
pnpm --filter @pet-central/web-kiosk build
pnpm --filter @pet-central/ai-orchestrator build
pnpm --filter @pet-central/worker-jobs build
```

Build order matters — packages before apps. Fix each workspace clean before moving to the next.

## Step 2: Linting (all workspaces)

```bash
pnpm lint
```

Fix all lint errors. Use `ReadLints` in the IDE for per-file diagnostics on recently edited files.

**Do not disable lint rules to pass.** Fix the underlying issue instead.

## Step 3: Prisma Schema & Database

```bash
pnpm db:generate
```

Verify the Prisma client generates without errors. If the schema has changed:

```bash
pnpm db:push
```

Then rebuild packages that depend on `@pet-central/database`:

```bash
pnpm --filter @pet-central/api-gateway build
```

Confirm the schema matches `docs/spec.md` data model expectations.

## Step 4: API Gateway — Module-by-Module Verification

For each module in `apps/api-gateway/src/modules/`:

1. Read the module's controller, service, and DTOs
2. Verify all endpoints match `docs/spec.md` API definitions
3. Check that DTOs have proper `class-validator` decorators
4. Verify service methods handle error cases (not found, unauthorized, validation)
5. Confirm NestJS module imports/exports are correct
6. Build and verify: `pnpm --filter @pet-central/api-gateway build`

**Module checklist** (track with todos):

- [ ] Auth module (login, register, session, password reset)
- [ ] Users module (profiles, settings, roles)
- [ ] Pets module (CRUD, search, media upload)
- [ ] Listings module (marketplace listings, pricing)
- [ ] Orders module (checkout, payment, fulfillment)
- [ ] Reviews module (ratings, trust scores)
- [ ] Messages module (conversations, notifications)
- [ ] Partners module (shelters, rescues, breeders)
- [ ] Admin module (moderation, analytics, config)
- [ ] Health module (readiness, liveness probes)

## Step 5: Frontend Apps — Page-by-Page Verification

For each app, verify every page/route builds and renders correctly.

### 5a. Start the dev server

```bash
pnpm --filter @pet-central/web-consumer dev
```

### 5b. Check each page compiles

Watch the terminal for build errors as pages are loaded. Fix any compilation errors immediately.

### 5c. Verify page structure matches spec

For each route defined in `docs/spec.md`:

1. Confirm the route file exists in the app's `src/app/` directory
2. Confirm the page component renders the expected UI sections
3. Confirm client components are marked `"use client"` when needed
4. Confirm server components don't use client-only APIs (useState, useEffect, onClick, etc.)

### 5d. Repeat for all frontend apps

| App | Port | Filter |
|-----|------|--------|
| web-consumer | 5001 | `@pet-central/web-consumer` |
| web-vendor | 5002 | `@pet-central/web-vendor` |
| web-admin | 5003 | `@pet-central/web-admin` |
| web-partner | 5004 | `@pet-central/web-partner` |
| web-kiosk | 5005 | `@pet-central/web-kiosk` |

## Step 6: Package-Level Validation

For each package in `packages/`, verify exports and internal consistency:

1. **types** — all shared interfaces/types compile; no circular imports
2. **database** — Prisma schema generates; exports PrismaClient correctly
3. **auth** — auth utilities export correctly; session types match spec
4. **trust** — trust score calculations match spec logic
5. **messaging** — message types and helpers are correct
6. **search** — search utilities compile and export
7. **partner-routing** — routing logic matches partner types in spec
8. **ai-core** — AI integration types/helpers compile
9. **ui** — all components export from `index.ts`; no missing dependencies

For each:

```bash
pnpm --filter @pet-central/<package> build
```

## Step 7: Cross-Workspace Import Validation

Verify no workspace has broken imports to other workspaces:

1. Build the full monorepo: `pnpm build`
2. If errors reference missing exports from a package, fix the package's `index.ts` or `package.json` exports field
3. If errors reference types from `@pet-central/types` that don't exist, add them to the types package first

## Step 8: Runtime Startup Verification

Start the full system and verify all services boot cleanly:

```bash
pnpm dev
```

Check that each service starts without crash:

- API gateway starts on its configured port
- Each Next.js app compiles its index page
- No unhandled promise rejections or module-not-found errors in terminal output

If any service crashes on startup, fix the root cause and restart.

## Step 9: Automated E2E Browser Testing — Every Page, Every App

**This is critical.** After the system is running, use the automated Playwright E2E test suite to verify every page loads and every interactive element works.

See **[e2e-test-plan.md](e2e-test-plan.md)** for the complete automated test plan with ~205 tests across all 5 web apps.

### How to execute

```bash
# Run all E2E tests (starts dev servers automatically)
pnpm test:e2e

# Run one app at a time
npx playwright test --project=consumer
npx playwright test --project=vendor
npx playwright test --project=admin
npx playwright test --project=partner
npx playwright test --project=kiosk

# Run responsive tests
npx playwright test --project=consumer-mobile
npx playwright test --project=consumer-tablet

# Debug failures interactively
pnpm test:e2e:ui
```

The E2E suite covers:
- **Every page route** in all 5 apps (50+ pages)
- **Every interactive element**: buttons, form fields, selects, checkboxes, sliders, tabs, modals, drag-drop zones
- **Multi-step wizards**: vendor registration, listing creation, kiosk discovery
- **Navigation**: sidebar links, breadcrumbs, back/forward, category pills
- **Responsive layout**: mobile (375px), tablet (768px), desktop (1440px)
- **Error states**: 404 pages, invalid IDs, blank screen detection
- **Form validation**: required fields, password matching, empty submits

### Correction loop for E2E failures

### Correction loop for E2E failures

When a test fails:

1. **Check the Playwright HTML report** — `npx playwright show-report`
2. **Check screenshots** — in `test-results/` for visual failures
3. **Check traces** — step-by-step replay of what happened
4. **Identify the broken component** — trace the error to the specific component/import
5. **Fix the application code** — resolve the issue at the source (not by modifying the test, unless the selector is wrong)
6. **Re-run the failing test** — `npx playwright test --grep "test name"`
7. **Re-run the full suite** — to catch regressions

**Common E2E failures and fixes:**
- **Hydration mismatch** → ensure server and client render the same initial HTML; move browser-only APIs behind `useEffect` or `typeof window` checks
- **Module not found at runtime** → a package isn't properly exported or built; rebuild the dependency
- **"use client" missing** → component uses hooks/event handlers but isn't marked as a client component
- **Blank page with no error** → likely a server component that throws during data fetch; check server logs
- **TanStack Query errors** → ensure `QueryClientProvider` wraps the app in the root layout
- **Broken images/assets** → check that image paths are correct and public directory has required assets
- **Layout shift / completely unstyled** → Tailwind CSS not loading; check PostCSS config and Tailwind content paths
- **Element not found** → selector may need updating if component structure changed; update the test selector

## Step 10: (Covered by automated E2E tests above)

The functional interaction tests (auth flows, navigation, forms, responsive layout, error states) are all included in the automated Playwright E2E suite. See [e2e-test-plan.md](e2e-test-plan.md) for the complete test inventory.

## Step 11: Shared UI Component Audit

For every component in `packages/ui/src/components/`:

1. Verify it's exported from `packages/ui/src/index.ts`
2. Verify it accepts the props defined in its interface
3. Verify it uses Tailwind classes (no inline styles or CSS modules)
4. Verify it supports the variant/size patterns used by sibling components
5. Build: `pnpm --filter @pet-central/ui build`

## Step 12: Final Full-System Validation

Run the complete validation sequence in order. **All must pass with zero errors:**

```bash
pnpm db:generate
pnpm build
pnpm lint
```

Then start the system and re-run browser validation on any pages that were fixed during earlier steps:

```bash
pnpm dev
```

Verify all previously-failing pages now render cleanly.

If any step fails, fix and re-run **from that step forward** (not just the failing step — downstream steps may be affected).

## Correction Loop Protocol

When you encounter errors at any step:

1. **Read the full error output** — don't guess from partial messages
2. **Identify the root cause** — not just the symptom file, but the actual source of the problem
3. **Fix at the source** — if a type is wrong in `packages/types`, fix it there, not with `as any` casts downstream
4. **Check for ripple effects** — a type change in `packages/types` may break consumers in multiple apps
5. **Re-run validation** — confirm the fix resolved the error without introducing new ones
6. **Track fixes with todos** — for multi-error scenarios, create a todo per error group and mark them off

### Things that are NEVER acceptable as "fixes"

- `// @ts-ignore` or `// @ts-expect-error` to silence type errors
- `as any` type casts to bypass type checking
- `eslint-disable` comments to skip lint rules
- Deleting test files to avoid test failures
- Commenting out broken code
- Empty catch blocks that swallow errors

### When errors cascade

If fixing one error reveals 10 more, stop and assess:

1. Is there a shared root cause? (e.g., a schema change that ripples everywhere)
2. Fix the shared root cause first
3. Then address remaining errors in dependency order (packages → apps)

## Progress Tracking

Use todos to track testing progress. Example structure:

```
- [ ] Step 1: TypeScript compilation — all workspaces
- [ ] Step 2: Lint — all workspaces
- [ ] Step 3: Prisma schema & database
- [ ] Step 4: API gateway modules
- [ ] Step 5: Frontend apps — page-by-page build verification
- [ ] Step 6: Package-level validation
- [ ] Step 7: Cross-workspace imports
- [ ] Step 8: Runtime startup — all services boot cleanly
- [ ] Step 9: Automated E2E tests (Playwright) — ~205 tests across all apps
  - [ ] consumer: 65 tests (12 spec files)
  - [ ] vendor: 45 tests (9 spec files)
  - [ ] admin: 50 tests (9 spec files)
  - [ ] partner: 30 tests (6 spec files)
  - [ ] kiosk: 15 tests (5 spec files)
  - [ ] responsive: mobile + tablet
- [ ] Step 10: (Covered by automated E2E tests)
- [ ] Step 11: UI component audit
- [ ] Step 12: Final full-system validation (build + lint + E2E re-run)
```

Mark each step complete only when it passes with **zero errors**. If a later step breaks an earlier one, go back and re-validate.
