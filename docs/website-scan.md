# Design Doc Addendum: Scan-Centric Crawl System with Animal Listings and Promotion Pipeline

## 1. Updated requirements

The system must now satisfy these additional constraints:

1. **If a site lists individual animals, each scan must scrape the individual animal information.**
2. **All information from each page must be captured in both page-markdown form and extracted structured data form for each scan.**
3. **Each scan of a website must be maintained separately in the database.**
4. **After quality checks are performed, approved data is migrated into the working production database.**

These requirements change the architecture from a simple recrawl-and-overwrite model to a **versioned scan archive + promotion pipeline**.

---

## 2. Updated architecture

We now separate the system into two major data environments:

## 2.1 Crawl/scan database

Immutable, append-only, stores every scan separately.

Contains:

* website scan records
* page snapshots
* page markdown
* extracted page-level structured data
* extracted entity-level structured data
* extracted animal-listing structured data
* quality-check results
* promotion decisions

## 2.2 Working production database

Curated database used by downstream apps and consumers.

Contains:

* deduplicated current organizations
* deduplicated current animal listings
* approved trust scores
* approved references
* current active contact data
* canonical production views

This gives us:

```text id="q0zljf"
Internet -> Crawl/Scan DB -> QA / Validation / Review -> Production DB
```

---

## 3. Key model change: scan is the primary unit

Previously, the entity was the main focus. Now the **scan** becomes the base record.

Every crawl event for a website or domain should create a new scan record, and every page fetched during that scan should be associated with that specific scan.

## 3.1 Definitions

### Website

A logical source domain or organization site.
Examples:

* `petfinder.com`
* `examplehumane.org`

### Scan

A specific crawl execution against a website at a point in time.

### Page snapshot

A fetched page captured during a scan.

### Extracted record

Structured output derived from a page snapshot during a scan.

### Promotion

The act of moving approved scan-derived data into production.

---

## 4. Updated data lifecycle

## Stage 1: Scan acquisition

For each website scan:

* create scan record
* fetch pages
* store raw HTML/PDF/etc.
* generate markdown for each page
* run structured extraction
* detect organization-level data
* detect animal-listing data
* store all results tied to the scan

## Stage 2: Quality checks

Run automated checks:

* schema validation
* contact completeness
* duplicate detection
* category confidence
* animal listing consistency
* URL canonicalization
* address normalization
* trust-score evidence completeness

## Stage 3: Review / approval

Optional human-in-the-loop review for:

* low-confidence pages
* ambiguous organizations
* contradictory contact info
* suspicious animal listings
* unexpected deltas from prior scans

## Stage 4: Promotion to production

Only data that passes the quality gate is migrated into the production database.

---

## 5. Updated architecture diagram

```text id="fjlwmv"
                     +----------------------+
                     | Seed Source Registry |
                     +----------+-----------+
                                |
                                v
                     +----------+-----------+
                     | Scan Orchestrator     |
                     +----------+-----------+
                                |
                                v
                     +----------+-----------+
                     | Website Scan Record   |
                     +----------+-----------+
                                |
                 +--------------+---------------+
                 |                              |
                 v                              v
      +----------+-----------+      +-----------+----------+
      | Page Fetch + Snapshot |      | Listing Discovery    |
      | raw html/pdf/text     |      | animal detail pages  |
      +----------+-----------+      +-----------+----------+
                 |                              |
                 v                              v
      +----------+-----------+      +-----------+----------+
      | Page Markdown Store   |      | Animal Extraction    |
      +----------+-----------+      +-----------+----------+
                 |                              |
                 +--------------+---------------+
                                |
                                v
                     +----------+-----------+
                     | Structured Extraction |
                     | org/page/animal       |
                     +----------+-----------+
                                |
                                v
                     +----------+-----------+
                     | Crawl/Scan Database   |
                     | immutable snapshots   |
                     +----------+-----------+
                                |
                                v
                     +----------+-----------+
                     | Quality Checks / QA   |
                     +----------+-----------+
                                |
                                v
                     +----------+-----------+
                     | Promotion Pipeline    |
                     +----------+-----------+
                                |
                                v
                     +----------+-----------+
                     | Production Database   |
                     +----------------------+
```

