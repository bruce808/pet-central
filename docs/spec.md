# Trusted Pet Marketplace — Technical Design Document

**Implementation note:** This system should be developed in a **monorepo**. The runtime architecture may begin as a modular backend deployment, but the codebase organization should use a monorepo structure so frontend apps, backend services, shared UI libraries, shared types, infra code, AI components, and admin/trust tools can evolve together with strong reuse and consistent CI/CD.

## 1. Document Purpose

This document defines a technical design for building an online two-sided marketplace that helps people find pets from trusted sources, including breeders, pet shelters, humane societies, rescues, and related agencies. The design is intended to be implementation-ready for an engineering agent such as Cursor or Claude, and detailed enough to guide system architecture, database schema, APIs, moderation, trust, operations, and phased delivery.

The platform must support:

* **Demand side**: people searching for pets, messaging sources, writing reviews, saving favorites, requesting more information, and reporting issues.
* **Supply side**: breeders, shelters, humane societies, rescues, and approved pet sources managing listings, profiles, trust credentials, educational content, and customer interactions.
* **Trust network**: support staff, validators, contractors, nonprofit partners, and local agencies who help review vendors, investigate complaints, verify credentials, and manage compliance issues.
* **Trust and anti-abuse**: strong authentication and anti-bot defenses to reduce spam, fake listings, fraudulent reviews, and AI-generated abuse.

The platform is not simply a classifieds board. It is a **trust-oriented marketplace** where entity verification, review integrity, messaging safety, and issue escalation are central product capabilities.

---

## 2. Product Goals

### 2.1 Primary goals

1. Enable users to discover pets from trustworthy sources.
2. Provide high-quality, structured pet information for dogs, cats, birds, and extensible support for future categories.
3. Create a two-sided marketplace with communication, inquiry, feedback, and reputation systems.
4. Build a trust and validation layer that surfaces confidence signals on vendors and listings.
5. Support nonprofits, humane societies, and agencies as ecosystem participants rather than only as listing sources.
6. Reduce spam, scams, fake reviews, and automated abuse through identity, rate limits, fraud controls, and moderation.

### 2.2 Secondary goals

1. Provide educational content and care tips from trusted organizations.
2. Support localized operations by region, city, and jurisdiction.
3. Offer internal workflows for support staff and third-party validators.
4. Allow phased rollout with a practical MVP path.

### 2.3 Non-goals for MVP

1. Full veterinary records exchange.
2. Insurance underwriting.
3. Real-time payment escrow.
4. Transportation/logistics marketplace.
5. Full licensing adjudication across all jurisdictions.

These may be added later as integrations.

---

## 3. Marketplace Model

This is a **multi-role, two-sided marketplace** with a supporting trust network.

### 3.1 Actor types

#### End users

People looking for pets. They can:

* register and authenticate
* search and filter listings
* favorite pets and vendors
* message vendors/sources
* submit inquiries/applications
* post reviews about vendors and adoption/purchase experience
* report issues
* provide community tips and feedback

#### Vendors / pet sources

Organizations or individuals offering pets or pet-related trust content. These include:

* breeders
* shelters
* humane societies
* rescues
* foster networks
* local animal welfare agencies or affiliates

They can:

* create organization or business profiles
* manage pet listings
* publish trust credentials and certifications
* respond to inquiries and chat with users
* write reviews/feedback about user interactions where allowed by policy
* publish care tips and informational content
* respond to public reviews
* manage operational staff under their organization

#### Trust network participants

These are not normal marketplace vendors. They include:

* internal support staff
* contracted validators
* nonprofit partners
* local agencies
* field investigators / auditors
* moderators / trust & safety analysts

They can:

* validate vendor credentials and documentation
* investigate reports
* track casework
* apply trust labels and risk flags
* leave internal notes
* sometimes publish public validation statements when policy permits
* coordinate issue handling by geography or specialization

### 3.2 Marketplace interaction types

1. **Listing interaction**: users browse pets and contact vendors.
2. **Trust interaction**: users see verification and quality signals.
3. **Review interaction**: both sides can review and leave feedback, with role-based restrictions.
4. **Support interaction**: complaints, disputes, fraud reports, and validation tasks are routed to the trust network.
5. **Educational interaction**: trusted sources provide care guidance and resources.

---

## 4. Core User Journeys

### 4.1 User journeys

#### Journey A: discover and inquire

1. User signs up with verified email, phone, CAPTCHA, and device/risk checks.
2. User sets search preferences: pet type, breed, age, location, price/adoption fee, trusted-source filters.
3. User browses results.
4. User opens pet detail page with photos, temperament, health info, source details, trust badges, review score, and availability.
5. User starts chat or submits inquiry.
6. Vendor replies; conversation continues.
7. User leaves review after verified interaction or completed transaction/adoption.

#### Journey B: report a concern

1. User identifies suspicious vendor/listing/review/chat.
2. User submits report with category and evidence.
3. Trust workflow creates a case.
4. Internal or partner validator investigates.
5. Resolution updates listing/vendor trust status and possibly notifies affected users.

### 4.2 Vendor journeys

#### Journey C: onboarding and verification

1. Vendor registers organization and primary admin.
2. Vendor completes business/organization profile.
3. Vendor uploads documentation: licenses, certifications, rescue affiliation, nonprofit proof, animal welfare references, identity docs.
4. Trust ops or partners review submissions.
5. Vendor receives status: pending, verified, conditionally verified, suspended, rejected.
6. Verified vendor publishes listings.

#### Journey D: manage listings and customer communication

1. Vendor creates listing with structured pet metadata.
2. Vendor adds photos, videos, health/adoption info, policies, fees, and location.
3. Vendor receives inquiries and chats with users.
4. Vendor updates availability state.
5. Vendor can respond to public reviews and submit feedback on abusive or fraudulent users.

### 4.3 Trust network journeys

#### Journey E: validate vendor

1. Validator receives assignment based on region/category.
2. Validator reviews submitted documents and public signals.
3. Validator logs findings and recommends status.
4. Trust analyst approves/rejects.
5. Public trust indicators are updated.

