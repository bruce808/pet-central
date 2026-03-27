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

## Step 9: Live Browser Validation — Every Page, Every App

**This is critical.** After the system is running, use the `browser-use` subagent to visit every page in every app and verify it actually loads and renders correctly in a real browser. Build passing is not enough — pages must render without client-side errors, blank screens, or broken layouts.

### How to execute

Use the `browser-use` Task subagent for each app. Start apps one at a time if needed to avoid port conflicts, or run them all via `pnpm dev`.

### 9a. web-consumer (http://localhost:5001)

Visit every page and verify it renders meaningful content (not a blank screen, not an unhandled error, not a raw stack trace):

| Route | What to verify |
|---|---|
| `/` | Homepage loads — hero section, featured listings/pets, navigation, footer |
| `/search` | Search page loads — filter sidebar or controls, results area (empty state OK if no data) |
| `/listings/[id]` | Pick any valid listing ID or verify the dynamic route handles a test ID gracefully (404 page or empty state, not a crash) |
| `/organizations/[id]` | Organization detail page loads or shows a clean empty/not-found state |
| `/auth/login` | Login form renders — email and password fields, submit button |
| `/auth/register` | Registration form renders — all required fields present |
| `/auth/verify-email` | Verify email page renders with appropriate messaging |
| `/favorites` | Favorites page loads (empty state if not logged in or no favorites) |
| `/messages` | Messages page loads (empty state or auth redirect) |
| `/settings` | Settings page loads (auth redirect or form fields) |
| `/resources` | Resources listing page loads |
| `/resources/[slug]` | Individual resource page loads or shows clean not-found |
| `/ai-assistant` | AI assistant page loads with chat interface or placeholder |

**For each page, check:**
1. No white/blank screen
2. No JavaScript console errors (uncaught exceptions, hydration mismatches)
3. Navigation header/footer renders consistently
4. Page-specific content area renders (even if showing empty states due to no seed data)
5. No broken images (missing src, 404 image URLs)
6. Interactive elements are visible (buttons, links, form inputs)

### 9b. web-vendor (http://localhost:5002)

| Route | What to verify |
|---|---|
| `/` | Vendor dashboard loads — summary stats or welcome state |
| `/auth/login` | Vendor login form renders |
| `/auth/register` | Vendor registration form renders |
| `/listings` | Listings management page loads — table or card grid, create button |
| `/listings/new` | New listing form renders — all pet detail fields |
| `/listings/[id]/edit` | Edit listing form renders or shows not-found for invalid ID |
| `/messages` | Vendor messages page loads |
| `/organization` | Organization profile page loads |
| `/organization/documents` | Documents upload/management page loads |
| `/organization/members` | Team members page loads |
| `/reviews` | Reviews page loads — list of reviews or empty state |
| `/analytics` | Analytics dashboard loads — charts or placeholder |
| `/resources` | Vendor resources page loads |

### 9c. web-admin (http://localhost:5003)

| Route | What to verify |
|---|---|
| `/` | Admin dashboard loads — key metrics, recent activity |
| `/auth/login` | Admin login form renders |
| `/users` | Users management table loads |
| `/organizations` | Organizations list/table loads |
| `/organizations/[id]` | Organization detail view loads or clean not-found |
| `/moderation` | Moderation queue page loads |
| `/cases` | Cases list page loads |
| `/cases/[id]` | Case detail page loads or clean not-found |
| `/partners` | Partners management page loads |
| `/audit-log` | Audit log page loads — table with filters |
| `/ai/discovery` | AI discovery page loads |
| `/ai/correspondence` | AI correspondence page loads |

### 9d. web-partner (http://localhost:5004)

| Route | What to verify |
|---|---|
| `/` | Partner dashboard loads |
| `/auth/login` | Partner login form renders |
| `/cases` | Assigned cases list loads |
| `/cases/[id]` | Case detail page loads or clean not-found |
| `/validations` | Validation tasks page loads |
| `/validations/[id]` | Validation detail page loads or clean not-found |
| `/members` | Organization members page loads |
| `/organization` | Partner organization profile loads |

### 9e. web-kiosk (http://localhost:5005)

