# Phase 3: Integration & Polish Plan

Goal: Wire frontends to real API endpoints, add E2E quality, and polish for production readiness.

## Execution Order

### 1. API Client Setup

For each frontend app, ensure:
- API client in `lib/api.ts` has typed functions matching every used endpoint
- TanStack Query hooks wrap all API calls with proper cache keys, stale times, and error handling
- Auth token management (cookie-based) works across all requests
- Optimistic updates where appropriate (favorites, messages)

### 2. Wire Each App

```
- [ ] web-consumer: auth flow, search, listings, org profiles, messaging, reviews, favorites, AI chat, resources
- [ ] web-vendor: auth, dashboard data, listings CRUD, messages, reviews, org management, documents, analytics
- [ ] web-admin: auth, dashboard stats, cases, moderation queue, org/user management, audit log
- [ ] web-partner: auth, dashboard, cases, validations, org profile
- [ ] web-kiosk: session management, discover, listings, AI guide, handoff
```

### 3. Real-Time Features

- WebSocket connection for messaging (typing indicators, new messages)
- In-app notification badge updates
- Live case status updates in admin/partner

### 4. Form Validation

- Client-side validation matching server DTOs
- Inline error display
- Debounced uniqueness checks (email, org name)

### 5. Error Handling

- Global error boundary per app
- Retry logic for transient failures
- Offline detection and queuing

### 6. SEO & Performance

- SSR for listing and org pages (web-consumer)
- Structured data / JSON-LD for pet listings
- Image optimization with next/image
- Bundle analysis and code splitting
- Lighthouse audit targeting 90+ scores

### 7. Testing

- Unit tests for shared packages
- Integration tests for API endpoints
- E2E tests for critical user journeys (registration, search, inquiry, review)
- Visual regression tests for UI components

### 8. Security Hardening

- CSRF protection verification
- Rate limiting on all public endpoints
- Input sanitization audit
- Dependency vulnerability scan
- CSP headers configuration