#### Journey F: handle complaint

1. Case created from report, review dispute, or automated risk trigger.
2. Case triaged by severity.
3. Partner or contractor assigned.
4. Findings recorded, actions taken, SLA tracked.
5. User/vendor notified if appropriate.

---

## 5. Functional Requirements

### 5.1 Authentication and identity

The platform must strongly discourage spam and bot abuse while keeping onboarding usable.

Requirements:

* email verification
* phone verification with OTP for higher-trust actions
* CAPTCHA or equivalent challenge on sign-up, login risk events, review submission, and chat burst events
* device fingerprinting / browser integrity checks
* IP reputation / ASN risk scoring
* optional social login for convenience, but not sufficient alone for elevated trust
* optional KYC-like verification for vendors and high-trust contributors
* session management with revocation
* support MFA for vendors, moderators, validators, and admins
* role-based access control

High-trust actions requiring stronger verification:

* creating vendor account
* publishing listings
* writing multiple reviews quickly
* initiating many chats in a short period
* filing repeated reports
* changing payout/billing info if payments are later added

### 5.2 Pet listings

Pet listing requirements:

* pet type: dog, cat, bird, extensible taxonomy
* breed/species/subtype
* age / DOB estimate
* sex
* size / expected size
* temperament tags
* health status fields
* vaccination and medical record indicators
* spay/neuter status when applicable
* adoption fee or price range
* availability status
* location and service radius
* photos/videos
* source organization details
* trust indicators
* source-specific policies
* content moderation checks

### 5.3 Search and discovery

Search must support:

* keyword search
* category and breed filters
* location and radius
* shelter/breeder/humane society/rescue source filter
* trust level filters
* age / sex / size / temperament filters
* price/adoption fee range
* good with kids / pets / apartment suitability when available
* sort by relevance, newest, distance, trust score, review score

### 5.4 Reviews and feedback

Both users and vendors should be able to provide reviews and feedback, but the system must prevent retaliation, abuse, and fake reputation inflation.

Proposed review model:

* **Users can review vendors/sources** after a verified interaction milestone.
* **Vendors can review user interactions** only in constrained dimensions, such as responsiveness, seriousness, attendance, respectful conduct, or application completion.
* **Vendors should not be allowed to publish defamatory freeform accusations**. Vendor feedback should be partially structured and policy-limited.
* **Both parties can leave private feedback to platform trust ops**.
* **Both parties can flag reviews for dispute**.

Review requirements:

* only after verified event or sufficient interaction threshold
* weighted trust score for reviewer credibility
* moderation pipeline for toxicity, spam, fraud, and AI-generated abuse signals
* public responses from vendors
* edit windows and dispute workflows
* no anonymous public reviews in MVP

### 5.5 Chat and messaging

Features:

* one-to-one conversations between users and vendors
* optionally organization inbox with multiple staff members
* attachments: images/docs in controlled formats
* spam detection and rate limiting
* AI-generated content detection heuristics where feasible
* block/report functions
* safety warnings when sensitive patterns are detected
* conversation audit logging for trust cases

### 5.6 Trust and verification

Requirements:

* vendor identity verification
* document collection and review workflows
* trust badges / public trust states
* complaint and enforcement history visibility policy
* manual review queues
* partner-assisted validation
* audit trail
* case management
* AI-assisted sourcing of possible vendors, partners, nonprofits, shelters, humane societies, and agencies for onboarding or review
* AI-assisted entity resolution to identify duplicate or related organizations across public and partner-provided data
* AI-assisted trust signal extraction from websites, documents, reviews, and partner referrals, with all decisions remaining reviewable and auditable

Public trust states may include:

* pending verification
* verified identity
* verified organization
* nonprofit partner validated
* agency affiliated
* high complaint risk
* suspended

### 5.7 Support and contractor network

The system needs an internal trust operations module for managing validators, nonprofits, and agencies.

Capabilities:

* region-based assignment
* specialization tags (breeder compliance, shelter audits, rescue legitimacy, bird care orgs, fraud investigation)
* case routing
* SLA tracking
* evidence management
* internal notes
* partner organization directory
* contractor compliance status
* issue categories and status lifecycle

### 5.8 Content and educational resources

Trusted sources should be able to publish:

* care tips
* breed guidance
* adoption readiness content
* local regulations or best practices
* humane care and welfare articles

These resources should be moderated, searchable, and attributable.

### 5.9 AI capabilities

AI should be a first-class capability, but always bounded by policy, auditability, and human override.

AI features that make sense for this platform:

#### AI-assisted sourcing and ecosystem expansion

* scan public websites and partner referrals to identify possible breeders, shelters, rescues, humane societies, nonprofits, agencies, and support contractors for onboarding
* suggest likely partner relationships by geography, category, and trust relevance
* cluster duplicate or related organizations and flag entity conflicts for review
* generate candidate outreach lists for trust ops teams

#### AI user guidance and recommendation assistant

* conversational chat assistant to guide users on pet selection, breed/species fit, adoption readiness, first-time owner advice, and care suggestions
* personalized recommendations based on household, lifestyle, allergies, space constraints, children, other pets, and budget
* explain differences between breeders, rescues, shelters, and humane societies
* surface educational content and trusted partners rather than inventing advice

#### AI correspondence automation

* automated handling of inbound and outbound correspondence with users, vendors, and partners
* draft replies, follow-ups, reminders, and case updates
* summarize conversations and cases
* classify incoming messages and route them to the correct queue or partner
* suggest next best actions for support and trust teams
* maintain end-to-end tracking and auditability of automated or AI-assisted communication

#### AI trust and moderation support

* spam detection
* suspicious listing detection
* risky review pattern detection
* content classification and moderation triage
* complaint summarization and case prioritization
* document extraction from submitted credentials

#### AI operating principles

