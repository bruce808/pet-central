---
name: build-pet-central
description: Drives iterative development of the Pet Central trusted marketplace. Use when building features, improving UI/UX, implementing backend modules, testing, or completing any work described in docs/spec.md. Applies to all apps (web-consumer, web-vendor, web-admin, web-partner, web-kiosk), packages (ui, database, auth, etc.), and the api-gateway. Includes complete testing and validation with correction loops until the system is fully functional.
---

# Build Pet Central — Iterative Development Skill

## How to use this skill

When the user asks to build, improve, test, or complete any part of Pet Central, follow this workflow. Always read the referenced files for current context before making changes.

## Phase System

Work is organized into phases. Always determine which phase the user wants, then follow its checklist. Track progress with todos.

### Phase 1: UI/UX Overhaul

Goal: Bring all frontend apps to a premium, production-quality UI/UX comparable to Chewy.com, Petfinder, Adopt-a-Pet, and other major pet platforms.

Read [ui-overhaul.md](ui-overhaul.md) for the full UI/UX improvement plan and follow its instructions.

### Phase 2: Backend Completion

Goal: Complete all API modules, database migrations, and business logic per spec.

Read [backend-plan.md](backend-plan.md) for the backend completion plan.

### Phase 3: Integration & Polish

Goal: Wire frontend to real APIs, add E2E tests, polish edge cases.

Read [integration-plan.md](integration-plan.md) for the integration plan.

### Phase 4: Complete Testing & Validation

Goal: Verify every part of the system works end-to-end. Find all errors, fix them, retest, and repeat until the system is fully functional with zero errors.

Read [testing-plan.md](testing-plan.md) for build validation (Steps 1-8) and manual review instructions.

Read [e2e-test-plan.md](e2e-test-plan.md) for the automated Playwright E2E test suite covering all 5 web apps (~205 tests across 41 spec files). This replaces the manual browser validation steps (9-10) with repeatable automated tests that click every button, fill every form, and verify every interactive element.

## Working Principles

### Before any change

1. Read `docs/spec.md` sections relevant to the feature
2. Read the existing code in the target app/package
3. Check `packages/ui/src/components/` for reusable components
4. Check `packages/types/src/` for shared type definitions

### Code standards

- **TypeScript strict mode** everywhere
- **Tailwind CSS** for all styling — no inline styles, no CSS modules
- **Shared UI components** in `packages/ui` — create/extend before duplicating
- **TanStack Query** for all data fetching in frontend apps
- **App Router** patterns in all Next.js apps (server components by default, `"use client"` only when needed)
- **Responsive design** — mobile-first, test at 375px, 768px, 1024px, 1440px
- **Accessibility** — semantic HTML, ARIA labels, keyboard navigation, focus management

### When creating/modifying UI components

1. Check if the component exists in `packages/ui/src/components/`
2. If extending, maintain backward compatibility
3. Export from `packages/ui/src/index.ts`
4. Follow existing variant/size patterns (see Button, Badge for examples)
5. Use the brand color palette from `packages/ui/tailwind.config.ts`

### Iteration approach

- Work on one app or feature area at a time
- Complete each page/component fully before moving on
- After each significant change, verify with `pnpm build` in the affected workspace
- Use todos to track progress within multi-step work

### Mandatory correction loop (applies to ALL phases)

Every change must pass a **fix-until-clean loop**:

1. Make the change
2. Run the relevant validation command(s) — build, lint, type-check, test
3. If errors exist: read the error output, fix the root cause, go to step 2
4. **Do NOT move on until the validation passes with zero errors**
5. If a fix introduces new errors elsewhere, expand scope and repeat

This loop is non-negotiable. Never declare work complete while errors remain.

## Quick References

| Resource | Path |
|---|---|
| Full spec | `docs/spec.md` |
| Prisma schema | `packages/database/prisma/schema.prisma` |
| Shared UI components | `packages/ui/src/components/` |
| Shared types | `packages/types/src/` |
| Brand colors/theme | `packages/ui/tailwind.config.ts` |
| API gateway modules | `apps/api-gateway/src/modules/` |
| Consumer app | `apps/web-consumer/src/` |
| Vendor app | `apps/web-vendor/src/` |
| Admin app | `apps/web-admin/src/` |
| Partner app | `apps/web-partner/src/` |
| Kiosk app | `apps/web-kiosk/src/` |
