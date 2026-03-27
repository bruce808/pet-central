# Phase 2: Backend Completion Plan

Goal: Complete all API modules, business logic, and data layer per `docs/spec.md`.

## Execution Order

Follow the build order from spec section 31. For each module:

1. Read the relevant spec sections
2. Review existing code in `apps/api-gateway/src/modules/<module>/`
3. Review Prisma schema in `packages/database/prisma/schema.prisma`
4. Implement/complete: controller → service → repository → guards → DTOs → tests
5. Verify with `pnpm build` in api-gateway workspace

## Module Checklist

```
- [ ] 1. Auth module — registration, login, logout, email/phone verification, CAPTCHA, MFA, sessions
- [ ] 2. Users module — profile CRUD, preferences, favorites, saved searches
- [ ] 3. Organizations module — onboarding, profile, members, documents, verification status
- [ ] 4. Listings module — pet CRUD, media upload, status transitions, availability
- [ ] 5. Search module — OpenSearch indexing, faceted search, geosearch, ranking
- [ ] 6. Channels module — origin attribution, partner links, kiosk session tracking
- [ ] 7. Messaging module — conversations, messages, attachments, spam controls, org inbox
- [ ] 8. Reviews module — create, eligibility check, moderation pipeline, responses, disputes
- [ ] 9. Trust module — badges, scoring, enforcement rules, verification workflows
- [ ] 10. Cases module — intake, triage, assignment, SLA, notes, evidence, lifecycle
- [ ] 11. Content module — resources CRUD, publishing workflow, moderation
- [ ] 12. Moderation module — pipeline per content type, enforcement actions, audit
- [ ] 13. AI module — chat guidance, recommendations, correspondence, discovery scans
- [ ] 14. Admin module — dashboard stats, user/org management, bulk operations
- [ ] 15. Uploads module — signed URLs, scanning, storage management
- [ ] 16. Worker jobs — notification processing, search sync, trust scoring, AI enrichment
```

## Standards

- **DTOs**: Use `class-validator` decorators for all request validation
- **Auth guards**: Apply `@UseGuards(AuthGuard)` and `@Roles()` appropriately
- **Error handling**: Use NestJS exception filters, return consistent error shapes
- **Pagination**: Cursor-based or offset-based, consistent `{ data, meta }` response shape
- **Events**: Emit domain events via BullMQ for async processing (notifications, indexing, moderation)
- **Audit logging**: Log all write operations via the audit-log interceptor
- **Tests**: Unit tests for services, integration tests for critical flows