* AI must not silently make irreversible trust decisions without policy-approved human review thresholds
* automated messages should be labeled internally as AI-generated or AI-assisted
* all AI outputs used in operations should be logged with prompt/version/model metadata where appropriate
* users and staff must be able to escalate from automated handling to human handling
* recommendation and guidance systems should prefer trusted knowledge and retrieval over unconstrained generation

---

## 6. Quality Attributes / Non-Functional Requirements

### 6.1 Security

* encrypted transport and secrets handling
* secure password hashing
* RBAC and least privilege
* audit logging for admin actions
* document storage protection
* attachment scanning
* abuse prevention

### 6.2 Availability

* target 99.9% for core marketplace flows after MVP
* graceful degradation for non-core modules like analytics

### 6.3 Scalability

* architecture should support growth in listings, chats, reviews, and casework
* read-heavy search path must scale independently
* messaging and moderation pipelines should be asynchronous where possible

### 6.4 Privacy

* sensitive documents should be private
* only selected trust indicators should be public
* minors / sensitive animal welfare cases must be protected
* comply with jurisdictional privacy requirements

### 6.5 Trustworthiness

* every public trust label should be explainable and auditable internally
* moderation and verification decisions require provenance

---

## 7. Recommended Architecture

## 7.1 Monorepo-first architecture

This system should be built as a **monorepo**, not described merely as a monolith.

Important distinction:

* **Monorepo** refers to how the codebase is organized.
* **Monolith / modular monolith / services** refers to how the software runs.

Recommended approach:

* Use a **monorepo** from day one.
* Within that monorepo, start with a **modular backend architecture** and clear domain boundaries.
* Keep the option to deploy parts independently later, especially AI pipelines, search, chat orchestration, and trust operations tooling.

A monorepo is recommended because this product will likely include multiple coordinated surfaces:

* consumer website
* vendor portal
* trust/admin portal
* partner/validator portal
* kiosk/terminal interface for physical partner sites
* embeddable partner widgets/pages
* backend APIs
* async workers
* AI orchestration components
* shared design system and schema libraries

### 7.2 Suggested monorepo layout

Example structure:

```text
/apps
  /web-consumer
  /web-vendor
  /web-admin
  /web-partner
  /web-kiosk
  /api-gateway
  /worker-jobs
  /ai-orchestrator
/packages
  /ui
  /config
  /types
  /auth
  /database
  /search
  /messaging
  /reviews
  /trust
  /ai-core
  /ai-prompts
  /ai-evals
  /observability
  /partner-routing
/infrastructure
  /terraform or /pulumi
  /kubernetes or /deploy
/docs
```

Recommended tooling:

* Turborepo or Nx
* pnpm workspaces
* shared TypeScript config and linting
* shared API contracts and schema validation
* shared component library

### 7.3 Runtime architecture

At runtime, start with a small number of deployable units, not necessarily one giant application process.

Recommended initial deployables:

1. **Frontend apps**

   * consumer marketplace web app
   * vendor portal
   * trust/admin portal
   * kiosk/terminal interface

2. **Backend API layer**

   * primary application API for auth, listings, search, messaging, reviews, partner routing, and case management

3. **Async worker layer**

   * notifications
   * indexing
   * moderation
   * AI enrichment and vendor discovery
   * correspondence automation

4. **AI orchestration layer**

   * recommendation and guidance services
   * vendor/partner discovery pipelines
   * summarization and correspondence handling
   * policy-guarded assistant actions

5. **Search infrastructure**

   * listing and organization search index

6. **Shared data infrastructure**

   * PostgreSQL
   * Redis
   * object storage

### 7.4 Why this approach fits

This product requires tight reuse across many apps and workflows, but also benefits from separation of high-change and high-cost components such as AI jobs and realtime messaging. A monorepo gives:

* single source of truth for contracts and types
* faster development across apps
* easier sharing of auth, trust, and AI utilities
* better consistency for audit logging and policy controls
* easier generation by Cursor/Claude because all code and dependencies are visible in one workspace

Candidate domain modules inside the monorepo:

* auth
* users
* organizations/vendors
* listings
* search
* chat
* reviews
* trust & verification
* support/case management
* content/resources
* notifications
* moderation/risk
* partner routing
* kiosk/embedded channels
* AI guidance and correspondence
* admin

---

## 8. Detailed Logical Components

### 8.1 Identity and access module

Responsibilities:

* registration/login/logout
* email and phone verification
* MFA for privileged roles
* session/token management
* role and permission assignment
* challenge orchestration (captcha, OTP, risk step-up)
* account status management

Roles:

* guest
* authenticated_user
* vendor_member
* vendor_admin
* validator
* nonprofit_partner
* agency_partner
* support_agent
* trust_analyst
* moderator
* admin

### 8.2 User profile module

Responsibilities:

* user profile management
* pet preferences
* favorites / saved searches
* interaction history
* trust score inputs (internal)
* review eligibility state

### 8.3 Organization / vendor module

Responsibilities:

* vendor profile
* org hierarchy and staff
* source type classification
* verification status
* public trust profile
* uploaded credentials and supporting docs
* policy information

### 8.4 Listing module

Responsibilities:

* pet listing CRUD
* media management
* structured metadata validation
* status transitions
* availability updates
* source ownership checks
* duplicate detection

Listing states:

* draft
* pending_review
* published
* paused
* adopted_or_sold
* removed
* suspended

### 8.5 Search and ranking module

Responsibilities:

* indexing listings and source profiles
* faceted search
* geosearch
* ranking using relevance + trust signals
* recommendations / similar listings

Potential ranking inputs:

* textual relevance
* proximity
* freshness
* trust status
* listing completeness
* review score
* response rate
* complaint rate penalty

### 8.6 Reviews and reputation module

Responsibilities:

* review creation
* eligibility validation
* structured and freeform review storage
* feedback types for each actor
* moderation states
* reputation aggregates
* dispute workflows

### 8.7 Messaging module

Responsibilities:

* conversation creation
* messages and attachments
* spam controls
* read/unread state
* notification triggers
* moderation hooks

### 8.8 Trust & verification module

Responsibilities:

