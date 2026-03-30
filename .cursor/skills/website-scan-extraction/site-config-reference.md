# Site Config Reference

## APA (Austin Pets Alive!) — Reference Config

This is the production config for `www.austinpetsalive.org`, stored in `CrawlWebsite.extractionConfig`.

```json
{
  "gallery": {
    "imageSelector": "img.gallery-img",
    "imageSrcAttribute": "data-lazy,data-src,src",
    "containerSelector": ".img-holder",
    "excludeSelectors": [
      "featured-pets-sidebar", "featured-pet", "featured-dog",
      "featured-cat", "related-pets", "sidebar"
    ]
  },
  "cards": {
    "selectors": ["large-tile", "small-tile", "pet-card", "animal-card", "adoptable"],
    "nameSelector": "h3 a"
  },
  "detailUrlPatterns": [
    "/adopt/dogs/apa-a-",
    "/adopt/cats/apa-a-",
    "/adopt/other-animals/apa-a-"
  ],
  "excludeSections": [
    "header", "footer", "nav", "aside",
    "featured-pets-sidebar", "featured-pet", "featured-dog",
    "blog", "newsletter", "social-share", "breadcrumb",
    "donate-sidebar", "donate-cta"
  ],
  "excludeImagePatterns": [
    "logo", "icon", "sprite", "badge", "button", "pixel", "tracking",
    "avatar", "banner", "social", "favicon", "spacer", "placeholder",
    "blank", "transparent", "star-full", "star-empty", "achievement",
    "heart", "arrow", "cta", "seo-image", "NextdoorAward", "ball-so-hard"
  ],
  "boilerplatePatterns": [
    "adoption\\s+fee\\s+(?:includes?|covers?|varies?)\\s*:?[\\s\\S]{0,500}?(?:microchip|lifetime\\s+behavior|accepted\\s+forms?\\s+of\\s+payment|visit\\s+our\\s+faq)",
    "(?:spay|neuter)\\s+(?:or|/)\\s+(?:spay|neuter)\\s+surgery[\\s\\S]{0,200}?(?:microchip|deworm|vaccination)",
    "(?:all\\s+(?:adopted\\s+)?(?:pets?|dogs?|cats?|animals?)\\s+(?:are|come|receive|will\\s+be)\\s+)[\\s\\S]{0,300}?(?:microchip|deworm|before\\s+going\\s+home|prior\\s+to\\s+adoption)",
    "(?:included\\s+(?:in|with)\\s+(?:the\\s+)?adoption)[\\s\\S]{0,300}?(?:microchip|lifetime|behavior\\s+support|payment)",
    "(?:are\\s+your\\s+pets?\\s+fully\\s+vaccinated)",
    "(?:refundable\\s+\\$?\\d+\\s+deposit)"
  ],
  "thumbnailPathPatterns": [
    "_(?:largeThumb|mediumThumb|smallThumb|galleryThumb|thumb|small|medium|large|thumbnail|preview|[0-9]+x[0-9]+_crop[^/]*)",
    "[-_.](thumb|thumbnail|small|medium|sm|md|xs|preview|crop|square|sq|[0-9]+x[0-9]+)"
  ]
}
```

### How APA's config was derived

| Config field | How it was discovered |
|-------------|----------------------|
| `gallery.imageSelector: "img.gallery-img"` | Inspected pet detail page HTML; photos use `class="gallery-img"` |
| `gallery.imageSrcAttribute: "data-lazy,..."` | APA lazy-loads gallery images; `src` contains a placeholder SVG, real URL is in `data-lazy` with a space before `=` |
| `gallery.containerSelector: ".img-holder"` | The gallery wrapper uses `class="img-holder"` |
| `gallery.excludeSelectors` | Featured dog sidebar uses `class="featured-pets-sidebar"` — must be excluded or its image leaks into every pet's gallery |
| `cards.selectors: ["large-tile", ...]` | Listing page cards use `class="large-tile"` |
| `cards.nameSelector: "h3 a"` | Pet name is inside `<h3><a class="orange">Name</a></h3>` |
| `detailUrlPatterns` | All APA animals have URLs like `/adopt/dogs/apa-a-12345` |
| `excludeImagePatterns` | APA uses SVGs for stars, achievements, hearts; blog banner images bleed in |
| `boilerplatePatterns` | "Our adoption fee includes: Spay or neuter surgery, Current vaccinations, Deworming, Microchip" appears on every pet page — must be stripped before health boolean detection |
| `thumbnailPathPatterns` | CDN serves thumbnails at `/_galleryThumb/`, `/_largeThumb/` paths |

## Template for new sites

Use this as a starting point when adding a new shelter/rescue site:

```json
{
  "gallery": {
    "imageSelector": "",
    "imageSrcAttribute": "data-src,data-lazy,src",
    "containerSelector": "",
    "excludeSelectors": []
  },
  "cards": {
    "selectors": [],
    "nameSelector": ""
  },
  "detailUrlPatterns": [],
  "excludeSections": ["header", "footer", "nav", "aside"],
  "excludeImagePatterns": [
    "logo", "icon", "sprite", "badge", "button", "pixel",
    "tracking", "avatar", "social", "favicon", "placeholder"
  ],
  "boilerplatePatterns": [],
  "thumbnailPathPatterns": []
}
```

### How to fill in the template

1. **Open a pet detail page** in browser DevTools
2. **Gallery**: right-click a pet photo → Inspect → note the `class` and which attribute has the real URL
3. **Cards**: go to listing page → Inspect a card → note the container class
4. **Detail URLs**: look at the URL pattern for individual pets
5. **Exclude sections**: look for "Featured Pet", "Related", "Sidebar" sections that contain other pets' images
6. **Boilerplate**: search for "adoption fee includes" or "all pets receive" text that appears on every page
7. **Thumbnails**: compare `src` URL with full-size image URL — note the path difference

### Saving via SQL

```sql
UPDATE "CrawlWebsite"
SET "extractionConfig" = '<JSON>'::jsonb
WHERE domain = 'www.newsite.org';
```

### Saving via API

```bash
curl -X PATCH http://localhost:5200/api/v1/scan/websites/<id> \
  -H "Content-Type: application/json" \
  -d '{"extractionConfig": { ... }}'
```
