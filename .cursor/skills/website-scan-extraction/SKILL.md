---
name: website-scan-extraction
description: Directs the parsing and extraction of animal listings from shelter/rescue websites. Use when scanning websites, extracting pet listings, building site-specific configs, improving extraction quality, or debugging scan results. Covers the full pipeline from crawling to structured data extraction.
---

# Website Scan & Extraction Skill

## Architecture overview

The scan system lives in `apps/website-scan/` and follows a pipeline:

```
Website → Orchestrator → Page Fetcher → Page Classifier → Extractors → Database
                                                              ↓
                                                    SiteExtractionConfig
                                                    (per-site, from DB)
```

Key files:

| Component | Path |
|-----------|------|
| Orchestrator | `src/modules/scans/scan-orchestrator.service.ts` |
| Page classifier | `src/modules/extraction/page-classifier.service.ts` |
| Animal extractor | `src/modules/extraction/animal-extractor.service.ts` |
| Org extractor | `src/modules/extraction/organization-extractor.service.ts` |
| Extraction service | `src/modules/extraction/extraction.service.ts` |
| Site config types | `src/modules/extraction/site-extraction-config.ts` |
| Page fetcher | `src/modules/pages/page-fetcher.service.ts` |
| Prisma schema | `packages/database/prisma/schema.prisma` (CrawlWebsite, ScanAnimalListing) |
| Admin UI scan detail | `apps/web-admin/src/app/scan/[id]/page.tsx` |
| Admin UI animal detail | `apps/web-admin/src/app/scan/animals/[id]/page.tsx` |

## Generic vs site-specific logic

### Separation principle

All extraction logic splits into two layers:

1. **Generic layer** — lives in TypeScript methods, works across any shelter/rescue site, uses `DEFAULT_CONFIG`
2. **Site-specific layer** — stored as JSON in `CrawlWebsite.extractionConfig`, loaded at scan start, merged over defaults

**Never hardcode site-specific selectors, patterns, or URL structures in the TypeScript code.** If something only applies to one site, it belongs in that site's `extractionConfig` JSON.

### SiteExtractionConfig schema

Stored in `CrawlWebsite.extractionConfig` as JSON. The TypeScript interface:

```typescript
interface SiteExtractionConfig {
  rendering?: {
    requiresJs?: boolean;       // Use Playwright headless browser
    waitForSelector?: string;   // CSS selector to wait for after page load
    waitMs?: number;            // Additional wait after navigation (ms)
    blockResources?: string[];  // Resource types to block: "image","media","font"
  };
  gallery?: {
    imageSelector?: string;      // CSS-style selector for gallery images
    imageSrcAttribute?: string;  // Comma-separated priority: "data-lazy,data-src,src"
    containerSelector?: string;  // Gallery container class: ".img-holder"
    excludeSelectors?: string[]; // Sections to exclude from image scan
  };
  cards?: {
    selectors?: string[];        // CSS class names for listing cards
    nameSelector?: string;       // Selector for pet name within card
  };
  detailUrlPatterns?: string[];  // URL substrings identifying detail pages
  excludeSections?: string[];    // HTML sections to strip before extraction
  excludeImagePatterns?: string[]; // URL substrings to filter out
  boilerplatePatterns?: string[];  // Regex patterns for org-wide boilerplate
  thumbnailPathPatterns?: string[]; // Regex patterns to strip for full-res URLs
}
```

### Config loading flow

1. Orchestrator loads `website.extractionConfig` from DB at scan start
2. Calls `animalExtractor.setConfig(siteConfig)`
3. `setConfig` merges site config over `DEFAULT_CONFIG` via `mergeConfigs()`
4. All extraction methods read from `this.config`

## Scanning a new website

### Step 1: Initial scan with defaults

Add the website and run a scan with no custom config:

```bash
curl -X POST http://localhost:5200/api/v1/scan/websites \
  -H "Content-Type: application/json" \
  -d '{"domain":"www.example-shelter.org","baseUrl":"https://www.example-shelter.org","sourceType":"shelter"}'

curl -X POST http://localhost:5200/api/v1/scan/scans \
  -H "Content-Type: application/json" \
  -d '{"websiteId":"<id>","scanType":"FULL","triggerType":"MANUAL","sync":true}'
```