* document intake
* verification workflows
* badge assignment
* trust scoring inputs
* rules engine for account/listing restrictions
* enforcement actions

### 8.9 Support / case management module

Responsibilities:

* issue intake
* ticket lifecycle
* investigator assignment
* contractor directory
* partner routing
* notes/evidence/actions
* SLA and escalation

### 8.10 Content/resource module

Responsibilities:

* educational articles and tips
* attribution to trusted sources
* moderation and publishing workflow
* localization / tagging

### 8.11 AI guidance and correspondence module

Responsibilities:

* user-facing AI chat for pet guidance and recommendations
* retrieval over trusted content, partner knowledge, and listing data
* automated correspondence drafting and response handling
* organization/vendor/partner discovery scans
* case and conversation summarization
* AI action logging and audit support
* human escalation hooks
* partner attribution and routing logic for recommendations and referrals

---

## 9. Data Model

Below is a practical relational schema proposal. Exact naming can vary.

## 9.0 Additional AI, partner-channel, and audit tables

### ai_interactions

* id
* actor_user_id nullable
* session_id nullable
* channel_type (web_chat, kiosk, partner_embed, internal_assistant)
* conversation_id nullable
* case_id nullable
* prompt_version
* model_name
* input_summary
* output_summary
* action_taken_json
* reviewed_by_user_id nullable
* created_at

### ai_correspondence_runs

* id
* related_entity_type (conversation, case, outreach_campaign, recommendation_session)
* related_entity_id
* run_type (draft_reply, auto_reply, summary, classification, partner_discovery, vendor_scan)
* status
* input_ref_json
* output_ref_json
* confidence_score
* human_override_status
* created_at
* completed_at

### discovered_entities

* id
* entity_type (vendor, shelter, humane_society, nonprofit, agency, contractor, partner)
* source_url
* source_name
* extracted_profile_json
* discovery_method (ai_scan, partner_referral, manual)
* match_status
* routed_to_team
* created_at

### channel_origins

* id
* channel_type (first_party_web, partner_embed, kiosk_terminal, referral_link)
* origin_partner_organization_id nullable
* origin_domain nullable
* origin_location_name nullable
* origin_location_address nullable
* attribution_rules_json
* status
* created_at

### partner_referrals

* id
* channel_origin_id
* organization_id nullable
* user_id nullable
* referral_type (lead, recommendation_click, inquiry, listing_view, product_recommendation)
* referred_partner_organization_id
* related_listing_id nullable
* created_at

### audit_logs

* id
* actor_type (user, system, ai, admin, partner)
* actor_id nullable
* action_type
* target_type
* target_id
* metadata_json
* created_at

## 9.1 Core identity tables

### users

* id (uuid, pk)
* email (unique)
* email_verified_at
* phone_e164
* phone_verified_at
* password_hash
* status (active, pending, suspended, banned)
* risk_level
* created_at
* updated_at
* last_login_at

### user_profiles

* user_id (pk, fk users)
* display_name
* avatar_url
* city
* state_region
* country
* bio
* preferences_json

### roles

* id
* name

### user_roles

* user_id
* role_id
* scope_type
* scope_id

### sessions

* id
* user_id
* refresh_token_hash
* device_fingerprint
* ip_address
* user_agent
* expires_at
* revoked_at

## 9.2 Vendor / organization tables

### organizations

* id
* legal_name
* public_name
* organization_type (breeder, shelter, humane_society, rescue, nonprofit, agency, foster_network)
* description
* website_url
* phone
* email
* address_line1
* city
* region
* postal_code
* country
* latitude
* longitude
* service_radius_km
* status
* created_at
* updated_at

### organization_members

* id
* organization_id
* user_id
* membership_role (admin, staff, reviewer)
* created_at

### organization_verifications

* id
* organization_id
* verification_type
* status
* submitted_at
* reviewed_at
* reviewed_by_user_id
* expires_at
* notes_internal

### organization_documents

* id
* organization_id
* document_type
* storage_key
* status
* uploaded_by_user_id
* created_at

### trust_badges

* id
* code
* label
* description
* public_visibility

### organization_badges

* organization_id
* badge_id
* assigned_by_user_id
* assigned_at
* expires_at

## 9.3 Pet and listing tables

### pets

* id
* organization_id
* pet_type (dog, cat, bird)
* breed_primary
* breed_secondary
* species_subtype
* name
* description
* sex
* age_value
* age_unit
* birth_date_estimated
* size_category
* color
* temperament_json
* health_json
* adoption_or_sale_type
* created_at
* updated_at

### pet_listings

* id
* pet_id
* listing_status
* title
* summary
* fee_amount
* fee_currency
* available_from
* availability_status
* location_city
* location_region
* location_country
* latitude
* longitude
* published_at
* removed_at
* moderation_status
* trust_rank_snapshot

### pet_media

* id
* pet_id
* media_type
* storage_key
* sort_order
* is_primary
* created_at

### pet_attributes

* id
* pet_id
* attribute_key
* attribute_value

## 9.4 Review tables

### interactions

Represents a meaningful interaction or relationship enabling review rights.

* id
* user_id
* organization_id
* listing_id
* conversation_id
* interaction_type (inquiry, visit, application, adoption, purchase, support_case)
* occurred_at
* verification_level

### reviews

* id
* reviewer_user_id
* reviewer_actor_type (user, vendor_member)
* subject_type (organization, user)
* subject_id
* interaction_id
* rating_overall
* rating_dimensions_json
* review_text
* visibility_scope (public, internal, limited)
* moderation_status
* dispute_status
* created_at
* updated_at

### review_responses

* id
* review_id
* responder_user_id
* response_text
* created_at

### review_flags

* id
* review_id
* flagged_by_user_id
* reason_code
* notes
* created_at

## 9.5 Messaging tables

### conversations

* id
* conversation_type (user_vendor, case_internal, partner_case)
* listing_id nullable
* organization_id nullable
* created_by_user_id
* created_at

### conversation_participants

* id
* conversation_id
* user_id
* participant_role
* last_read_at
* is_blocked

### messages