---

## 6. New core schema design

## 6.1 Crawl database tables

### `websites`

Logical site registry.

Fields:

* `website_id`
* `domain`
* `base_url`
* `source_type`
* `organization_hint`
* `active`
* `created_at`

---

### `website_scans`

One row per scan of a website.

Fields:

* `scan_id`
* `website_id`
* `started_at`
* `completed_at`
* `scan_type` (`full`, `incremental`, `targeted`)
* `trigger_type` (`scheduled`, `manual`, `retry`)
* `status` (`running`, `completed`, `failed`, `partial`)
* `crawler_version`
* `extractor_version`
* `config_version`
* `page_count`
* `listing_count`
* `notes`

Important rule:

* never overwrite prior scans
* every scan is immutable after completion except QA annotations

---

### `scan_pages`

One row per fetched page in a scan.

Fields:

* `scan_page_id`
* `scan_id`
* `url`
* `canonical_url`
* `content_type`
* `http_status`
* `fetch_started_at`
* `fetch_completed_at`
* `checksum`
* `raw_storage_path`
* `rendered_text_storage_path`
* `markdown_storage_path`
* `title`
* `meta_description`
* `page_type` (`home`, `about`, `contact`, `directory`, `animal_listing`, `animal_detail`, `faq`, `policy`, `other`)
* `discovered_from_url`
* `depth`
* `is_listing_page`
* `is_detail_page`

---

### `scan_page_markdown`

Stores the markdown representation for each scanned page.

Fields:

* `scan_page_id`
* `markdown_content`
* `markdown_generator_version`
* `created_at`

Rule:

* every scanned page should have markdown unless generation failed
* markdown generation failure should be explicitly recorded

---

### `scan_page_extractions`

Page-level structured extraction results.

Fields:

* `scan_page_extraction_id`
* `scan_page_id`
* `extraction_type` (`organization`, `contact`, `policy`, `animal_list_page`, `animal_detail_page`, `service_area`, `trust_signal`, `other`)
* `json_payload`
* `extractor_name`
* `extractor_version`
* `confidence`
* `created_at`

This is a flexible extracted-data table at the page level.

---

### `scan_entities`

Organization-level extracted entity snapshot for a given scan.

Fields:

* `scan_entity_id`
* `scan_id`
* `entity_key_candidate`
* `name`
* `canonical_website`
* `category`
* `subcategory`
* `organization_type`
* `pet_types`
* `breeds`
* `area_served_json`
* `summary_description`
* `trust_score_candidate`
* `json_payload`
* `confidence`
* `created_at`

Important:

* this is the organization as observed in that scan
* not yet canonical production truth

---

### `scan_entity_contacts`

Structured contacts extracted during a scan.

Fields:

* `scan_entity_contact_id`
* `scan_entity_id`
* `contact_type` (`email`, `phone`, `address`)
* `label`
* `value_raw`
* `value_normalized`
* `confidence`
* `source_scan_page_id`

---

### `scan_animal_listings`

This is the big new requirement.

Each scan must capture individual animals when sites list them.

Fields:

* `scan_animal_listing_id`
* `scan_id`
* `source_scan_page_id`
* `detail_scan_page_id`
* `listing_url`
* `listing_external_id`
* `name`
* `animal_type` (`dog`, `cat`, `bird`, `other`)
* `breed`
* `secondary_breed`
* `sex`
* `age_text`
* `age_category`
* `size`
* `color`
* `coat`
* `adoption_status`
* `availability_status`
* `special_needs`
* `good_with_children`
* `good_with_dogs`
* `good_with_cats`
* `house_trained`
* `spayed_neutered`
* `vaccinated`
* `declawed`
* `description`
* `location_city`
* `location_state`
* `organization_name`
* `organization_reference`
* `posted_date`
* `updated_date`
* `photo_urls_json`
* `attribute_json`
* `json_payload`
* `confidence`
* `created_at`

