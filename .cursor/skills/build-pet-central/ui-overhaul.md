# Phase 1: UI/UX Overhaul Plan

Goal: Transform Pet Central's UI from functional scaffolds into a polished, premium experience comparable to Chewy.com, Petfinder, and Adopt-a-Pet.

## Design Benchmarks

Study these patterns from major pet platforms:

- **Chewy.com**: Warm brand palette, rounded cards with soft shadows, lifestyle photography, trust badges prominent, sticky nav with search, category mega-menu, smooth hover transitions
- **Petfinder**: Large pet photos dominate, map-based search, clean filter sidebar, emotional hero sections, strong CTAs
- **Adopt-a-Pet**: Simple grid layouts, prominent location-based search, warm/friendly typography, clear adoption process steps

## Execution Order

Work through these areas sequentially. Complete each fully before moving on. Use todos to track.

---

## 1. Design System Upgrades (`packages/ui`)

### 1.1 Install animation and interaction libraries

```bash
pnpm add framer-motion --filter @pet-central/ui
pnpm add @headlessui/react --filter @pet-central/ui
```

### 1.2 New shared components to build

Build these in `packages/ui/src/components/` and export from index:

| Component | Priority | Notes |
|---|---|---|
| `Toast` / `Toaster` | High | Success/error/info notifications with auto-dismiss, stacked |
| `Tabs` | High | Accessible tab panels with keyboard nav, animated indicator |
| `Dropdown` | High | Trigger + menu with items, dividers, icons |
| `Tooltip` | Medium | Hover/focus tooltip with arrow positioning |
| `Skeleton` | High | Content placeholder for loading states — rectangle, circle, text line variants |
| `Breadcrumb` | Medium | Linked breadcrumb trail |
| `StarRating` | High | Interactive + display-only star rating with half-stars |
| `ImageCarousel` | High | Swipeable image gallery with thumbnails, lightbox, zoom |
| `PriceTag` | Medium | Formatted price/adoption fee display |
| `TrustShield` | High | Prominent verification status with tooltip explanation |
| `FilterChip` | Medium | Removable active filter tags |
| `SearchBar` | High | Autocomplete search input with recent searches, suggestions |
| `StatsCard` | Medium | Metric card with label, value, trend indicator, sparkline |
| `Timeline` | Medium | Vertical timeline for case/verification history |
| `FileUpload` | Medium | Drag-and-drop upload zone with preview |
| `RichTextDisplay` | Low | Render markdown/rich content from resources |

### 1.3 Upgrade existing components

| Component | Upgrades needed |
|---|---|
| `Button` | Add subtle hover/press animations (scale, shadow lift), loading spinner inside button |
| `Card` | Add border-radius tokens, subtle entrance animations, glassmorphism variant |
| `Modal` | Add entrance/exit animations (scale + fade), backdrop blur, trap focus |
| `Input` | Add floating label variant, character counter, password visibility toggle |
| `DataTable` | Add column sorting, row selection, bulk actions toolbar |
| `Sidebar` | Add collapsible sections, mini/expanded modes, active indicator animation |

### 1.4 Theme and typography

In `packages/ui/tailwind.config.ts`:
- Add font stack: `'DM Sans'` for headings, `'Inter'` for body (or similar warm, modern pairing)
- Define spacing scale for consistent padding/margins
- Add shadow tokens: `shadow-card`, `shadow-card-hover`, `shadow-modal`
- Add transition tokens: `transition-card`, `transition-button`
- Add border-radius tokens: `rounded-card` (12px), `rounded-button` (8px)
- Ensure dark mode color palette is defined (even if not toggled yet)

---

## 2. Consumer App (`apps/web-consumer`)

This is the highest priority app. Every page should feel premium and trustworthy.

### 2.1 Global Layout & Navigation