* id
* conversation_id
* sender_user_id
* body_text
* message_type
* moderation_status
* risk_score
* created_at

### message_attachments

* id
* message_id
* storage_key
* file_name
* mime_type
* scan_status

## 9.6 Support / trust ops tables

### cases

* id
* case_type (vendor_verification, complaint, fraud_report, review_dispute, welfare_issue)
* source_type
* source_id
* priority
* severity
* status
* region
* assigned_team
* assigned_user_id
* assigned_partner_org_id nullable
* created_by_user_id
* created_at
* updated_at
* resolved_at

### case_events

* id
* case_id
* event_type
* actor_user_id
* payload_json
* created_at

### case_notes

* id
* case_id
* author_user_id
* visibility (internal, partner_internal)
* body
* created_at

### partner_organizations

* id
* name
* partner_type (nonprofit, agency, contractor)
* region
* contact_info_json
* status
* capabilities_json

### partner_members

* id
* partner_organization_id
* user_id
* role
* status

### assignments

* id
* case_id
* assigned_to_type (user, partner_org)
* assigned_to_id
* assigned_by_user_id
* assigned_at
* due_at
* sla_policy_id

## 9.7 Content tables

### resources

* id
* organization_id nullable
* author_user_id nullable
* resource_type (article, tip, faq, guide)
* title
* slug
* body_markdown or body_richtext
* status
* tags_json
* published_at
* created_at
* updated_at

---

## 10. API Design

REST is recommended for MVP.

## 10.1 Public APIs

### AI assistant

* `POST /api/v1/ai/chat`
* `POST /api/v1/ai/recommendations`
* `GET /api/v1/ai/sessions/:id`

### Channel / origin attribution

* `POST /api/v1/channel/resolve-origin`
* `GET /api/v1/channel/:id`
* `POST /api/v1/referrals`

### Correspondence automation

* `POST /api/v1/correspondence/draft`
* `POST /api/v1/correspondence/auto-handle`
* `GET /api/v1/correspondence/runs/:id`

## 10.1 Public APIs

### Auth

* `POST /api/v1/auth/register`
* `POST /api/v1/auth/login`
* `POST /api/v1/auth/logout`
* `POST /api/v1/auth/verify-email`
* `POST /api/v1/auth/verify-phone`
* `POST /api/v1/auth/mfa/challenge`
* `POST /api/v1/auth/mfa/verify`

### Users

* `GET /api/v1/me`
* `PATCH /api/v1/me`
* `GET /api/v1/me/favorites`
* `POST /api/v1/me/favorites`
* `DELETE /api/v1/me/favorites/:id`

### Search and listings

* `GET /api/v1/listings`
* `GET /api/v1/listings/:id`
* `GET /api/v1/organizations/:id`
* `GET /api/v1/organizations/:id/reviews`
* `GET /api/v1/resources`
* `GET /api/v1/resources/:slug`

### Messaging

* `POST /api/v1/conversations`
* `GET /api/v1/conversations`
* `GET /api/v1/conversations/:id/messages`
* `POST /api/v1/conversations/:id/messages`

### Reviews

* `POST /api/v1/reviews`
* `PATCH /api/v1/reviews/:id`
* `POST /api/v1/reviews/:id/flag`
* `POST /api/v1/reviews/:id/respond`

### Reports

* `POST /api/v1/reports`

## 10.2 Vendor APIs

* `POST /api/v1/vendor/organizations`
* `PATCH /api/v1/vendor/organizations/:id`
* `POST /api/v1/vendor/organizations/:id/documents`
* `POST /api/v1/vendor/pets`
* `PATCH /api/v1/vendor/pets/:id`
* `POST /api/v1/vendor/listings`
* `PATCH /api/v1/vendor/listings/:id`
* `POST /api/v1/vendor/resources`
* `GET /api/v1/vendor/analytics`

## 10.3 Internal/admin APIs

* `GET /api/v1/admin/cases`
* `POST /api/v1/admin/cases/:id/assign`
* `POST /api/v1/admin/cases/:id/events`
* `POST /api/v1/admin/organizations/:id/badges`
* `POST /api/v1/admin/organizations/:id/verification/decision`
* `POST /api/v1/admin/reviews/:id/moderate`
* `POST /api/v1/admin/messages/:id/moderate`

---

## 11. Authentication and Anti-Abuse Design

This is a core differentiator and should be designed early.

### 11.1 Authentication strategy

Use the following stack:

* email/password or social login for baseline access
* mandatory email verification
* phone OTP required before high-risk actions
* MFA for vendor admins and internal roles
* device/session tracking
* JWT access tokens + rotating refresh tokens, or secure server-side session cookies

For web app security, prefer:

* httpOnly secure cookies
* CSRF protection for cookie-based sessions
* short-lived access tokens if using token pair model

### 11.2 Bot and spam prevention

Controls:

* CAPTCHA on registration and suspicious login
* hidden honeypot fields on public forms
* IP/device/account rate limiting
* behavior-based anomaly detection
* slow mode for newly created users
* review and chat gating until verification milestones
* content similarity checks to block repeated AI-generated spam
* disposable email detection
* VOIP / high-risk number scoring where lawful and feasible
* link throttling in chat
* attachment scanning

### 11.3 Trust score / risk score

Maintain internal risk features for accounts and events.

Example risk signals:

* new account + many chats in minutes
* repeated near-duplicate review text
* many vendor inquiries with no engagement
* multiple accounts from same device fingerprint
* document metadata anomalies
* high complaint to interaction ratio
* bursts of positive reviews from low-trust accounts

Actions from risk engine:

* allow
* soft challenge
* require phone verification
* queue for moderation
* temporary mute
* suspend action

---

## 12. Review System Design

Because both sides can provide feedback, this area needs careful guardrails.

### 12.1 Review eligibility rules

User can review vendor if one of:

* completed application
* meaningful chat exchange over threshold
* verified visit / appointment
* adoption or purchase marked complete
* support case resolution involving vendor

Vendor can provide feedback on user if one of:

* active conversation above threshold
* scheduled appointment no-show
* completed application
* completed adoption/purchase interaction

### 12.2 Public vs private feedback

To prevent abuse:

* user-to-vendor reviews can be public after moderation
* vendor-to-user feedback should default to **private or semi-private reputation signals** unless product policy explicitly allows public user reviews
* vendors may provide structured ratings such as responsiveness, seriousness, attendance, courtesy
* freeform vendor feedback should be visible only to trust ops or the affected user unless heavily moderated

Recommended MVP:

* public vendor reviews by users
* private user feedback by vendors
* public vendor responses
* private reports by both parties

### 12.3 Reputation score calculation

Keep score explainable and robust.

Vendor reputation components:

* average user rating
* verified interaction weight
* recency weighting
* complaint penalty
* review authenticity score
* trust verification multiplier

Do not expose the full scoring formula publicly.

---

## 13. Messaging and Communication Design

### 13.1 Realtime model

Options:

* WebSocket server integrated with backend
* or managed provider like Pusher/Ably for MVP simplicity

Store all messages in PostgreSQL initially; archive later if volume grows.

### 13.2 Safety controls

* rate limit conversation creation
* message content moderation pipeline
* profanity/toxicity/spam scoring
* suspicious contact-info sharing detection
* safe attachment policy
* user-level block/mute
* escalation path to support case

### 13.3 Organization inbox

An organization may have:

* shared inbox
* assignment of conversations to staff members
* response SLAs
* canned responses with moderation controls

---

## 14. Trust Network / Support / Contractor Operations

This is a critical requirement and should be treated as a first-class operational subsystem.

## 14.1 Operational model

The trust network combines:

* internal support staff
* contracted validators
* nonprofit partners
* agency participants

Each can be modeled as a **partner organization** with members and capability tags.

### 14.2 Assignment routing

Cases can be routed based on:

* geography
* pet category
* source type
* issue type
* language
* partner availability
* required accreditation level

### 14.3 Validation workflows

Examples:

* breeder license validation
* nonprofit affiliation check
* humane society relationship confirmation
* prior complaint history review
* field investigation request
* listing authenticity review
* AI-generated candidate vendor/partner discovery followed by human review

### 14.4 Public trust outputs

Not every internal fact should be shown publicly. Instead generate public signals such as:

* identity verified
* organization verified
* nonprofit validated
* agency affiliated
* profile under review
* temporary restrictions applied

### 14.5 Internal case lifecycle

Suggested statuses:

* new
* triaged
* awaiting_docs
* assigned
* investigating
* pending_partner
* resolved
* closed
* escalated

### 14.6 Correspondence and auditability

All operational correspondence should be trackable and auditable, whether human-authored, AI-assisted, or fully automated under policy.

Requirements:

* every outbound or automated communication linked to a case, conversation, partner, or listing context
* immutable audit trail for status-changing communications
* clear attribution of origin: human-authored, AI-assisted, or automated
* versioned templates and prompts
* delivery and response tracking
* escalation from automation to human owner
* searchable history for regulators, nonprofit partners, and internal trust teams as permitted by policy

## 15. Search, Ranking, and Trust Presentation

### 15.1 Search architecture

For MVP:

* use PostgreSQL + trigram/full-text if small scale
* or OpenSearch for better faceting and geo support from day one

Recommended if budget allows: OpenSearch.

### 15.2 Search ranking principles

Results should not be purely commercial or chronological. Trust must influence visibility.

Illustrative ranking formula:

* textual relevance
* location proximity
* listing freshness
* completeness score
* organization trust multiplier
* complaint/risk penalties
* responsiveness score

### 15.3 Trust presentation on UI

On organization pages:

* verification badges
* response rate
* review summary
* member since date
* complaint handling statement
* nonprofit/agency affiliations

On listing cards:

* verified source icon
* review score
* trust badge summary
* availability freshness

---

## 16. Frontend Design

### 16.1 Primary web surfaces

1. Home / landing page
2. Search results page
3. Pet detail page
4. Organization profile page
5. Reviews page
6. Messaging inbox
7. User dashboard
8. Vendor dashboard
9. Trust/admin portal
10. Resource/content hub
11. AI chat and recommendation interface
12. Kiosk / terminal interface for physical pet stores or partner locations
13. Embedded/linked partner experience for third-party pet websites

### 16.2 Channel extensions: kiosks, terminals, and partner-linked entry points

The platform should support multiple acquisition and engagement channels beyond the main website.

#### Physical terminals / kiosks

Terminals can be deployed in:

* physical pet stores
* humane society offices
* rescue centers
* nonprofit partner locations
* community agency offices

Kiosk capabilities:

* guided pet discovery
* AI-assisted recommendation flow
* QR/email/SMS handoff to continue on personal device
* partner-attributed lead capture
* browsing without exposing unnecessary account controls
* hardened session reset and privacy timeout behavior

#### Partner website linked or embedded flows

The platform should support:

* referral landing pages linked from partner pet websites
* white-labeled or co-branded partner pages
* embeddable search or recommendation widgets
* origin-aware tracking for all traffic and actions

#### Partner attribution rule

Any recommendations, suggestions, referrals, or product-direction actions originating from a partner-linked channel should be routed back to the originating partner when policy and business rules require it.

Examples:

* if a user starts from a partner breeder site, suggested next steps and partner referrals should prioritize that originating partner where appropriate
* if a user interacts through a kiosk in a specific pet store, recommendations and associated commerce/referral flows should preserve attribution to that store or partner organization
* if product suggestions are shown, those suggestions should be routed to the originating partner rather than detached from source attribution

This requires persistent channel origin tracking across session, auth, chat, recommendation, and referral flows.

### 16.3 Suggested frontend stack

* Next.js
* TypeScript
* React Query / TanStack Query
* Tailwind CSS or component library
* WebSocket client or managed realtime SDK
* SSR for SEO-critical listing and organization pages

### 16.3 SEO considerations

Important because discovery may be search-driven:

* SSR/SSG for listing and content pages
* structured metadata / schema markup where appropriate
* canonical URLs
* indexing controls for unavailable listings

---

## 17. Backend Design and Module Boundaries

### 17.1 Suggested backend stack

Preferred option:

* Node.js + TypeScript + NestJS
* PostgreSQL + Prisma or TypeORM
* Redis
* OpenSearch
* S3-compatible storage
* BullMQ or equivalent queue

Alternative:

* Python FastAPI + SQLAlchemy

TypeScript is a good fit if Cursor/Claude is expected to generate large amounts of web app code across frontend and backend.

### 17.2 Internal module contracts

Each module should expose:

* controllers/routes
* service layer
* repository/data access layer
* policy/authorization layer
* event publisher/subscriber where needed

### 17.3 Domain events

Useful asynchronous events:

* user_registered
* phone_verified
* vendor_submitted_for_verification
* listing_published
* message_sent
* review_submitted
* review_flagged
* case_created
* badge_assigned
* risk_threshold_triggered

---

## 18. Authorization Model

Use RBAC plus scoped permissions.

Examples:

* user can message vendor about listing
* vendor_admin can manage only their org
* validator can access only assigned cases or permitted regions
* nonprofit partner can view shared cases linked to their partner org
* moderator can moderate reviews/messages globally or by region

Consider adding ABAC-style conditions later:

* region matches
* partner capability matches case type
* organization ownership matches resource

---

## 19. Moderation and Policy Enforcement

### 19.1 Moderation surfaces

* listings
* profile text
* reviews
* messages
* uploaded documents
* educational content

### 19.2 Moderation pipeline

Pipeline per content type:

1. synchronous lightweight checks
2. async ML/rules scoring
3. queue for human review if needed
4. enforcement or publish

### 19.3 Enforcement actions

* warn
* limit capability
* hide content
* require verification
* suspend listing
* suspend vendor
* suspend user
* create support case

### 19.4 Auditability

Every moderation decision should record:

* trigger source
* rule/policy version
* actor
* timestamp
* before/after state

---

## 20. Notifications

Channels:

* email
* SMS for security and urgent trust actions
* in-app notifications
* push later if mobile app exists

Notification events:

* inquiry reply
* listing status change
* review published or disputed
* verification request update
* support case update
* password/security event

---

## 21. Analytics and Reporting

### 21.1 Product analytics

* search-to-contact conversion
* listing engagement
* vendor response time
* review rates
* save/favorite rates
* complaint rates

### 21.2 Trust analytics

* verification turnaround time
* complaint categories by region
* suspicious review rates
* spam chat blocks
* case closure SLAs
* vendor risk distribution

### 21.3 Operational analytics

* support backlog
* partner utilization
* contractor quality metrics
* moderator workload

---

## 22. External Integrations

Potential integrations:

* email service
* SMS/OTP provider
* CAPTCHA provider
* geocoding/maps provider
* document scanning / malware scanning
* identity verification vendor for org/admin checks
* analytics platform
* customer support tooling if needed
* AI model providers and/or internal model gateway
* web crawling / enrichment tools for AI vendor and partner discovery
* CRM or outreach tools for partner onboarding

Keep integration interfaces abstract so providers can be swapped.

---

## 23. Deployment and Infrastructure

### 23.1 Environment layout

* dev
* staging
* production

### 23.2 Hosting

Typical cloud architecture:

* frontend on Vercel or CDN-backed hosting
* backend on container platform or Kubernetes later
* managed PostgreSQL
* managed Redis
* managed OpenSearch
* managed object storage

### 23.3 CI/CD

* lint
* unit tests
* integration tests
* migration checks
* security scans
* preview deploys for frontend
* staged rollout for backend changes

---

## 24. Security Design Details

### 24.1 Sensitive data classes

* account credentials
* vendor verification documents
* case evidence
* moderation notes
* phone numbers and personal contact details

### 24.2 Controls

* encrypt at rest where possible
* signed URLs for private media/documents
* limited retention policies for sensitive uploads
* admin access logging
* secret rotation
* dependency and image scanning

### 24.3 Privacy boundaries

* internal notes never public
* vendor documents never public
* user private feedback not public by default
* public review content subject to moderation and retention policies

---

## 25. Suggested MVP Scope

A practical MVP should focus on trust-oriented discovery and communication.

### 25.1 MVP includes

* user auth with email verification + CAPTCHA
* vendor onboarding with document upload
* internal manual verification workflow
* pet listings for dogs/cats/birds
* search and filters
* organization profile pages
* one-to-one messaging
* public user reviews of vendors
* vendor responses to reviews
* private vendor feedback about user interactions
* report abuse / trust case creation
* internal case management basics
* educational content pages
* initial AI pet guidance assistant using retrieval over trusted content
* AI-assisted correspondence drafting for support and trust teams
* channel origin attribution for partner-linked traffic
* basic kiosk/terminal mode support

### 25.2 MVP excludes

* public vendor reviews of users
* advanced ML fraud models
* payments
* mobile native apps
* complex recommendation engine
* deep partner SLA automation

---

## 26. Phase Plan

### Phase 1: MVP foundation

* auth
* listings
* search
* org profiles
* messaging
* public vendor reviews
* manual trust ops case handling

### Phase 2: trust expansion

* stronger anti-abuse engine
* partner network management
* structured vendor feedback
* richer case routing
* badge automation

### Phase 3: ecosystem and scale

* recommendation engine
* advanced ranking
* mobile app
* localized content and agency workflows
* external verifications and more automation

---

## 27. Key Product and Policy Decisions

These should be fixed early because they affect implementation.

1. **Are vendor reviews of users public, private, or semi-private?**

   * Recommendation: private/semi-private only for MVP.

2. **What trust badges are public?**

   * Recommendation: only externally defensible badges with manual approval.

3. **What documentation is required by vendor type?**

   * Recommendation: configurable checklist by organization type and region.

4. **What constitutes a verified interaction for review rights?**

   * Recommendation: configurable rule engine using interaction milestones.

