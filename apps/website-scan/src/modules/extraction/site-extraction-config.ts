export interface SiteExtractionConfig {
  rendering?: {
    requiresJs?: boolean;
    waitForSelector?: string;
    waitMs?: number;
    blockResources?: string[];
  };
  fields?: {
    nameSelector?: string;
    breedSelector?: string;
    sexSelector?: string;
    ageSelector?: string;
    descriptionSelector?: string;
    idSelector?: string;
    feeSelector?: string;
    weightSelector?: string;
    nameFromMarkdownPattern?: string;
    breedFromMarkdownPattern?: string;
    sexFromMarkdownPattern?: string;
    ageFromMarkdownPattern?: string;
  };
  apiFieldMapping?: {
    name?: string[];
    breed?: string[];
    sex?: string[];
    age?: string[];
    species?: string[];
    description?: string[];
    externalId?: string[];
    weight?: string[];
    color?: string[];
    size?: string[];
    photo?: string[];
    nestedKeys?: string[];
  };
  gallery?: {
    imageSelector?: string;
    imageSrcAttribute?: string;
    containerSelector?: string;
    excludeSelectors?: string[];
  };
  cards?: {
    selectors?: string[];
    nameSelector?: string;
  };
  detailUrlPatterns?: string[];
  excludeSections?: string[];
  excludeImagePatterns?: string[];
  boilerplatePatterns?: string[];
  thumbnailPathPatterns?: string[];
}

export const DEFAULT_CONFIG: SiteExtractionConfig = {
  gallery: {
    imageSelector: 'img[class*="gallery"],img[class*="photo"],img[class*="pet-image"]',
    imageSrcAttribute: 'data-src,data-lazy,data-original,src',
    excludeSelectors: [
      'featured-pet', 'featured-dog', 'featured-cat', 'related-pets',
      'sidebar', 'similar-pets', 'also-available', 'recently-adopted',
    ],
  },
  cards: {
    selectors: [
      'pet-card', 'animal-card', 'adoptable', 'pet-item', 'grid-item',
      'listing-card', 'result-card', 'pet-listing', 'animal-listing',
      'pet-result', 'card-body', 'search-result', 'pet-entry',
    ],
  },
  excludeSections: [
    'header', 'footer', 'nav', 'aside',
    'featured-pet', 'featured-dog', 'featured-cat',
    'related-pets', 'sidebar', 'similar-pets', 'blog',
    'newsletter', 'social-share', 'breadcrumb',
  ],
  excludeImagePatterns: [
    'logo', 'icon', 'sprite', 'badge', 'button', 'pixel', 'tracking',
    'avatar', 'banner', 'social', 'favicon', 'spacer', 'placeholder',
    'blank', 'transparent', 'star-full', 'star-empty',
  ],
  boilerplatePatterns: [
    'adoption\\s+fee\\s+(?:includes?|covers?)\\s*:?[\\s\\S]{0,500}?(?:microchip|lifetime\\s+behavior|accepted\\s+forms?\\s+of\\s+payment)',
    '(?:all\\s+(?:adopted\\s+)?(?:pets?|dogs?|cats?|animals?)\\s+(?:are|come|receive|will\\s+be)\\s+)[\\s\\S]{0,300}?(?:microchip|deworm|before\\s+going\\s+home)',
    '(?:included\\s+(?:in|with)\\s+(?:the\\s+)?adoption)[\\s\\S]{0,300}?(?:microchip|lifetime|behavior\\s+support)',
    '(?:are\\s+your\\s+pets?\\s+fully\\s+vaccinated)',
  ],
  thumbnailPathPatterns: [
    '_(?:largeThumb|mediumThumb|smallThumb|galleryThumb|thumb|small|medium|large|thumbnail|preview)',
    '[-_.](thumb|thumbnail|small|medium|sm|md|xs|preview|crop|square)',
  ],
};