**Navbar improvements:**
- Sticky top navigation with scroll shadow/blur effect
- Prominent search bar center (like Chewy's top bar)
- Category quick-links row below main nav (Dogs, Cats, Birds, Shelters, Breeders)
- User menu dropdown with avatar, favorites count badge, messages count badge
- Mobile: slide-in drawer with smooth animation, grouped nav sections
- Smooth scroll-to-top when navigating

**Footer improvements:**
- 4-column footer: About, For Pet Seekers, For Organizations, Trust & Safety
- Newsletter signup with animated input
- Social media links (placeholder icons)
- Trust certifications / partner logos row
- "Back to top" smooth scroll button

### 2.2 Homepage (`/`)

Transform into an emotional, conversion-optimized landing page:

1. **Hero section**: Full-width lifestyle photo/video background with overlay text, animated search bar, popular breed quick-links. Warm, emotional copy ("Find your perfect companion from trusted sources")
2. **Category cards**: Large image cards for Dogs, Cats, Birds with hover zoom effect and count badges
3. **How it works**: 3-step illustrated process (Search → Connect → Adopt/Purchase) with icons and brief text
4. **Featured pets carousel**: Horizontally scrollable cards with smooth animation, auto-play, dot indicators
5. **Trust section**: "Why Pet Central?" with icon+text grid: Verified Sources, Real Reviews, Safe Messaging, Expert Guidance
6. **Stats bar**: Animated count-up numbers: X Trusted Sources, X Happy Families, X Verified Reviews
7. **Testimonials**: User testimonial cards with photos, names, and the pet they found
8. **Popular breeds**: Grid of breed cards linking to filtered search
9. **Educational spotlight**: 3 featured article cards from resources
10. **Final CTA**: Banner with "Ready to find your new best friend?" and search/browse buttons

### 2.3 Search Results (`/search`)

- **Split layout**: Filter sidebar (collapsible on mobile) + results grid
- **Active filters bar**: Show selected filters as removable chips above results
- **Result count and sort**: "Showing X of Y results" with sort dropdown
- **Listing cards**: Larger photos (16:10 ratio), smooth hover elevation, quick-favorite heart icon overlay, trust badge, breed, age, location, price/fee
- **Map toggle**: Show results on map (can be placeholder initially)
- **No results state**: Friendly illustration + suggestions to broaden search
- **Infinite scroll or smart pagination**: Smooth transitions between pages
- **Mobile**: Bottom sheet filters triggered by floating filter button

### 2.4 Pet Listing Detail (`/listings/[id]`)

- **Hero image gallery**: Large primary image with thumbnail strip, lightbox on click, swipe on mobile
- **Sticky sidebar** (desktop): Organization card with contact button, trust badges, quick stats
- **Pet info section**: Structured grid of attributes (Age, Size, Sex, Breed, Temperament, Health) using icon+label pairs
- **Description**: Well-formatted description with expandable read-more
- **Meet the source**: Organization mini-profile with link, badge, response rate, review score
- **Reviews tab**: Paginated reviews with star distribution chart, filter by rating
- **Similar pets**: Carousel of related listings at bottom
- **Share/save actions**: Share button (copy link, social), save/favorite with animation
- **Inquiry CTA**: Prominent "Ask About [Pet Name]" button with pre-filled message template
- **Mobile**: Full-bleed gallery, sticky bottom CTA bar

### 2.5 Organization Profile (`/organizations/[id]`)

- **Cover photo + logo** section
- **Trust status banner** with badges prominently displayed
- **Tab navigation**: About, Listings, Reviews, Resources
- **About tab**: Description, policies, location map, contact info, hours (if applicable)
- **Listings tab**: Grid of their pet listings with filters
- **Reviews tab**: Star distribution, review list, write-review CTA
- **Resources tab**: Articles/tips published by this org

### 2.6 Auth Pages (`/auth/*`)

- **Split layout**: Image panel + form panel (lifestyle pet photo on left, form on right)
- **Social login buttons** (Google, Apple styled as secondary)
- **Form validation**: Inline real-time validation with clear error states
- **Password strength indicator**: Visual bar with requirements checklist
- **Smooth transitions** between login/register/verify states

### 2.7 Messages (`/messages`)

- **Desktop**: 3-panel layout (conversation list | active chat | listing context sidebar)
- **Conversation list**: Avatar, org name, last message preview, unread indicator, timestamp
- **Chat area**: Message bubbles with timestamps, read receipts, typing indicator
- **Context sidebar**: Show the listing being discussed with quick link
- **Mobile**: List → chat navigation with back button
- **Empty state**: Friendly illustration + "Start a conversation" CTA

### 2.8 Favorites (`/favorites`)

- **Grid of saved listings** with ListingCard component
- **Remove button** with undo toast
- **Empty state**: "No favorites yet — start browsing!"
- **Sort/filter options**: By date saved, pet type

### 2.9 AI Assistant (`/ai-assistant`)

- **Chat interface** with branded AI avatar
- **Suggested prompts**: Quick-start cards ("Help me find a dog for my apartment", "What breed is good for families?")
- **Rich responses**: Inline listing cards, resource links, breed comparison tables within chat
- **Source citations**: Expandable source references for trust
- **Clear conversation** option
- **Disclaimer**: Small note about AI limitations

### 2.10 Resources (`/resources`)

- **Magazine-style layout**: Featured article hero + grid of cards
- **Category tabs**: Care Tips, Breed Guides, Adoption Advice, etc.
- **Article cards**: Cover image, title, source org, read time, category tag
- **Article detail**: Clean reading layout, author/source attribution, related articles sidebar

### 2.11 Settings (`/settings`)

- **Tabbed layout**: Profile, Notifications, Security, Privacy
- **Profile**: Avatar upload, display name, bio, location, pet preferences
- **Notifications**: Toggle switches for email/SMS/push per event type
- **Security**: Change password, MFA setup, active sessions
- **Privacy**: Data export, account deletion

---

## 3. Vendor App (`apps/web-vendor`)

### 3.1 Dashboard (`/`)

- **Welcome header** with org name and verification status banner
- **Key metrics row**: Active Listings, Inquiries This Week, Average Response Time, Review Score — each as a StatsCard with trend
- **Action items**: Cards for urgent tasks (respond to inquiry, review pending, document expiring)
- **Recent activity feed**: Timeline of recent events
- **Quick actions grid**: Create Listing, View Messages, Check Reviews, Upload Docs

### 3.2 Listings Management (`/listings`)

- **Table + grid toggle** view
- **Status tabs**: All, Draft, Published, Paused, Adopted/Sold
- **Bulk actions**: Select multiple → publish, pause, archive
- **Individual listing row**: Thumbnail, title, breed, status badge, views, inquiries, date, actions dropdown

### 3.3 Create/Edit Listing (`/listings/new`, `/listings/[id]/edit`)

- **Multi-step wizard** with progress indicator: Photos → Pet Info → Description → Pricing/Fees → Review & Publish
- **Drag-and-drop photo upload** with reorder and crop
- **Auto-save** with draft indicator
- **Breed autocomplete** for the breed field
- **Preview mode**: See listing as a consumer would

### 3.4 Organization Profile (`/organization`)

- **Logo and cover photo upload** with preview
- **Rich text description** editor
- **Location with map pin** adjustment
- **Operating hours** (optional)
- **Policies section**: Return, health guarantee, adoption process
- **Verification status and requirements** panel

### 3.5 Other vendor pages

- **Messages**: Similar to consumer but with org inbox view and conversation assignment
- **Reviews**: Dashboard showing rating distribution, recent reviews, response queue
- **Documents**: Upload interface with status per document type, expiration alerts
- **Members**: Team list with role management, invite by email
- **Analytics**: Charts for listing views, inquiry trends, response time, review trends

---

## 4. Admin App (`apps/web-admin`)

### 4.1 Dashboard

- **Stats grid**: Total Users, Active Vendors, Open Cases, Pending Verifications, Flagged Content — each with sparkline trend
- **Charts**: Use simple CSS/SVG chart components (no heavy chart library needed for MVP)
  - New registrations over time
  - Cases by status (donut)
  - Listings by category (bar)
- **Alerts**: High-priority cases, overdue SLAs, flagged vendors
- **Recent activity**: Audit log stream

### 4.2 Cases (`/cases`)

- **Filterable table**: Status, priority, severity, type, assignee, date range
- **Case detail**: Header with status/priority, timeline of events, notes panel, assignment panel, evidence gallery, action buttons
- **Quick triage**: Bulk assign, bulk prioritize

### 4.3 Moderation (`/moderation`)

- **Queue view** with content preview cards
- **Side-by-side comparison**: Original content + context
- **Quick action buttons**: Approve, Reject, Flag for Review, Escalate
- **Filters**: Content type, risk score, date

### 4.4 Organizations (`/organizations`)

- **Table with search**: Name, type, status, verification, region, date
- **Detail page**: Full org profile, verification history timeline, documents, badges management, enforcement actions

### 4.5 Users (`/users`)

- **Table with search**: Name, email, status, role, risk level, join date
- **Detail view**: Profile, activity history, reviews given, reports filed, risk signals

### 4.6 Other admin pages

- **Partners**: Directory of partner organizations with capability tags, region assignment, status
- **Audit Log**: Searchable, filterable audit trail with expandable event details
- **AI pages**: Correspondence review queue, discovery pipeline results

---

## 5. Partner App (`apps/web-partner`)

### 5.1 Dashboard

- **Assigned cases count** with priority breakdown
- **Pending validations** queue
- **SLA status indicators**: On-track (green), at-risk (amber), overdue (red)
- **Organization profile** completeness indicator

### 5.2 Cases & Validations

- Similar patterns to admin cases but scoped to partner assignments
- **Document review panel**: Side-by-side document viewer + checklist
- **Finding submission form**: Structured findings with evidence attachment
- **Status recommendation**: Approve/reject/request-more-info with notes

---

## 6. Kiosk App (`apps/web-kiosk`)

### 6.1 Design principles for kiosk

- **Extra large touch targets** (minimum 60px)
- **High contrast** for varied lighting conditions
- **Minimal text, maximum visuals**
- **No small interactive elements** — everything finger-friendly
- **Auto-reset** to home after inactivity (already implemented)

### 6.2 Home (`/`)

- **Full-screen** animated welcome with partner branding
- **Large pet type cards** with photo and count
- **"Get Personalized Recommendations"** large CTA button
- **Simple visual design** — no nav complexity

### 6.3 Discover & Listing Detail

- **Larger cards** than web-consumer (fewer per row, bigger photos)
- **Swipe/scroll friendly** with snap scrolling
- **Simplified listing detail**: Essential info only, prominent QR handoff

### 6.4 AI Guide

- **Full-screen conversational flow** with large text
- **Big preset question buttons** instead of free typing
- **Results as large swipeable cards**

---

## 7. Cross-Cutting UX Improvements

### 7.1 Loading states

Every page/component must have proper loading states using Skeleton components. No blank pages during data fetch.

### 7.2 Error states

- Friendly error pages (404, 500) with illustrations and recovery actions
- Inline error handling with retry buttons
- Toast notifications for background errors

### 7.3 Empty states

Every list/grid view needs a designed empty state with illustration, explanation, and CTA.

### 7.4 Animations and transitions

- Page transitions: Subtle fade between routes
- Card hover: Smooth elevation lift (translateY -2px + shadow increase)
- Button press: Subtle scale (0.98) on active
- Modal: Scale from 0.95 + fade in, blur backdrop
- Toast: Slide in from top-right, auto-dismiss with progress bar
- Number counters: Animate counting on scroll into view
- Image loading: Blur placeholder → sharp image transition

### 7.5 Responsive design checklist

For every page, test at:
- **Mobile** (375px): Single column, stacked layouts, bottom sheet filters, sticky CTAs
- **Tablet** (768px): 2-column grids, sidebar overlays
- **Desktop** (1024px): Full layouts with sidebars
- **Large** (1440px): Max-width container, comfortable spacing

### 7.6 Micro-interactions

- Heart/favorite: Animate fill on click with brief scale pulse
- Star rating: Stars illuminate sequentially on hover
- Copy link: Brief "Copied!" tooltip
- Form submit: Button transitions to loading state smoothly
- Toast dismiss: Swipe away or click X

---

## Execution Checklist

When working on this phase, use this order:

```
- [ ] 1. Design system upgrades (packages/ui) — new components + theme
- [ ] 2. Consumer homepage overhaul
- [ ] 3. Consumer search results
- [ ] 4. Consumer listing detail
- [ ] 5. Consumer organization profile
- [ ] 6. Consumer auth pages
- [ ] 7. Consumer messages, favorites, AI assistant, resources, settings
- [ ] 8. Vendor app — dashboard, listings, org, messages, reviews, analytics
- [ ] 9. Admin app — dashboard, cases, moderation, organizations, users
- [ ] 10. Partner app — dashboard, cases, validations
- [ ] 11. Kiosk app — home, discover, AI guide, handoff
- [ ] 12. Cross-cutting: loading/error/empty states, animations, responsive
```

For each item, create todos breaking it into specific sub-tasks, work through them sequentially, and verify the build passes after each significant change.