5. **Can unverified vendors publish at all?**

   * Recommendation: allow draft onboarding, but public listing only after baseline verification.

6. **How much complaint history is surfaced publicly?**

   * Recommendation: surface trust state, not raw complaints, in MVP.

---

## 28. Example Tech Stack Recommendation

### Monorepo tooling

* pnpm workspaces
* Turborepo or Nx
* shared TypeScript configs
* shared ESLint/Prettier setup
* Changesets or similar release/version tooling

### Frontend

* Next.js
* TypeScript
* Tailwind CSS
* TanStack Query
* Zustand or lightweight state store

### Backend

* NestJS
* PostgreSQL
* Prisma
* Redis
* BullMQ
* OpenSearch
* S3-compatible storage

### AI layer

* model gateway abstraction
* RAG/retrieval pipeline over trusted resources, listings, partner data, and policies
* prompt/version registry
* evaluation harness for recommendation and correspondence quality
* vector store if needed for semantic retrieval

### Auth / security

* Argon2 password hashing
* TOTP MFA for admins/vendors
* CAPTCHA provider
* OTP provider

### Infra

* Vercel for frontend
* AWS/GCP/Azure for backend + DB + storage
* Datadog/Grafana/Sentry for observability

## 29. Example Implementation Backlog

### Epic 1: Identity and onboarding

* user registration/login
* email verification
* CAPTCHA integration
* phone verification
* vendor org creation
* organization member roles

### Epic 2: Listings and search

* pet schema
* listing CRUD
* media upload
* search index
* filter UI
* organization profile page

### Epic 3: Messaging

* conversation creation
* message send/read
* notifications
* attachment controls
* anti-spam throttles

### Epic 4: Reviews and trust

* interaction eligibility model
* review create/edit/respond
* review moderation queue
* trust badges
* complaint/report intake

### Epic 5: Trust ops portal

* case list/detail
* assignment workflow
* organization verification review
* partner organization management
* audit trail UI

---

## 30. Open Risks and Mitigations

### Risk: fake vendors with forged documents

Mitigation:

* manual review
* partner validation
* document metadata and consistency checks
* progressive trust states

### Risk: AI-generated review spam

Mitigation:

* gated eligibility
* content similarity checks
* risk-based throttling
* manual moderation queue

### Risk: vendor retaliation against users

Mitigation:

* private vendor feedback model
* review dispute and moderation
* policy-limited structured feedback only

### Risk: trust ops overload

Mitigation:

* region/capability routing
* partner organizations
* severity-based prioritization
* automation for low-risk tasks

### Risk: marketplace cold start

Mitigation:

* onboard nonprofits and shelters first
* strong trust/education positioning
* curated launch by region

---

## 31. Recommended Build Order for Cursor / Claude

1. Set up the monorepo with apps, packages, infra definitions, shared types, and CI/CD.
2. Define database schema and migrations.
3. Implement auth, roles, sessions, CAPTCHA, and phone/email verification.
4. Build organization onboarding and verification document upload.
5. Build listing CRUD and public browsing pages.
6. Add search and filters.
7. Add channel origin attribution for first-party web, partner links, and kiosk flows.
8. Add conversations and messaging.
9. Add user reviews of vendors and vendor responses.
10. Add report/case creation.
11. Build internal trust ops portal for verification and complaints.
12. Add partner organization and assignment workflows.
13. Add AI guidance assistant using trusted retrieval.
14. Add AI-assisted correspondence drafting, tracking, and audit logging.
15. Add AI-assisted discovery scans for candidate vendors, partners, and contractors.
16. Refine analytics, ranking, and anti-abuse controls.

---

## 32. Final Recommendation

The best implementation approach is a **trust-first marketplace** built as a modular monolith with strong identity controls, structured trust workflows, public vendor reputation, private counterparty feedback, and a first-class support/validator network.

The most important product principle is this:

> Marketplace liquidity should never outrank trust integrity.

That means search ranking, listing publication rights, reviews, and messaging should all be constrained by verification state, interaction authenticity, and abuse prevention.

---

## 33. Appendix: Suggested Future Extensions

* mobile apps
* payments / donations / adoption fees
* veterinary and vaccination record integrations
* transport and relocation support
* foster management workflows
* multilingual support
* AI-assisted but human-approved trust case summarization
* recommendation system for matching users with pets
* local law and policy knowledge by region

---

## 34. Appendix: Cursor/Claude Implementation Prompt Seed

Use this seed prompt with an engineering agent:

> Build a production-oriented trust-first pet marketplace in a **monorepo** using Next.js, TypeScript, NestJS, PostgreSQL, Prisma, Redis, OpenSearch, and S3-compatible storage. Organize the repository into apps for consumer web, vendor portal, admin/trust portal, partner portal, kiosk interface, backend API, async workers, and an AI orchestration layer, with shared packages for UI, database, auth, types, trust, messaging, search, partner routing, and AI utilities. Support roles for users, vendor admins/staff, validators, nonprofit partners, agency partners, moderators, support agents, and admins. Require email verification and CAPTCHA for user onboarding, MFA for privileged roles, and phone verification for high-risk actions. Build pet listings for dogs, cats, and birds; organization profiles for breeders, shelters, humane societies, rescues, nonprofits, and agencies; public user reviews of vendors; private vendor feedback on users; one-to-one messaging with anti-spam controls; vendor verification document workflows; trust badges; and an internal case management portal for support staff and partner validators. Add AI capabilities for pet guidance chat, personalized recommendations, trusted retrieval over platform content, AI-assisted correspondence drafting and automated handling with full tracking and auditability, and AI-assisted scanning of possible vendors, partners, nonprofits, shelters, humane societies, agencies, and contractors for onboarding or review. Support channel-origin attribution for partner-linked website flows and physical kiosks/terminals in pet stores or partner locations, with any recommendations or product suggestions routed back to the originating partner when required. Create clean module boundaries, Prisma schema, REST APIs, queue-based moderation hooks, signed uploads, RBAC, audit logs, prompt/version tracking, and an initial admin dashboard.