export const APA_CONFIG: SiteExtractionConfig = {
  gallery: {
    imageSelector: 'img.gallery-img',
    imageSrcAttribute: 'data-lazy,data-src,src',
    containerSelector: '.img-holder',
    excludeSelectors: [
      'featured-pets-sidebar', 'featured-pet', 'featured-dog',
      'featured-cat', 'related-pets', 'sidebar',
    ],
  },
  cards: {
    selectors: [
      'large-tile', 'small-tile',
      'pet-card', 'animal-card', 'adoptable',
    ],
    nameSelector: 'h3 a',
  },
  detailUrlPatterns: [
    '/adopt/dogs/apa-a-',
    '/adopt/cats/apa-a-',
    '/adopt/other-animals/apa-a-',
  ],
  excludeSections: [
    'header', 'footer', 'nav', 'aside',
    'featured-pets-sidebar', 'featured-pet', 'featured-dog',
    'blog', 'newsletter', 'social-share', 'breadcrumb',
    'donate-sidebar', 'donate-cta',
  ],
  excludeImagePatterns: [
    'logo', 'icon', 'sprite', 'badge', 'button', 'pixel', 'tracking',
    'avatar', 'banner', 'social', 'favicon', 'spacer', 'placeholder',
    'blank', 'transparent', 'star-full', 'star-empty', 'achievement',
    'heart', 'arrow', 'cta', 'seo-image', 'NextdoorAward', 'ball-so-hard',
  ],
  boilerplatePatterns: [
    'adoption\\s+fee\\s+(?:includes?|covers?|varies?)\\s*:?[\\s\\S]{0,500}?(?:microchip|lifetime\\s+behavior|accepted\\s+forms?\\s+of\\s+payment|visit\\s+our\\s+faq)',
    '(?:spay|neuter)\\s+(?:or|/)\\s+(?:spay|neuter)\\s+surgery[\\s\\S]{0,200}?(?:microchip|deworm|vaccination)',
    '(?:all\\s+(?:adopted\\s+)?(?:pets?|dogs?|cats?|animals?)\\s+(?:are|come|receive|will\\s+be)\\s+)[\\s\\S]{0,300}?(?:microchip|deworm|before\\s+going\\s+home|prior\\s+to\\s+adoption)',
    '(?:included\\s+(?:in|with)\\s+(?:the\\s+)?adoption)[\\s\\S]{0,300}?(?:microchip|lifetime|behavior\\s+support|payment)',
    '(?:are\\s+your\\s+pets?\\s+fully\\s+vaccinated)',
    '(?:refundable\\s+\\$?\\d+\\s+deposit)',
  ],
  thumbnailPathPatterns: [
    '_(?:largeThumb|mediumThumb|smallThumb|galleryThumb|thumb|small|medium|large|thumbnail|preview|[0-9]+x[0-9]+_crop[^/]*)',
    '[-_.](thumb|thumbnail|small|medium|sm|md|xs|preview|crop|square|sq|[0-9]+x[0-9]+)',
  ],
};

export function mergeConfigs(base: SiteExtractionConfig, override?: SiteExtractionConfig | null): SiteExtractionConfig {
  if (!override) return base;
  return {
    rendering: override.rendering ?? base.rendering,
    fields: override.fields ? { ...base.fields, ...override.fields } : base.fields,
    apiFieldMapping: override.apiFieldMapping ?? base.apiFieldMapping,
    gallery: { ...base.gallery, ...override.gallery },
    cards: {
      selectors: override.cards?.selectors ?? base.cards?.selectors,
      nameSelector: override.cards?.nameSelector ?? base.cards?.nameSelector,
    },
    detailUrlPatterns: override.detailUrlPatterns ?? base.detailUrlPatterns,
    excludeSections: override.excludeSections ?? base.excludeSections,
    excludeImagePatterns: override.excludeImagePatterns ?? base.excludeImagePatterns,
    boilerplatePatterns: override.boilerplatePatterns ?? base.boilerplatePatterns,
    thumbnailPathPatterns: override.thumbnailPathPatterns ?? base.thumbnailPathPatterns,
  };
}