Important:

* this table is per scan
* the same animal may appear again in future scans as a new record
* we preserve history

---

### `scan_animal_listing_markdown`

Optional but recommended if animal detail pages are rich enough.

Fields:

* `scan_animal_listing_id`
* `markdown_content`
* `created_at`

If the animal detail page exists, store its markdown too.

---

### `scan_animal_listing_evidence`

Field-level provenance for animal records.

Fields:

* `scan_animal_listing_evidence_id`
* `scan_animal_listing_id`
* `field_name`
* `source_scan_page_id`
* `source_snippet`
* `extractor_name`
* `confidence`

---

### `scan_quality_checks`

Stores validation results by scan.

Fields:

* `scan_quality_check_id`
* `scan_id`
* `check_name`
* `check_status` (`pass`, `warn`, `fail`)
* `severity`
* `details_json`
* `created_at`

---

### `scan_promotion_batches`

Tracks promotion attempts to production.

Fields:

* `promotion_batch_id`
* `scan_id`
* `started_at`
* `completed_at`
* `status`
* `approved_by`
* `notes`

---

### `scan_promotion_results`

Tracks what got promoted.

Fields:

* `promotion_result_id`
* `promotion_batch_id`
* `record_type` (`organization`, `animal_listing`, `contact`, `trust_signal`)
* `source_record_id`
* `target_record_id`
* `action` (`insert`, `update`, `deactivate`, `skip`)
* `notes`

---

## 7. Dual capture requirement: markdown + extracted data

Your requirement says all information must be captured in:

1. **page markdown format**
2. **extracted data format**

This should be treated as a hard invariant.

## 7.1 Page markdown

For every page fetched:

* store raw HTML/PDF/text
* convert to normalized markdown
* persist markdown per scan page

Markdown should preserve:

* headings
* body text
* tables when possible
* lists
* links
* image alt text if available

## 7.2 Extracted structured data

From the same page, generate structured outputs such as:

* contact info
* entity classification
* animal-listing attributes
* trust signals
* service area
* policies

## 7.3 Why both are needed

Markdown gives:

* auditability
* human review support
* rerun capability for future extractors
* simpler LLM reprocessing

Structured extraction gives:

* queryable fields
* analytics
* dedupe
* promotion into production

---

## 8. Animal listing scraping design

## 8.1 Detection of animal-listing sites

The crawler should identify pages that list adoptable or available animals.

Signals:

* repeated cards with pet names/photos
* links to detail pages
* filters like breed/age/sex/size
* phrases like:

  * adoptable pets
  * available dogs
  * available cats
  * parrots for adoption
  * meet our pets
  * view details
  * apply to adopt

## 8.2 Listing page vs detail page

### Listing page

Contains multiple animals.
Example fields:

* name
* thumbnail
* breed
* age
* location
* detail URL

### Detail page

Contains the full animal profile.
Example fields:

* full description
* behavior/compatibility
* medical/adoption status
* photo gallery
* intake/update date

The system should support both:

* extracting summary rows from listing pages
* enriching with detail-page extraction where available

## 8.3 Animal extraction strategy

### Step 1

Detect listing containers/cards.

### Step 2

Extract candidate rows.

### Step 3

Follow detail links.

### Step 4

Merge listing-page and detail-page attributes into a scan-scoped animal record.

### Step 5

Store raw page references and markdown for both page types.

---

## 8.4 Animal identity across scans

Because each scan is stored separately, do not force global uniqueness at crawl time.

Instead maintain:

* `listing_external_id` if the site exposes one
* `listing_url`
* image fingerprint if useful
* normalized name + org + breed + location heuristic

This supports later cross-scan continuity analysis without collapsing scan history.

---

## 9. Per-scan immutability

You explicitly want each scan maintained separately.

That means:

* no in-place mutation of extracted scan results after completion
* corrections should be represented as:

  * QA annotations
  * superseding extraction runs
  * promotion overrides
* scan records are historical artifacts

## 9.1 Allowed mutable fields

These may change after scan completion:

* QA status
* review notes
* promotion status
* derived quality metrics

## 9.2 Immutable fields

These should not change:

* raw page artifact
* markdown content for that exact artifact
* original extraction payload
* timestamps
* URLs fetched

If a better extractor is introduced later, create a new extraction version row, not overwrite the previous one.

---

## 10. Quality checks before promotion

Promotion to production should be gated by automated and optional human checks.

## 10.1 Organization checks

* valid schema
* category confidence above threshold
* at least one contact signal or strong official-site evidence
* no catastrophic parse errors
* website canonicalization consistent
* trust references present if trust score exists

## 10.2 Animal-listing checks

* animal type present
* name or external ID present
* listing URL or detail page source present
* organization linkage valid
* if status says available/adoptable, page must not indicate archived/unavailable
* breed normalization done where possible
* duplicate listing detection within the same scan

## 10.3 Page checks

* markdown exists
* extraction exists or explicitly recorded as none
* content checksum valid
* page type classified

## 10.4 Promotion thresholds

Example:

* promote automatically if all required checks pass and confidence high
* queue for review if warnings only
* block promotion on failures

---

## 11. Production database design

Production should not mirror raw scan history. It should store the approved working state.

## 11.1 Production organization tables

* `organizations`
* `organization_contacts`
* `organization_trust_signals`
* `organization_source_refs`

## 11.2 Production animal tables

* `animals`
* `animal_attributes`
* `animal_photos`
* `animal_source_refs`
* `animal_status_history`

## 11.3 Link back to source scan

Every production record should retain lineage:

* `source_scan_id`
* `source_record_id`
* `promoted_at`
* `promotion_batch_id`

This preserves traceability.

---

## 12. Promotion logic

Promotion is not a raw copy. It is a controlled transform.

## 12.1 Promotion for organizations

For each approved `scan_entity`:

* match against production organization by canonical domain and other identifiers
* insert if new
* update if changed and approved
* preserve lineage

## 12.2 Promotion for animals

For each approved `scan_animal_listing`:

* resolve to production animal using:

  * external listing ID
  * canonical listing URL
  * org + normalized name + breed + location
* insert new animal if unseen
* update active record if same animal reappears
* mark missing animals as potentially inactive only after multiple scans or confidence rules

## 12.3 Promotion policy for disappearing animals

Do not immediately delete from production if absent in one scan.
Instead:

* set `last_seen_scan_id`
* optionally move to `stale` after N missed scans
* move to inactive only after threshold met

This avoids false removals from partial crawl failures.

---

## 13. Updated recommended schema for extracted page payloads

## 13.1 Page extraction JSON

```json id="4q4ref"
{
  "page_type": "animal_detail",
  "organization_candidates": [
    {
      "name": "Example Humane Society",
      "category": "humane_society",
      "confidence": 0.94
    }
  ],
  "contacts": [
    {
      "type": "phone",
      "value": "(512) 555-0100",
      "normalized": "+1-512-555-0100",
      "confidence": 0.98
    }
  ],
  "animal_candidates": [
    {
      "name": "Bella",
      "animal_type": "dog",
      "breed": "Labrador Retriever Mix",
      "sex": "Female",
      "age_text": "2 years old",
      "adoption_status": "Available",
      "confidence": 0.95
    }
  ]
}
```

## 13.2 Animal listing JSON

```json id="4gu8ka"
{
  "listing_external_id": "pet-12345",
  "listing_url": "https://example.org/adopt/bella",
  "name": "Bella",
  "animal_type": "dog",
  "breed": "Labrador Retriever Mix",
  "sex": "Female",
  "age_text": "2 years old",
  "size": "Large",
  "color": "Black",
  "adoption_status": "Available",
  "good_with_children": true,
  "good_with_dogs": true,
  "good_with_cats": false,
  "spayed_neutered": true,
  "vaccinated": true,
  "description": "Bella is a friendly and energetic dog...",
  "location_city": "Austin",
  "location_state": "TX",
  "photo_urls": [
    "https://example.org/images/bella1.jpg"
  ],
  "source_pages": [
    "https://example.org/adopt",
    "https://example.org/adopt/bella"
  ]
}
```

