import { Injectable, Logger } from '@nestjs/common';
import type { SiteExtractionConfig } from '../extraction/site-extraction-config';

export interface DetectedTech {
  platform: string;
  confidence: number;
  config: SiteExtractionConfig;
  widgetUrl?: string;
}

const PLATFORM_SIGNATURES: {
  name: string;
  patterns: { type: 'html' | 'script' | 'iframe' | 'url'; regex: RegExp; extractUrl?: boolean }[];
  config: SiteExtractionConfig;
}[] = [
  {
    name: 'shelterluv',
    patterns: [
      { type: 'html', regex: /shelterluv/i },
      { type: 'script', regex: /shelterluv\.com/i },
      { type: 'iframe', regex: /shelterluv\.com/i },
    ],
    config: {
      rendering: { requiresJs: true, waitForSelector: '#shelterluv-search,.sl-card,.sl-grid-item', waitMs: 3000, blockResources: ['font'] },
      fields: {
        nameFromMarkdownPattern: '\\[Donate to support ([A-Za-z][A-Za-z ]+?)\\]|\\(https://[^)]*shelterluv[^)]*"([A-Z][a-zA-Z ]+?)\\s*"\\)',
        breedFromMarkdownPattern: '-\\s+Breed:\\s*\\n\\s*\\n?\\s*([A-Z][^\\n]+)',
        sexFromMarkdownPattern: '-\\s+Gender:\\s*\\n\\s*(Male|Female)',
        ageFromMarkdownPattern: '-\\s+Age:\\s*\\n\\s*\\n?\\s*([^\\n]+)',
      },
      gallery: { imageSrcAttribute: 'src,data-src' },
      excludeSections: ['header', 'footer', 'nav', 'aside', 'sidebar'],
      excludeImagePatterns: ['logo', 'icon', 'sprite', 'badge', 'button', 'pixel', 'tracking', 'avatar', 'social', 'favicon', 'placeholder'],
    },
  },
  {
    name: '24pet',
    patterns: [
      { type: 'html', regex: /24pet(?:connect)?\.com\/\w+/i },
      { type: 'script', regex: /24petconnect\.com/i },
    ],
    config: {
      // 24Pet widget is server-rendered at its own URL - no Playwright needed
      // The orchestrator should crawl the widget URL directly
    },
  },
  {
    name: 'adopets',
    patterns: [
      { type: 'iframe', regex: /adopets\.com/i, extractUrl: true },
    ],
    config: {
      rendering: { requiresJs: true, waitForSelector: 'img[src*="adopets"],img[src*="cloudfront"],.card,a[href*="pet"]', waitMs: 6000, blockResources: ['font'] },
      apiFieldMapping: {
        name: ['name'],
        breed: ['breed_primary_name'],
        sex: ['sex_key'],
        age: ['age_key'],
        species: ['species_key'],
        description: ['description'],
        externalId: ['code'],
        weight: ['weight_number'],
        color: ['color_key'],
        size: ['size_key'],
        photo: ['picture', 'avatar', 'picture_url'],
        nestedKeys: ['_formatted', 'pet', 'attributes'],
      },
    },
  },
  {
    name: 'petango',
    patterns: [
      { type: 'html', regex: /petango/i },
      { type: 'iframe', regex: /petango\.com/i, extractUrl: true },
      { type: 'script', regex: /petango\.com/i },
    ],
    config: {
      // Petango widget URLs are server-rendered
    },
  },
  {
    name: 'rescuegroups',
    patterns: [
      { type: 'html', regex: /rescuegroups\.org/i },
      { type: 'script', regex: /rescuegroups\.org/i },
      { type: 'url', regex: /rescuegroups\.org/i },
    ],
    config: {
      // RescueGroups sites are server-rendered, no special config needed
    },
  },
  {
    name: 'petfinder-widget',
    patterns: [
      { type: 'iframe', regex: /petfinder\.com/i },
      { type: 'script', regex: /petfinder\.com\/static/i },
    ],
    config: {
      rendering: { requiresJs: true, waitForSelector: '.pf-card,.petfinder-card,.pet-card', waitMs: 4000, blockResources: ['font'] },
    },
  },
  {
    name: 'wordpress',
    patterns: [
      { type: 'html', regex: /\/wp-content\//i },
      { type: 'html', regex: /\/wp-includes\//i },
    ],
    config: {},
  },
  {
    name: 'craft-cms',
    patterns: [
      { type: 'html', regex: /Craft\s+CMS/i },
      { type: 'html', regex: /powered\s*by\s*Craft/i },
    ],
    config: {},
  },
];

@Injectable()
export class SiteTechDetectorService {
  private readonly logger = new Logger(SiteTechDetectorService.name);

  detect(html: string, url: string): DetectedTech[] {
    const detected: DetectedTech[] = [];

    const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m => m[1]!);
    const iframes = [...html.matchAll(/<iframe[^>]+src=["']([^"']+)["']/gi)].map(m => m[1]!);

    for (const platform of PLATFORM_SIGNATURES) {
      let matchCount = 0;
      const totalPatterns = platform.patterns.length;
      let widgetUrl: string | undefined;

      for (const pattern of platform.patterns) {
        let matched = false;
        switch (pattern.type) {
          case 'html':
            matched = pattern.regex.test(html);
            break;
          case 'script':
            matched = scripts.some(s => pattern.regex.test(s));
            break;
          case 'iframe': {
            const matchingIframe = iframes.find(s => pattern.regex.test(s));
            matched = !!matchingIframe;
            if (matched && pattern.extractUrl && matchingIframe) widgetUrl = matchingIframe;
            break;
          }
          case 'url':
            matched = pattern.regex.test(url);
            break;
        }
        if (matched) matchCount++;
      }

      if (matchCount > 0) {
        detected.push({
          platform: platform.name,
          confidence: matchCount / totalPatterns,
          config: platform.config,
          widgetUrl,
        });
      }
    }

    detected.sort((a, b) => b.confidence - a.confidence);
    return detected;
  }

  detectPrimary(html: string, url: string): DetectedTech | null {
    const results = this.detect(html, url);
    const jsRequired = results.filter(r => r.config.rendering?.requiresJs);
    if (jsRequired.length > 0) return jsRequired[0]!;
    return results[0] ?? null;
  }

  extract24PetWidgetUrl(html: string): string | null {
    const match = html.match(/(?:https?:\/\/)?24petconnect\.com\/(\w+)/i);
    if (match) return `https://24petconnect.com/${match[1]}`;
    return null;
  }

  extractAdopetsIframeUrl(html: string): string | null {
    const match = html.match(/<iframe[^>]+src=["'](https?:\/\/[^"']*adopets\.com[^"']*)["']/i);
    return match ? match[1]! : null;
  }

  extractPetangoWidgetUrl(html: string): string | null {
    const match = html.match(/<iframe[^>]+src=["'](https?:\/\/[^"']*petango\.com[^"']*)["']/i);
    if (match) return match[1]!;
    const scriptMatch = html.match(/(?:https?:\/\/)?ws\.petango\.com\/[^"'\s]+/i);
    return scriptMatch ? scriptMatch[0] : null;
  }
}