| Route | What to verify |
|---|---|
| `/` | Kiosk home screen loads — touch-friendly UI, prominent CTAs |
| `/discover` | Pet discovery/browse page loads |
| `/listings/[id]` | Pet detail page loads or clean not-found |
| `/ai-guide` | AI guide interface loads |
| `/handoff` | Handoff/contact page loads |

### Correction loop for browser issues

When a page fails browser validation:

1. **Check the terminal** — look for server-side compilation errors or runtime exceptions
2. **Check the browser console** — look for client-side JS errors, hydration mismatches, failed fetches
3. **Identify the broken component** — trace the error to the specific component/import
4. **Fix the code** — resolve the issue at the source
5. **Reload the page** — verify the fix renders correctly
6. **Re-check neighboring pages** — the fix may affect shared layouts or components

**Common browser-time failures and fixes:**
- **Hydration mismatch** → ensure server and client render the same initial HTML; move browser-only APIs behind `useEffect` or `typeof window` checks
- **Module not found at runtime** → a package isn't properly exported or built; rebuild the dependency
- **"use client" missing** → component uses hooks/event handlers but isn't marked as a client component
- **Blank page with no error** → likely a server component that throws during data fetch; check server logs
- **TanStack Query errors** → ensure `QueryClientProvider` wraps the app in the root layout
- **Broken images/assets** → check that image paths are correct and public directory has required assets
- **Layout shift / completely unstyled** → Tailwind CSS not loading; check PostCSS config and Tailwind content paths

## Step 10: Functional Interaction Testing

Beyond page loads, verify that key interactive flows actually work. Use the `browser-use` subagent to perform these actions:

### Authentication flows
- [ ] Consumer: fill and submit registration form — form validates, submits, shows success or redirects
- [ ] Consumer: fill and submit login form — form validates, submits, session established or error shown
- [ ] Vendor: fill and submit registration form
- [ ] Vendor: fill and submit login form
- [ ] Admin: fill and submit login form
- [ ] Partner: fill and submit login form

### Navigation & routing
- [ ] Consumer: click navigation links — each nav item routes to the correct page without error
- [ ] Consumer: click a pet listing card from search results — navigates to listing detail page
- [ ] Consumer: use back/forward browser navigation — pages don't crash or show stale content
- [ ] Vendor: navigate between dashboard sections via sidebar/nav
- [ ] Admin: navigate between all admin sections
- [ ] Kiosk: navigate the touch-friendly flow from home → discover → listing detail → handoff

### Forms & inputs
- [ ] Vendor: open new listing form, fill out fields, verify client-side validation works (required fields, format validation)
- [ ] Consumer: use search filters — changing filters updates the results area (or shows loading/empty state)
- [ ] Consumer: test the favorites toggle (heart icon or similar) — button responds to click
- [ ] Admin: interact with data tables — sorting, filtering, pagination controls respond

### Responsive layout
- [ ] Consumer homepage at mobile width (375px) — no horizontal scroll, readable text, tappable buttons
- [ ] Consumer homepage at tablet width (768px) — layout adapts, no overflow
- [ ] Consumer homepage at desktop width (1440px) — full layout with sidebars/multi-column where expected

### Error states
- [ ] Visit a non-existent route (e.g., `/this-does-not-exist`) on each app — should show a 404 page or redirect, not crash
- [ ] Visit a dynamic route with an invalid ID (e.g., `/listings/nonexistent-id`) — should show not-found or empty state, not a stack trace

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
- [ ] Step 9: Browser validation — every page in every app loads
  - [ ] 9a: web-consumer (13 pages)
  - [ ] 9b: web-vendor (13 pages)
  - [ ] 9c: web-admin (12 pages)
  - [ ] 9d: web-partner (8 pages)
  - [ ] 9e: web-kiosk (5 pages)
- [ ] Step 10: Functional interaction testing
  - [ ] Authentication flows
  - [ ] Navigation & routing
  - [ ] Forms & inputs
  - [ ] Responsive layout
  - [ ] Error states
- [ ] Step 11: UI component audit
- [ ] Step 12: Final full-system validation (build + lint + browser re-check)
```

Mark each step complete only when it passes with **zero errors**. If a later step breaks an earlier one, go back and re-validate.
