# PetCentral — Trusted Pet Marketplace

A production-oriented, trust-first pet marketplace built as a monorepo using Next.js, TypeScript, NestJS, PostgreSQL, Prisma, Redis, OpenSearch, and S3-compatible storage.

## Architecture

```
apps/
  web-consumer/    → Consumer marketplace (Next.js, port 5000)
  web-vendor/      → Vendor portal (Next.js, port 5001)
  web-admin/       → Admin/trust portal (Next.js, port 5002)
  web-partner/     → Partner portal (Next.js, port 5003)
  web-kiosk/       → Kiosk interface (Next.js, port 5004)
  api-gateway/     → Backend API (NestJS, port 5100)
  worker-jobs/     → Async queue workers (BullMQ)
  ai-orchestrator/ → AI services (NestJS, port 5200)

packages/
  database/        → Prisma schema, client, migrations
  types/           → Shared TypeScript types, enums, DTOs
  auth/            → JWT, passwords, RBAC, MFA utilities
  ui/              → Shared React + Tailwind component library
  trust/           → Trust scoring, risk assessment, badge logic
  messaging/       → Spam detection, rate limits, safety checks
  search/          → OpenSearch client, index mappings, query builders
  partner-routing/ → Channel origin attribution, kiosk session management
  ai-core/         → AI provider abstraction (OpenAI + Anthropic), prompt registry
```

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker and Docker Compose

## Getting Started

### 1. Clone and install dependencies

```bash
pnpm install
```

### 2. Start infrastructure services

```bash
docker compose up -d
```

This starts PostgreSQL, Redis, OpenSearch, MinIO (S3-compatible), and MailHog.

| Service    | Port  | Dashboard         |
|------------|-------|-------------------|
| PostgreSQL | 5432  | —                 |
| Redis      | 6379  | —                 |
| OpenSearch | 9200  | —                 |
| MinIO      | 9000  | http://localhost:9001 |
| MailHog    | 1025  | http://localhost:8025 |

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your API keys for OpenAI and/or Anthropic if using AI features.

### 4. Set up database

```bash
pnpm db:generate    # Generate Prisma client
pnpm db:push        # Push schema to database
pnpm db:seed        # Seed with default roles, badges, and sample data
```

### 5. Start development servers

```bash
pnpm dev
```

This starts all apps in parallel via Turborepo.

Or start individual apps:

```bash
pnpm --filter @pet-central/api-gateway dev      # API on :5100
pnpm --filter @pet-central/web-consumer dev      # Consumer on :5000
pnpm --filter @pet-central/web-vendor dev        # Vendor on :5001
pnpm --filter @pet-central/web-admin dev         # Admin on :5002
pnpm --filter @pet-central/web-partner dev       # Partner on :5003
pnpm --filter @pet-central/web-kiosk dev         # Kiosk on :5004
pnpm --filter @pet-central/worker-jobs dev       # Queue workers
pnpm --filter @pet-central/ai-orchestrator dev   # AI services on :5200
```

## Roles and Access

| Role              | Access Level                                          |
|-------------------|-------------------------------------------------------|
| authenticated_user | Browse, message, review, favorite                    |
| vendor_member     | Manage listings and messages for their org            |
| vendor_admin      | Full org management, publish listings, manage members |
| validator         | View and work on assigned validation cases            |
| nonprofit_partner | View shared cases, submit validation decisions        |
| agency_partner    | View shared cases, submit validation decisions        |
| support_agent     | Case management, moderation, AI correspondence        |
| trust_analyst     | All support + badge management, verification decisions|
| moderator         | Content moderation across platform                    |
| admin             | Full system access                                    |

## API Endpoints

Base URL: `http://localhost:5100/api/v1`

### Public
- `POST /auth/register` — User registration
- `POST /auth/login` — Login
- `GET /listings` — Browse listings
- `GET /listings/:id` — Listing detail
- `GET /search/listings` — Full-text search with filters
- `GET /organizations/:id` — Organization profile
- `GET /resources` — Educational content

### Authenticated
- `POST /conversations` — Start conversation with vendor
- `POST /reviews` — Submit review
- `POST /ai/chat` — AI pet guidance
- `POST /uploads/signed-url` — Get upload URL

### Vendor
- `POST /vendor/organizations` — Create organization
- `POST /vendor/pets` — Create pet
- `POST /vendor/listings` — Create listing
- `POST /vendor/resources` — Publish content

### Admin
- `GET /admin/dashboard` — Dashboard stats
- `GET /admin/cases` — Case management
- `POST /admin/organizations/:id/badges` — Assign trust badges
- `POST /admin/organizations/:id/verification/decision` — Verification decisions
- `GET /admin/audit-log` — Audit trail

## Queue Workers

| Queue          | Purpose                                               |
|----------------|-------------------------------------------------------|
| moderation     | Content moderation (listings, reviews, messages)      |
| search-index   | OpenSearch index sync                                 |
| notifications  | Email, SMS, in-app notifications                      |
| ai-enrichment  | AI correspondence, entity scanning, AI moderation     |
| trust-scoring  | Trust score recalculation, badge eligibility           |

## AI Features

Dual-provider support (OpenAI + Anthropic) with:
- Pet guidance chat with RAG over platform content
- Personalized recommendations
- Correspondence drafting and auto-handling
- Entity discovery scanning
- Content moderation assistance
- Case summarization

All AI interactions are logged with prompt version, model, and input/output tracking.

## Key Design Decisions

- **Trust-first**: Search ranking, listing publication, and reviews are all constrained by verification state
- **RBAC**: Role-based access control with scoped permissions across all endpoints
- **Audit trail**: All state-changing actions logged to `audit_logs` table
- **Async moderation**: Content goes through BullMQ moderation pipeline before publication
- **Signed uploads**: All file uploads use presigned S3 URLs (never pass through the API)
- **Channel attribution**: Partner-linked traffic tracked from entry through conversion
- **AI auditability**: All AI outputs tracked with prompt version and model metadata

## Database

The Prisma schema includes 37 models covering:
- Identity (users, roles, sessions)
- Organizations and verification
- Pet listings and media
- Reviews and reputation
- Messaging
- Case management
- Partner network
- AI interactions and correspondence
- Channel attribution
- Audit logging

Run `pnpm db:studio` to browse the database with Prisma Studio.

## License

Proprietary — All rights reserved.