### Step 2: Analyze results and identify issues

Check the scan results in the admin UI or via API. Common issues:

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| 0 animals found | Page classifier not detecting listing/detail pages | Check URL patterns in classifier |
| Low photo count | Gallery selector doesn't match | Add `gallery.imageSelector` to config |
| Wrong photos (featured pet leak) | Exclude selectors missing | Add to `gallery.excludeSelectors` |
| Junk listings | Card selector too broad | Refine `cards.selectors` in config |
| Boilerplate in health tags | Org-wide text not stripped | Add regex to `boilerplatePatterns` |
| Thumbnail URLs | Thumbnail path not recognized | Add to `thumbnailPathPatterns` |

### Step 3: Build site-specific config

Inspect the site's HTML to identify:

1. **Gallery images** — What class/attribute do pet photos use?
2. **Card containers** — What class wraps each pet on listing pages?
3. **Excluded sections** — What divs contain featured/related/sidebar content?
4. **Boilerplate** — What text describes org-wide policies (fee includes, all pets receive...)?
5. **Thumbnail patterns** — What URL path segments indicate thumbnails?

### Step 4: Save config to database

```sql
UPDATE "CrawlWebsite" SET "extractionConfig" = '{
  "gallery": { "imageSelector": "img.pet-photo", "imageSrcAttribute": "data-src,src" },
  "cards": { "selectors": ["pet-card"] },
  "excludeSections": ["header","footer","nav","sidebar","featured-section"],
  "boilerplatePatterns": ["adoption fee includes[\\s\\S]{0,300}?microchip"]
}'::jsonb WHERE domain = 'www.example-shelter.org';
```

Or via API: `PATCH /api/v1/scan/websites/:id { "extractionConfig": { ... } }`

### Step 5: Rescan and verify

Run another scan. The config is loaded automatically.

## Animal listing extraction

### Page classification

The classifier (`page-classifier.service.ts`) runs in this priority:

1. **URL-based listing detection** — known listing URL patterns (e.g., `/adopt/dogs`)
2. **URL-based detail detection** — known detail URL patterns (e.g., `/adopt/dogs/pet-123`)
3. **Signal-based listing** — title keywords, card counts in HTML, animal link density
4. **Signal-based detail** — title patterns ("Meet Bella"), content signals (breed/age/sex fields)

Listing check runs before detail check for URL patterns. This prevents category pages like `/adopt/dogs` from being misclassified as detail pages.

### Crawl strategy for listings

The orchestrator uses a priority-based frontier:

| Priority | Type | Description |
|----------|------|-------------|
| 0 | Detail pages | Individual animal URLs from cards or `extractDetailUrlsFromListingPage` |
| 1 | Pagination | Next page links from listing pages |
| 2 | Discovery | General link following |

When a listing page is found:
1. Extract animal cards → queue their `listingUrl` as priority 0
2. Run `extractDetailUrlsFromListingPage` as fallback → queue missing URLs as priority 0
3. Discover pagination links → queue as priority 1 at same depth

Pagination pages skip the depth limit since they're logically the same listing.

### Detail page extraction

For each detail page, the extractor produces an `AnimalCandidate` with:

**Core fields** (extracted from labeled fields + inline patterns):
- `name`, `animalType`, `breed`, `secondaryBreed`
- `sex`, `ageText`, `ageCategory`, `size`, `color`, `coat`, `weight`
- `adoptionStatus`, `adoptionFee`, `description`
- `listingExternalId` (from data attributes or URL)

**Health & compatibility** (use `animalSpecificText` with boilerplate stripped):
- `spayedNeutered`, `vaccinated`, `microchipped`, `declawed`
- `goodWithChildren`, `goodWithDogs`, `goodWithCats`, `houseTrained`

**Training & behavior traits** (stored in `attributeJson`):
- `crateTrained`, `pottyTrained`, `leashTrained`, `litterBoxTrained`
- `goodInCar`, `freeRoam`, `knowsBasicCommands`
- `energyLevel`, `separationAnxiety`, `fenceRequired`, `goodWithSeniors`