---

## 14. Updated pipeline pseudocode

```python id="wrwsug"
def run_website_scan(website_id: str, scan_type: str = "full"):
    scan = create_website_scan(website_id, scan_type=scan_type)

    frontier = build_frontier_for_website(website_id)

    while frontier.has_items():
        item = frontier.pop()

        page = fetch_page(item.url, scan_id=scan.scan_id)
        scan_page = persist_scan_page(scan.scan_id, page, item)

        markdown = generate_markdown(page)
        persist_scan_page_markdown(scan_page.scan_page_id, markdown)

        page_extractions = extract_page_structured_data(page, markdown)
        persist_scan_page_extractions(scan_page.scan_page_id, page_extractions)

        org_candidates = extract_organization_candidates(page_extractions)
        persist_scan_entities(scan.scan_id, org_candidates, scan_page)

        animal_candidates = extract_animal_candidates(page_extractions, page, markdown)
        persist_scan_animal_listings(scan.scan_id, animal_candidates, scan_page)

        new_links = discover_relevant_links(page, page_extractions)
        frontier.enqueue(new_links)

    run_scan_quality_checks(scan.scan_id)
    finalize_scan(scan.scan_id)
```

---

## 15. Promotion pseudocode

```python id="r7o3ay"
def promote_scan_to_production(scan_id: str):
    checks = load_quality_check_summary(scan_id)
    if not checks.is_promotable:
        raise ValueError("Scan failed promotion gate")

    batch = create_promotion_batch(scan_id)

    scan_entities = load_approved_scan_entities(scan_id)
    for entity in scan_entities:
        target = upsert_production_organization(entity, batch)
        record_promotion_result(batch, "organization", entity.scan_entity_id, target.organization_id)

    scan_animals = load_approved_scan_animal_listings(scan_id)
    for animal in scan_animals:
        target = upsert_production_animal(animal, batch)
        record_promotion_result(batch, "animal_listing", animal.scan_animal_listing_id, target.animal_id)

    finalize_promotion_batch(batch)
```

---

## 16. Repository structure changes

```text id="4p7h1r"
pet-source-crawler/
  crawler/
    scans/
      orchestrator.py
      lifecycle.py
    fetcher.py
    parser.py
    markdown.py
    extractors/
      page_classifier.py
      contacts.py
      organizations.py
      animal_listings.py
      animal_details.py
      service_area.py
      summaries.py
      trust_signals.py
    qa/
      checks.py
      organization_checks.py
      animal_checks.py
      page_checks.py
    promotion/
      promote_organizations.py
      promote_animals.py
      lineage.py
  storage/
    crawl_schema.sql
    production_schema.sql
  scripts/
    run_scan.py
    run_quality_checks.py
    promote_scan.py
```

---

## 17. New implementation requirements for Cursor/Claude

Use this updated brief:

```text id="5fc7u7"
Build a scan-centric Python crawling system for U.S. pet-source discovery.

Hard requirements:
1. Every website crawl must create a distinct immutable scan record.
2. Every scanned page must be stored in raw form and also converted into markdown.
3. Every scanned page must also have extracted structured data stored separately.
4. If the site lists individual animals, scrape the animal data into scan-scoped animal listing records.
5. Preserve all scan results historically in the crawl database.
6. After automated quality checks, approved data must be promoted into a separate production database.
7. Promotion must preserve lineage back to scan_id and source record ids.

Need schemas for:
- websites
- website_scans
- scan_pages
- scan_page_markdown
- scan_page_extractions
- scan_entities
- scan_entity_contacts
- scan_animal_listings
- scan_quality_checks
- scan_promotion_batches
- scan_promotion_results
- production organizations and animals

Implement:
- scan orchestrator
- page fetch and markdown generator
- organization extractor
- animal-listing extractor
- quality-check pipeline
- promotion pipeline
- tests for scan immutability, animal extraction, markdown capture, and promotion behavior
```