**Adoption requirements** (stored in `attributeJson.adoptionRequirements`):
- `minimum_age`, `location_radius`, `fenced_yard`, `home_visit`
- `landlord_approval`, `vet_reference`, `children_age`, `only_pet`
- `application`, `experience`, `identification`

**Media**:
- `photoUrls` — from gallery (config-driven), carousel, or fallback
- `videoUrls` — from `<video>`, YouTube iframes, `data-video` attrs, `.mp4` URLs

### Quality gates

Listings are filtered at two levels:

1. **Candidate validation** — name must exist + at least 1 other field (breed, type, photo, etc.)
2. **Detail page validation** — name + at least 2 other fields
3. **Confidence threshold** — only persist listings with confidence > 70%
4. **Animal type filter** — only DOG, CAT, BIRD are saved (rabbits, reptiles, etc. detected as SCAN_OTHER and excluded)

### Lessons learned from APA

These patterns apply broadly and inform the generic extraction logic:

1. **Gallery-first image extraction** — if a dedicated gallery selector finds ≥2 images, use only those. Prevents featured/sidebar images from leaking in.

2. **HTML attributes may have spaces before `=`** — always use `\s*=\s*` in attribute regexes (e.g., `data-lazy ="url"` on APA).

3. **Org-wide boilerplate corrupts health tags** — "Our adoption fee includes: spay/neuter, vaccinations, microchip" is about the org, not the individual animal. Always strip boilerplate before boolean detection.

4. **Strict boolean detection** — require contextual phrasing like "is spayed", "has been vaccinated", "already neutered" rather than bare keyword matches. This prevents form labels ("Are your pets fully vaccinated?") from triggering.

5. **Featured pet sections use `<a>` wrappers** — featured pet images are often inside `<a href="/other-pet-url">` links. Only extract from `<div>` gallery containers, not `<a>` linked containers.

6. **Thumbnail URL upgrade** — CDNs often serve thumbnails at paths like `/_galleryThumb/` or `/_largeThumb/`. Strip these path segments to get full-res URLs.

7. **Description extraction needs nav stripping** — markdown descriptions often include navigation list items. Filter paragraphs that start with `- ` or contain nav-like keywords.

8. **Location extraction must be strict** — loose `City, ST` regex matches words like "Foster" as city names. Only extract from explicitly labeled location fields.

9. **Non-pet animal filtering** — sites list rabbits, guinea pigs, etc. Detect these as `SCAN_OTHER` and exclude from persistence while still following their URLs (they may link to dog/cat pages).

10. **LLM org descriptions beat regex** — use GPT-4o-mini with HOME/ABOUT page markdown to generate a professional org summary. Far better than extracting `og:description` which often contains schedules or form text.

## Organization extraction

The org extractor runs on HOME, ABOUT, and CONTACT pages and collects:

- Name, category, type, pet types, address, social links
- Logo (from `<img>` with logo class, `<header>` images, og:image)
- Accreditations (501(c)(3), No-Kill, BBB, ASPCA, etc.)
- Reviews (Schema.org ratings, star elements, rating text)
- Mission statement (from markdown headers/sections)

After all pages are crawled, the orchestrator calls `generateOrgDescriptionWithLLM()` which:
1. Collects markdown from up to 5 HOME/ABOUT pages
2. Sends to GPT-4o-mini with a professional copywriter prompt
3. Updates the entity's `summaryDescription`

## Admin UI

The scan detail page (`/scan/[id]`) shows:
- **Pages tab** — all crawled pages with type, depth, HTTP status
- **Entities tab** — org details with logo, description, mission, accreditations, social, reviews, images
- **Animals tab** — listing table with photo thumbnails, breed, sex, age, status
- **QA tab** — quality check results

The animal detail page (`/scan/animals/[id]`) shows:
- Scrollable photo gallery with prev/next arrows and thumbnail strip
- Core details (breed, sex, age, size, color, coat, weight, fee)
- Compatibility & Health badges
- Training & Behavior traits
- Description (full text, no truncation)
- Adoption requirements
- Videos (embedded YouTube or links)
- Source page references
