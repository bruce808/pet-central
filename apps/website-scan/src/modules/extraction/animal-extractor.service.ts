import { Injectable, Logger } from '@nestjs/common';
import type { PageClassification } from './page-classifier.service';
import { SiteExtractionConfig, DEFAULT_CONFIG, mergeConfigs } from './site-extraction-config';

export interface AdoptionRequirement {
  type: string;
  description: string;
  value?: string;
}

export interface AnimalCandidate {
  listingUrl?: string;
  listingExternalId?: string;
  name?: string;
  animalType?: string;
  breed?: string;
  secondaryBreed?: string;
  sex?: string;
  ageText?: string;
  ageCategory?: string;
  size?: string;
  color?: string;
  coat?: string;
  weight?: string;
  adoptionStatus?: string;
  availabilityStatus?: string;
  adoptionFee?: string;
  specialNeeds?: string;
  goodWithChildren?: boolean;
  goodWithDogs?: boolean;
  goodWithCats?: boolean;
  houseTrained?: boolean;
  spayedNeutered?: boolean;
  vaccinated?: boolean;
  microchipped?: boolean;
  declawed?: boolean;
  description?: string;
  locationCity?: string;
  locationState?: string;
  organizationName?: string;
  organizationReference?: string;
  postedDate?: string;
  updatedDate?: string;
  photoUrls: string[];
  videoUrls: string[];
  adoptionRequirements: AdoptionRequirement[];
  attributeJson?: Record<string, unknown>;
  confidence: number;
}

@Injectable()
export class AnimalExtractorService {
  private readonly logger = new Logger(AnimalExtractorService.name);
  private config: SiteExtractionConfig = DEFAULT_CONFIG;

  setConfig(siteConfig?: SiteExtractionConfig | null) {
    this.config = mergeConfigs(DEFAULT_CONFIG, siteConfig);
    if (this.config.fields?.nameFromMarkdownPattern) {
      this.logger.log(`Config set with markdown field extraction: namePattern=${this.config.fields.nameFromMarkdownPattern.substring(0, 40)}...`);
    }
  }

  private static readonly BREED_NAMES = [
    'labrador','retriever','shepherd','bulldog','poodle','terrier','beagle',
    'chihuahua','husky','corgi','dachshund','collie','spaniel','boxer','rottweiler',
    'doberman','mastiff','great dane','pitbull','pit bull','stafford','schnauzer',
    'shih tzu','maltese','yorkie','yorkshire','havanese','bichon','australian',
    'border collie','golden retriever','german shepherd','french bulldog',
    'cocker spaniel','springer spaniel','cavalier','bernese','newfoundland',
    'weimaraner','vizsla','pointer','setter','coonhound','bloodhound','basset',
    'greyhound','whippet','malinois','akita','shiba','chow','shar pei','pug',
    'boston terrier','jack russell','rat terrier','fox terrier','cairn terrier',
    'west highland','scottish terrier','airedale','wheaten','blue heeler',
    'red heeler','cattle dog','lab mix','pit mix','shepherd mix','hound mix',
    'terrier mix','poodle mix','collie mix','retriever mix',
    'persian','siamese','tabby','maine coon','ragdoll','bengal','russian blue',
    'sphynx','abyssinian','birman','burmese','himalayan','scottish fold',
    'british shorthair','american shorthair','domestic shorthair','domestic longhair',
    'domestic medium hair','calico','tortoiseshell','tuxedo','orange tabby',
  ];

  extractFromListingPage(
    html: string,
    markdown: string,
    sourceUrl: string,
  ): AnimalCandidate[] {
    const candidates: AnimalCandidate[] = [];

    const structured = this.extractStructuredListings(html, sourceUrl);
    if (structured.length > 0) return structured.filter(c => this.isValidAnimalCandidate(c));

    const htmlCards = this.findAnimalCards(html, sourceUrl);
    for (const card of htmlCards) {
      if (this.isValidAnimalCandidate(card)) {
        candidates.push(card);
      }
    }

    if (candidates.length === 0 && markdown) {
      const mdCandidates = this.extractFromMarkdownListing(markdown, sourceUrl);
      for (const c of mdCandidates) {
        if (this.isValidAnimalCandidate(c)) candidates.push(c);
      }
    }

    return candidates;
  }

  private extractStructuredListings(html: string, sourceUrl: string): AnimalCandidate[] {
    const candidates: AnimalCandidate[] = [];

    const nameMatches = [...html.matchAll(/class="text_Name[^"]*"[^>]*>([^<]+)</gi)];
    if (nameMatches.length >= 2) {
      const genderMatches = [...html.matchAll(/class="text_Gender[^"]*"[^>]*>([^<]+)</gi)];
      const breedMatches = [...html.matchAll(/class="text_Breed[^"]*"[^>]*>([^<]+)</gi)];
      const ageMatches = [...html.matchAll(/class="text_Age[^"]*"[^>]*>([^<]+)</gi)];
      const typeMatches = [...html.matchAll(/class="text_Animaltype[^"]*"[^>]*>([^<]+)</gi)];
      const locationMatches = [...html.matchAll(/class="text_Locatedat[^"]*"[^>]*>([^<]+)</gi)];

      for (let i = 0; i < nameMatches.length; i++) {
        const rawName = nameMatches[i]![1]!.trim();
        const idMatch = rawName.match(/\(([A-Z0-9]+)\)\s*$/);
        const name = rawName.replace(/\s*\([A-Z0-9]+\)\s*$/, '').trim();
        if (!name || this.isBlockedName(name)) continue;

        const breed = breedMatches[i]?.[1]?.trim() || undefined;
        const sex = this.normalizeSex(genderMatches[i]?.[1]?.trim() ?? null);
        const age = ageMatches[i]?.[1]?.trim() || undefined;
        const rawType = typeMatches[i]?.[1]?.trim().toLowerCase();
        let animalType: string | undefined;
        if (rawType === 'dog') animalType = 'SCAN_DOG';
        else if (rawType === 'cat') animalType = 'SCAN_CAT';
        else if (rawType === 'bird') animalType = 'SCAN_BIRD';
        else if (rawType) animalType = 'SCAN_OTHER';

        candidates.push({
          name,
          listingExternalId: idMatch?.[1],
          listingUrl: sourceUrl,
          animalType,
          breed,
          sex,
          ageText: age,
          ageCategory: this.inferAgeCategory(age ?? null),
          organizationName: locationMatches[i]?.[1]?.trim(),
          photoUrls: [],
          videoUrls: [],
          adoptionRequirements: [],
          adoptionStatus: 'available',
          confidence: 0.85,
        });
      }
    }

    return candidates;
  }

  extractDetailUrlsFromListingPage(html: string, sourceUrl: string, domain: string): string[] {
    const urls: string[] = [];
    const seen = new Set<string>();
    const hrefRegex = /href=["']([^"']+)["']/gi;
    let match: RegExpExecArray | null;

    while ((match = hrefRegex.exec(html)) !== null) {
      const raw = match[1]!;
      try {
        const resolved = new URL(raw, sourceUrl);
        if (resolved.hostname !== domain && !resolved.hostname.endsWith(`.${domain}`)) continue;
        const path = resolved.pathname.toLowerCase();
        if (/\/(adopt|adoptable|available|pets?|animals?|dogs?|cats?)\/(dogs|cats|pets|birds|other-animals)\/[a-z0-9]+-?[a-z0-9-]+\/?$/i.test(path)) {
          if (!seen.has(resolved.href)) { seen.add(resolved.href); urls.push(resolved.href); }
          continue;
        }
        if (/\/(pet|animal|dog|cat|bird)s?\/[a-z0-9]+-[a-z0-9-]+\/?$/i.test(path)) {
          if (!seen.has(resolved.href)) { seen.add(resolved.href); urls.push(resolved.href); }
          continue;
        }
        if (/\/(adopt|adoptable|available|pets?|animals?)\/([\w-]+-[\w-]+)\/?$/i.test(path) &&
            !/\/(special-needs|in-training|featured|senior|puppies|kittens)\/?$/i.test(path)) {
          if (!seen.has(resolved.href)) { seen.add(resolved.href); urls.push(resolved.href); }
        }
      } catch {}
    }

    return urls;
  }

  extractFromDetailPage(
    html: string,
    markdown: string,
    sourceUrl: string,
  ): AnimalCandidate | null {
    const cfg = this.config;

    if (cfg.fields?.nameFromMarkdownPattern && markdown) {
      this.logger.debug(`Using markdown extraction for ${sourceUrl}`);
      return this.extractFromMarkdownDetail(html, markdown, sourceUrl);
    }

    return this.extractFromHtmlDetail(html, markdown, sourceUrl);
  }

  private extractFromMarkdownDetail(
    html: string,
    markdown: string,
    sourceUrl: string,
  ): AnimalCandidate | null {
    const cfg = this.config;
    const text = this.stripTags(html);
    const combinedText = `${text} ${markdown}`;

    const namePattern = cfg.fields?.nameFromMarkdownPattern;
    let name: string | null = null;
    if (namePattern) {
      const m = markdown.match(new RegExp(namePattern, 'i'));
      if (m) {
        name = (m[1] ?? m[2] ?? m[3] ?? m[0]).trim();
      }
    }
    if (!name) name = this.extractAnimalName(html);
    if (name) name = this.cleanAnimalName(name);
    if (!name || name.length > 40 || name.split(' ').length > 4) return null;
    if (this.isBlockedName(name)) return null;

    const extractMdField = (pattern?: string): string | null => {
      if (!pattern) return null;
      const m = markdown.match(new RegExp(pattern, 'im'));
      return m ? (m[1] ?? m[0]).trim() : null;
    };

    const breed = extractMdField(cfg.fields?.breedFromMarkdownPattern) ?? this.extractBreed(combinedText);
    const sex = extractMdField(cfg.fields?.sexFromMarkdownPattern) ?? this.extractSex(combinedText) ?? undefined;
    const ageText = extractMdField(cfg.fields?.ageFromMarkdownPattern) ?? this.extractAge(combinedText);
    const animalType = this.inferAnimalType(combinedText);
    let photoUrls = this.extractAnimalPhotos(html, sourceUrl);
    if (photoUrls.length === 0 && markdown) {
      const mdImgs = [...markdown.matchAll(/\(https?:\/\/[^)]+\.(?:jpg|jpeg|png|webp)(?:\?[^)]*)?\)/gi)]
        .map(m => m[0].slice(1, -1))
        .filter(u => !/logo|icon|badge|pixel|tracking|bat\.bing|youtube|hqdefault/i.test(u))
        .filter((u, i, a) => a.indexOf(u) === i);
      if (mdImgs.length > 0) photoUrls = mdImgs;
    }
    const videoUrls = this.extractAnimalVideos(html, sourceUrl);
    const description = this.extractAnimalDescription(html, markdown);
    const requirements = this.extractAdoptionRequirements(combinedText);
    const externalId = this.extractExternalId(html, sourceUrl);
    const animalSpecificText = this.stripOrgBoilerplate(combinedText);

    const candidate: AnimalCandidate = {
      listingUrl: sourceUrl,
      listingExternalId: this.n2u(externalId),
      name,
      animalType: this.n2u(animalType),
      breed: this.n2u(breed),
      sex: typeof sex === 'string' ? this.normalizeSex(sex) ?? sex : sex,
      ageText: this.n2u(ageText),
      ageCategory: this.inferAgeCategory(ageText),
      size: this.n2u(this.extractSize(combinedText)),
      weight: this.n2u(extractMdField('-\\s+Weight:\\s*\\n\\s*\\n?\\s*([^\\n]+)') ?? this.extractWeight(combinedText)),
      adoptionFee: this.n2u(this.extractAdoptionFee(combinedText)),
      description: this.n2u(description),
      photoUrls,
      videoUrls,
      goodWithChildren: this.detectBoolFieldStrict(animalSpecificText, /good\s*with\s*(children|kids)/i, /not?\s*(?:good|recommended)\s*(?:with|for)\s*(children|kids)/i),
      goodWithDogs: this.detectBoolFieldStrict(animalSpecificText, /good\s*with\s*(other\s*)?dogs/i, /not?\s*good\s*with\s*(other\s*)?dogs|no\s*(?:other\s*)?dogs/i),
      goodWithCats: this.detectBoolFieldStrict(animalSpecificText, /good\s*with\s*cats/i, /not?\s*good\s*with\s*cats|no\s*cats/i),
      adoptionStatus: this.n2u(this.detectAdoptionStatus(combinedText)),
      adoptionRequirements: requirements,
      attributeJson: {
        ...(requirements.length > 0 ? { adoptionRequirements: requirements } : {}),
        ...this.extractPetTraits(animalSpecificText),
      },
      confidence: this.computeConfidence(name, animalType, breed, photoUrls, description),
    };

    let fieldCount = 0;
    if (candidate.breed) fieldCount++;
    if (candidate.animalType) fieldCount++;
    if (candidate.ageText) fieldCount++;
    if (candidate.sex) fieldCount++;
    if (candidate.description && candidate.description.length > 30) fieldCount++;
    if (candidate.photoUrls.length > 0) fieldCount++;
    if (fieldCount < 2) {
      this.logger.debug(`Markdown detail rejected for ${name}: fieldCount=${fieldCount}`);
      return null;
    }

    this.logger.debug(`Markdown detail extracted: ${name} | ${candidate.animalType} | ${candidate.breed} | ${candidate.sex} | photos=${candidate.photoUrls.length}`);
    return candidate;
  }

  private extractFromHtmlDetail(
    html: string,
    markdown: string,
    sourceUrl: string,
  ): AnimalCandidate | null {
    const mainHtml = this.extractMainContentHtml(html);
    const text = this.stripTags(mainHtml);
    const mdText = markdown || text;
    const combinedText = `${text} ${mdText}`;

    const name = this.extractAnimalName(html);
    if (!name || name.length > 40 || name.split(' ').length > 4) return null;
    if (this.isBlockedName(name)) return null;

    const animalType = this.inferAnimalType(combinedText);
    const photoUrls = this.extractAnimalPhotos(html, sourceUrl);
    const videoUrls = this.extractAnimalVideos(html, sourceUrl);

    const breed = this.extractBreed(combinedText);
    const secondaryBreed = this.extractSecondaryBreed(combinedText, breed);
    const sex = this.extractSex(combinedText);
    const ageText = this.extractAge(combinedText);
    const description = this.extractAnimalDescription(html, markdown);
    const requirements = this.extractAdoptionRequirements(combinedText);
    const location = this.extractLocation(combinedText);
    const externalId = this.extractExternalId(html, sourceUrl);

    const animalSpecificText = this.stripOrgBoilerplate(combinedText);

    const candidate: AnimalCandidate = {
      listingUrl: sourceUrl,
      listingExternalId: this.n2u(externalId),
      name,
      animalType: this.n2u(animalType),
      breed: this.n2u(breed),
      secondaryBreed: this.n2u(secondaryBreed),
      sex,
      ageText: this.n2u(ageText),
      ageCategory: this.inferAgeCategory(ageText),
      size: this.n2u(this.extractSize(combinedText)),
      color: this.n2u(this.extractColor(combinedText)),
      coat: this.n2u(this.extractCoat(combinedText)),
      weight: this.n2u(this.extractWeight(combinedText)),
      adoptionFee: this.n2u(this.extractAdoptionFee(combinedText)),
      description: this.n2u(description),
      photoUrls,
      videoUrls,
      goodWithChildren: this.detectBoolFieldStrict(animalSpecificText, /good\s*with\s*(children|kids)/i, /not?\s*(?:good|recommended)\s*(?:with|for)\s*(children|kids)/i),
      goodWithDogs: this.detectBoolFieldStrict(animalSpecificText, /good\s*with\s*(other\s*)?dogs/i, /not?\s*good\s*with\s*(other\s*)?dogs|no\s*(?:other\s*)?dogs/i),
      goodWithCats: this.detectBoolFieldStrict(animalSpecificText, /good\s*with\s*cats/i, /not?\s*good\s*with\s*cats|no\s*cats/i),
      houseTrained: this.detectBoolFieldStrict(animalSpecificText, /\b(?:house[\s-]?trained|fully\s*house[\s-]?trained)\b/i, null),
      spayedNeutered: this.detectBoolFieldStrict(animalSpecificText, /\b(?:(?:is|already|has\s*been)\s+(?:spayed|neutered|altered|fixed))\b/i, null),
      vaccinated: this.detectBoolFieldStrict(animalSpecificText, /\b(?:(?:is|already|has\s*been)\s+(?:fully\s*)?vaccinated|vaccines?\s*(?:are\s*)?up[\s-]to[\s-]date|current\s*on\s*(?:all\s*)?vaccines?)\b/i, null),
      microchipped: this.detectBoolFieldStrict(animalSpecificText, /\b(?:(?:is|already|has\s*been)\s+(?:micro[\s-]?chipped))\b/i, null),
      declawed: this.detectBoolFieldStrict(animalSpecificText, /\b(?:is\s+declawed|has\s*been\s*declawed)\b/i, null),
      adoptionStatus: this.n2u(this.detectAdoptionStatus(combinedText)),
      specialNeeds: this.n2u(this.extractSpecialNeeds(combinedText)),
      adoptionRequirements: requirements,
      attributeJson: {
        ...(requirements.length > 0 ? { adoptionRequirements: requirements } : {}),
        ...this.extractPetTraits(animalSpecificText),
      },
      confidence: this.computeConfidence(name, animalType, breed, photoUrls, description),
    };

    let fieldCount = 0;
    if (candidate.breed) fieldCount++;
    if (candidate.animalType) fieldCount++;
    if (candidate.ageText) fieldCount++;
    if (candidate.sex) fieldCount++;
    if (candidate.description && candidate.description.length > 30) fieldCount++;
    if (candidate.photoUrls.length > 0) fieldCount++;
    if (fieldCount < 2) return null;

    return candidate;
  }

  private findAnimalCards(html: string, sourceUrl: string): AnimalCandidate[] {
    const results: AnimalCandidate[] = [];

    const configSelectors = this.config.cards?.selectors ?? [];
    const allSelectors = new Set([
      ...configSelectors,
      'pet-card', 'animal-card', 'adoptable', 'pet-item', 'grid-item',
      'listing-card', 'result-card', 'pet-listing', 'animal-listing',
      'pet-result', 'card-body', 'pet-grid-item', 'pet-list-item',
      'adoptable-pet', 'available-pet', 'search-result', 'pet-entry',
      'large-tile', 'small-tile', 'animal-tile', 'pet-tile',
    ]);
    const selectorPattern = [...allSelectors].join('|');

    const cardPatterns = [
      new RegExp(`<(?:div|article|li|a|section)[^>]*class="[^"]*(?:${selectorPattern})[^"]*"[^>]*>[\\s\\S]*?<\\/(?:div|article|li|a|section)>`, 'gi'),
      /<article[^>]*>[\s\S]*?<\/article>/gi,
      /<(?:div|li)[^>]*(?:data-pet|data-animal|data-id)[^>]*>[\s\S]*?<\/(?:div|li)>/gi,
    ];

    let cards: string[] = [];
    for (const pattern of cardPatterns) {
      const matches = html.match(pattern) || [];
      if (matches.length >= 2) {
        cards = matches;
        break;
      }
    }

    if (cards.length < 2) {
      cards = this.findRepeatingStructures(html);
    }

    for (const card of cards) {
      const candidate = this.parseCard(card, sourceUrl);
      if (candidate) results.push(candidate);
    }

    return results;
  }

  private findRepeatingStructures(html: string): string[] {
    const containerPatterns = [
      /<(?:div|ul|section)[^>]*class="[^"]*(?:grid|list|results|pets|animals|cards|gallery|adoptable|listing)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|ul|section)>/gi,
    ];

    let containerHtml = html;
    for (const cp of containerPatterns) {
      const m = html.match(cp);
      if (m && m.length > 0) {
        containerHtml = m.map(match => match).join('\n');
        break;
      }
    }

    const childPatterns = [
      /<(?:div|li|article|a)[^>]*>[^<]*<(?:img|picture)[^>]*>[\s\S]*?<(?:h[2-6]|span|strong|p)[^>]*>[^<]{2,40}<\/(?:h[2-6]|span|strong|p)>[\s\S]*?<\/(?:div|li|article|a)>/gi,
      /<(?:div|li|article)[^>]*>[\s\S]*?<h[2-5][^>]*>[^<]{2,40}<\/h[2-5]>[\s\S]*?<img[^>]+>[\s\S]*?<\/(?:div|li|article)>/gi,
    ];

    for (const pattern of childPatterns) {
      const matches = containerHtml.match(pattern) || [];
      if (matches.length >= 2) return matches;
    }

    const sections = containerHtml.split(/<\/(?:div|article|section|li)>/gi);
    const potentialCards: string[] = [];

    for (const section of sections) {
      const hasName = /<(?:h[2-6]|span|strong|p)[^>]*>[^<]{2,40}<\/(?:h[2-6]|span|strong|p)>/i.test(section);
      const hasImg = /<img[^>]+src=["'][^"']+["']/i.test(section);
      const hasLink = /href=["'][^"']+["']/i.test(section);
      const text = this.stripTags(section).trim();

      if (hasName && (hasImg || hasLink) && text.length < 800 && text.length > 10) {
        potentialCards.push(section);
      }
    }

    return potentialCards.length >= 2 ? potentialCards : [];
  }

  private parseCard(card: string, sourceUrl: string): AnimalCandidate | null {
    const nameMatch = card.match(/<h[2-6][^>]*>[\s]*(?:<a[^>]*>)?\s*([^<]{2,40})\s*(?:<\/a>)?[\s]*<\/h[2-6]>/i);
    let name = nameMatch ? nameMatch[1]!.trim() : null;
    if (!name) {
      const strongMatch = card.match(/<(?:strong|b|span[^>]*class="[^"]*name[^"]*")[^>]*>\s*([^<]{2,40})\s*<\/(?:strong|b|span)>/i);
      name = strongMatch ? strongMatch[1]!.trim() : null;
    }
    if (!name) {
      const altMatch = card.match(/<img[^>]+alt=["']([^"']{2,40})["']/i);
      name = altMatch ? altMatch[1]!.trim() : null;
    }
    if (!name || this.isBlockedName(name)) return null;
    if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(name)) return null;
    if (/^[a-f0-9]{16,}$/i.test(name)) return null;
    if (/^[\w-]+\.\w{2,4}$/.test(name)) return null;
    if (name.length < 2 || !/[a-zA-Z]{2,}/.test(name)) return null;
    if (name.split(' ').length > 4) return null;

    const linkMatch = card.match(/href=["']([^"']+)["']/i);
    let detailUrl: string | undefined;
    if (linkMatch) {
      try { detailUrl = new URL(linkMatch[1]!, sourceUrl).href; } catch {}
    }

    const imgMatches = [...card.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)];
    const photoUrls: string[] = [];
    for (const im of imgMatches) {
      try {
        if (!this.isUsableMediaUrl(im[1]!, sourceUrl)) continue;
        const imgUrl = new URL(im[1]!, sourceUrl).href;
        if (!/logo|icon|sprite|badge|button|pixel|tracking|social|favicon/i.test(imgUrl)) {
          photoUrls.push(imgUrl);
        }
      } catch {}
    }

    const text = this.stripTags(card);
    const breed = this.extractBreed(text);
    const sex = this.extractSex(text);
    const ageText = this.extractAge(text);
    const adoptionStatus = this.detectAdoptionStatus(text);
    const size = this.extractSize(text);

    return {
      name: this.cleanHtml(name),
      listingUrl: detailUrl,
      animalType: this.n2u(this.inferAnimalType(text)),
      breed: this.n2u(breed),
      sex,
      ageText: this.n2u(ageText),
      ageCategory: this.inferAgeCategory(ageText),
      size: this.n2u(size),
      adoptionStatus: this.n2u(adoptionStatus),
      photoUrls,
      videoUrls: [],
      adoptionRequirements: [],
      description: text.length > 20 && text.length < 500 ? text.trim() : undefined,
      confidence: this.computeConfidence(name, this.inferAnimalType(text), breed, photoUrls, undefined),
    };
  }

  private isValidAnimalCandidate(c: AnimalCandidate): boolean {
    if (!c.name) return false;
    if (c.name.length < 2 || c.name.length > 40) return false;
    if (this.isBlockedName(c.name)) return false;
    if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(c.name)) return false;
    if (/^[a-f0-9]{16,}$/i.test(c.name)) return false;
    if (/^[\w-]+\.\w{2,4}$/.test(c.name)) return false;
    if (!/[a-zA-Z]{2,}/.test(c.name)) return false;
    if (c.name.split(' ').length > 4) return false;
    if (/^\d+$/.test(c.name)) return false;

    let detailScore = 0;
    if (c.breed) detailScore++;
    if (c.animalType) detailScore++;
    if (c.ageText) detailScore++;
    if (c.sex) detailScore++;
    if (c.photoUrls.length > 0) detailScore++;
    if (c.listingUrl) detailScore++;
    if (c.description && c.description.length > 30) detailScore++;
    if (detailScore < 1) return false;

    return true;
  }

  private isBlockedName(name: string): boolean {
    return /\b(adopt(ion|able)?|volunteer|donat(e|ion)|learn|about|contact|footer|header|nav(igation)?|home|menu|search|login|register|sign.?up|spay|neuter|give\s*up|lost\s*[&a]|found\s*(pet|animal)|get\s*involved|program|event|news|blog|store|shop|cart|hours|location|map|direction|team|staff|board|career|job|intern|media|press|newsletter|subscribe|forms?|calendar|schedule|clinic|surgery|vaccine|micro.?chip|license|permit|report|surrender|intake|return|transfer|transport|resources?|services?|polic(y|ies)|terms|privacy|sitemap|gallery|support|help|faq|question|feedback|testimonial|review|foster|rehom(e|ing)|available\s*(dogs|cats|pets|animals)|special\s*needs|in\s*training|featured|our\s*(mission|story|team|staff|history|sponsors?)|ways?\s*to|how\s*to|what\s*is|why\s*(choose|adopt)|reduce\s*stress|increase\s*self|emotional\s*fulfillment|provides?\s*emotional|other\s*available|making\s*a\s*difference|saving\s*lives?|join\s*(us|our)|become\s*a|start\s*(your|here)|explore|discover|view\s*all|see\s*all|browse|more\s*info|read\s*more|learn\s*more|click\s*here|apply\s*now|submit|send|share|print|download|upload|subscribe|unsubscribe|copyright|all\s*rights|powered\s*by|find\s*your|perfect\s*match|requirements|sponsors?|partners?|supporters?|donors?|wishlist|wish\s*list|filter\s*by|sort\s*by|show\s*results|in\s+\d{4}|since\s+\d{4}|lives?\s*saved|adoptions?|pets?\s*alive|humane\s*society|animal\s*shelter|rescue\s*league|spca)\b/i.test(name) ||
      /[.!?]$/.test(name.trim());
  }

  private extractAnimalName(html: string): string | null {
    const h1Match = html.match(/<h1[^>]*>\s*(?:<[^>]+>)*\s*([^<]{2,50})\s*(?:<[^>]+>)*\s*<\/h1>/i);
    if (h1Match) return this.cleanAnimalName(h1Match[1]!.trim());

    const ogTitle = this.metaContent(html, 'og:title', 'property');
    if (ogTitle) {
      const cleaned = ogTitle.split(/[|\-–—]/)[0]!.trim();
      if (cleaned.length >= 2 && cleaned.length <= 50) return this.cleanAnimalName(cleaned);
    }

    const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleTag) {
      const cleaned = titleTag[1]!.split(/[|\-–—]/)[0]!.trim();
      const nameFromTitle = cleaned.replace(/^(?:Meet|Adopt)\s+/i, '').replace(/'s?\s*(?:Web\s*)?Page$/i, '').trim();
      if (nameFromTitle.length >= 2 && nameFromTitle.length <= 40 && !this.isBlockedName(nameFromTitle)) {
        return this.cleanAnimalName(nameFromTitle);
      }
    }

    return null;
  }

  private cleanAnimalName(name: string): string {
    return this.cleanHtml(name)
      .replace(/^(?:Meet|Adopt|Say\s+Hi\s+to)\s+/i, '')
      .replace(/'s?\s*(?:Web\s*)?Page$/i, '')
      .trim();
  }

  private extractAnimalDescription(html: string, markdown?: string): string | null {
    if (markdown) {
      const cleaned = markdown
        .replace(/^-\s*\[.*?\]\(.*?\)\s*$/gm, '')
        .replace(/^\s*-\s*$/gm, '')
        .replace(/^-\s{2,}[A-Z][^\n]*$/gm, '')
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/^#{1,6}\s+.*$/gm, '')
        .replace(/^\s*[-*]\s+(About|Home|Adopt|Donate|Volunteer|Foster|Contact|Events?|News|Blog|Store|Shop|Login|Sign|Register|Menu|Search|Hours|Location|Map|Cart|Account|Programs?|Get Involved|Our Mission|Resources?|Services?|Hogar|Temporal)\b.*$/gmi, '')
        .trim();

      const mdParagraphs = cleaned.split(/\n\n+/)
        .map(p => p.trim())
        .filter(p => p.length > 50 && p.length < 2000)
        .filter(p => !/^\s*-\s/.test(p))
        .filter(p => (p.match(/^\s*-/gm) || []).length < 3)
        .filter(p => /\b(dog|cat|pet|animal|adopt|love|play|friendly|sweet|gentle|energetic|loyal|companion|family|home|cuddle|walk|personality|temperament|loves?|enjoy|favorite|training|behavior|needs?|he\b|she\b|his\b|her\b)\b/i.test(p));
      if (mdParagraphs.length > 0) return mdParagraphs.join('\n\n').slice(0, 5000);
    }

    const ogDesc = this.metaContent(html, 'og:description', 'property');
    if (ogDesc && ogDesc.length > 30 && /\b(pet|dog|cat|bird|adopt|animal)\b/i.test(ogDesc)) {
      return this.cleanHtml(ogDesc);
    }

    const mainContent = html.match(/<(?:main|article|div[^>]+class="[^"]*(?:content|description|bio|about|detail|profile|pet-info|animal-info)[^"]*")[^>]*>([\s\S]*?)<\/(?:main|article|div)>/i);
    if (mainContent) {
      const text = this.stripTags(mainContent[1]!).trim();
      if (text.length > 30 && text.length < 10000) return text.slice(0, 5000);
    }

    const pTags = html.match(/<p[^>]*>[^<]{20,}<\/p>/gi);
    if (pTags) {
      const filtered = pTags
        .map(p => this.stripTags(p).trim())
        .filter(t => /\b(dog|cat|pet|animal|adopt|love|play|friendly|sweet|gentle|energetic|loyal|companion)\b/i.test(t));
      if (filtered.length > 0) return filtered.join(' ').slice(0, 5000);
    }

    return null;
  }

  private extractAnimalPhotos(html: string, sourceUrl: string): string[] {
    const seen = new Set<string>();
    const photos: string[] = [];

    const excludePatterns = this.config.excludeImagePatterns ?? [];
    const excludeRegex = excludePatterns.length > 0
      ? new RegExp(excludePatterns.join('|'), 'i')
      : /logo|icon|sprite|badge|button|pixel|tracking|avatar|banner|social|favicon|spacer|placeholder|blank|transparent/i;

    const srcAttrs = (this.config.gallery?.imageSrcAttribute ?? 'data-src,data-lazy,data-original,src').split(',').map(a => a.trim());

    const addPhoto = (url: string): boolean => {
      if (!this.isUsableMediaUrl(url, sourceUrl)) return false;
      let full = this.resolveUrl(url, sourceUrl);
      full = this.upgradeToFullRes(full);
      const normalized = full.replace(/[?#].*$/, '');
      if (seen.has(normalized)) return false;
      if (excludeRegex.test(full)) return false;
      if (/\.(svg|gif|ico)(\?|$)/i.test(full)) return false;
      if (/\/assets\/(icons|ui|layout|images)\//i.test(full)) return false;
      if (/facebook\.com|google-analytics|doubleclick|googletagmanager|hotjar|mixpanel|noscript/i.test(full)) return false;
      seen.add(normalized);
      photos.push(full);
      return true;
    };

    const extractSrcFromTag = (tag: string): string | undefined => {
      for (const attr of srcAttrs) {
        const re = new RegExp(`\\b${attr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*=\\s*["'\\s]*([^"'\\s>]+)["']`, 'i');
        const m = tag.match(re);
        if (m?.[1]) return m[1];
      }
      return undefined;
    };

    const imageSelector = this.config.gallery?.imageSelector ?? '';
    const galleryCssClass = imageSelector.match(/img\.([a-zA-Z0-9_-]+)/)?.[1]
      ?? imageSelector.match(/class\*="([^"]+)"/)?.[1]
      ?? '';

    if (galleryCssClass) {
      const galleryImgs = [...html.matchAll(new RegExp(`<img[^>]*class="[^"]*${galleryCssClass}[^"]*"[^>]*>`, 'gi'))];
      for (const gm of galleryImgs) {
        const src = extractSrcFromTag(gm[0]);
        if (src) addPhoto(src);
      }
    }

    if (photos.length >= 2) return photos.slice(0, 30);

    const containerSelector = this.config.gallery?.containerSelector ?? '';
    const containerCssClass = containerSelector.replace(/^\./, '');
    if (containerCssClass) {
      const containerImgs = [...html.matchAll(new RegExp(`<div[^>]*class="[^"]*${containerCssClass}[^"]*"[^>]*>[\\s\\S]*?<img[^>]+>`, 'gi'))];
      for (const hm of containerImgs) {
        const src = extractSrcFromTag(hm[0]);
        if (src) addPhoto(src);
      }
    }

    const carouselImgs = [...html.matchAll(/<(?:div|li|a|figure)[^>]*class="[^"]*(?:slide|carousel-item|swiper-slide|slick-slide|glide__slide|splide__slide|lightbox|photo-item)[^"]*"[^>]*>[\s\S]*?<\/(?:div|li|a|figure)>/gi)];
    for (const cm of carouselImgs) {
      const imgs = [...cm[0].matchAll(/<img[^>]*(?:data-(?:src|lazy)|src)=["'\s]*([^"'\s>]+)["'][^>]*>/gi)];
      for (const im of imgs) { if (im[1]) addPhoto(im[1]); }
    }

    if (photos.length >= 2) return photos.slice(0, 30);

    const mainContent = this.extractMainContentHtml(html);
    const imgRegex = /<img[^>]*>/gi;
    let m;
    while ((m = imgRegex.exec(mainContent)) !== null) {
      const tag = m[0];
      const srcset = (tag.match(/srcset=["']([^"']+)["']/i) || [])[1];
      const best = srcset ? this.pickLargestFromSrcset(srcset) : null;

      if (best) addPhoto(best);
      else {
        const src = extractSrcFromTag(tag);
        if (src) addPhoto(src);
      }
    }

    const dataGallery = html.match(/data-(?:images|gallery|photos)=["'](\[[\s\S]*?\])["']/i);
    if (dataGallery) {
      try {
        const urls = JSON.parse(dataGallery[1]!) as (string | { url?: string; src?: string })[];
        for (const item of urls) {
          const url = typeof item === 'string' ? item : (item.url ?? item.src);
          if (url) addPhoto(url);
        }
      } catch {}
    }

    return photos.slice(0, 30);
  }

  private extractAnimalVideos(html: string, sourceUrl: string): string[] {
    const videos: string[] = [];
    const seen = new Set<string>();

    const addVideo = (url: string) => {
      if (!this.isUsableMediaUrl(url, sourceUrl)) return;
      const full = this.resolveUrl(url, sourceUrl);
      if (seen.has(full)) return;
      seen.add(full);
      videos.push(full);
    };

    const videoSrcRegex = /<video[^>]*>[\s\S]*?<source[^>]+src=["']([^"']+)["']/gi;
    let m;
    while ((m = videoSrcRegex.exec(html)) !== null) {
      if (m[1]) addVideo(m[1]);
    }

    const videoDirectRegex = /<video[^>]+src=["']([^"']+)["']/gi;
    while ((m = videoDirectRegex.exec(html)) !== null) {
      if (m[1]) addVideo(m[1]);
    }

    const iframeRegex = /<iframe[^>]+src=["']([^"']+(?:youtube|vimeo|youtu\.be|wistia)[^"']*)["']/gi;
    while ((m = iframeRegex.exec(html)) !== null) {
      if (m[1]) addVideo(m[1]);
    }

    const ytEmbedRegex = /(?:youtube\.com\/(?:embed|watch\?v=)|youtu\.be\/)([\w-]+)/gi;
    while ((m = ytEmbedRegex.exec(html)) !== null) {
      addVideo(`https://www.youtube.com/watch?v=${m[1]}`);
    }

    const dataVideoRegex = /data-(?:video|video-url|video-src)=["']([^"']+)["']/gi;
    while ((m = dataVideoRegex.exec(html)) !== null) {
      if (m[1]) addVideo(m[1]);
    }

    const mp4Regex = /["'](https?:\/\/[^"']+\.mp4(?:\?[^"']*)?)["']/gi;
    while ((m = mp4Regex.exec(html)) !== null) {
      if (m[1]) addVideo(m[1]);
    }

    return videos.slice(0, 10);
  }

  private extractMainContentHtml(html: string): string {
    let cleaned = html;
    cleaned = cleaned.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
    cleaned = cleaned.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
    cleaned = cleaned.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');

    const sections = this.config.excludeSections ?? [];
    for (const entry of sections) {
      const escaped = entry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`<(?:div|section|aside)[^>]*class="[^"]*${escaped}[^"]*"[^>]*>[\\s\\S]*?<\\/(?:div|section|aside)>`, 'gi');
      cleaned = cleaned.replace(re, '');
    }

    return cleaned;
  }

  private stripOrgBoilerplate(text: string): string {
    const patterns = this.config.boilerplatePatterns ?? [];
    let result = text;
    for (const pattern of patterns) {
      result = result.replace(new RegExp(pattern, 'gi'), '');
    }
    return result;
  }

  private inferAnimalType(text: string): string | null {
    const lower = text.toLowerCase();
    const dogScore = (lower.match(/\b(dog|puppy|puppies|canine|pup)\b/g) || []).length;
    const catScore = (lower.match(/\b(cat|kitten|kittens|feline|kitty)\b/g) || []).length;
    const birdScore = (lower.match(/\b(bird|parrot|parakeet|cockatiel|avian|macaw|conure|finch)\b/g) || []).length;
    const rabbitScore = (lower.match(/\b(rabbit|bunny|bunnies|hare)\b/g) || []).length;
    const otherScore = (lower.match(/\b(hamster|guinea\s*pig|ferret|reptile|snake|lizard|turtle|tortoise|iguana|gecko|rat|mouse|chinchilla|hedgehog|pig|goat|horse|chicken|duck)\b/g) || []).length;

    if (dogScore > catScore && dogScore > birdScore && dogScore > rabbitScore) return 'SCAN_DOG';
    if (catScore > dogScore && catScore > birdScore && catScore > rabbitScore) return 'SCAN_CAT';
    if (birdScore > 0 && birdScore > rabbitScore && birdScore > otherScore) return 'SCAN_BIRD';
    if (rabbitScore > dogScore && rabbitScore > catScore) return 'SCAN_OTHER';
    if (otherScore > dogScore && otherScore > catScore) return 'SCAN_OTHER';
    if (dogScore > 0) return 'SCAN_DOG';
    if (catScore > 0) return 'SCAN_CAT';
    if (birdScore > 0) return 'SCAN_BIRD';
    if (rabbitScore > 0 || otherScore > 0) return 'SCAN_OTHER';
    return null;
  }

  private normalizeSex(raw: string | null): string | undefined {
    if (!raw) return undefined;
    const l = raw.toLowerCase().trim();
    if (l === 'm' || l === 'male') return 'male';
    if (l === 'f' || l === 'female') return 'female';
    return undefined;
  }

  private detectBoolField(text: string, regex: RegExp): boolean | undefined {
    const match = text.match(regex);
    if (!match) return undefined;
    const idx = match.index ?? 0;
    const before = text.slice(Math.max(0, idx - 20), idx).toLowerCase();
    if (/\bno\b|not\b|un/.test(before)) return false;
    return true;
  }

  private detectBoolFieldStrict(text: string, positiveRegex: RegExp, negativeRegex: RegExp | null): boolean | undefined {
    if (negativeRegex && negativeRegex.test(text)) return false;
    if (positiveRegex.test(text)) return true;
    return undefined;
  }

  private extractPetTraits(text: string): Record<string, unknown> {
    const traits: Record<string, unknown> = {};

    const detect = (positive: RegExp, negative: RegExp | null): boolean | undefined => {
      if (negative && negative.test(text)) return false;
      if (positive.test(text)) return true;
      return undefined;
    };

    const crateTrained = detect(/\b(?:crate[\s-]?trained|comfortable\s*(?:in|with)\s*(?:a\s*)?crate)\b/i, null);
    if (crateTrained !== undefined) traits.crateTrained = crateTrained;

    const pottyTrained = detect(/\b(?:potty[\s-]?trained|fully\s*potty[\s-]?trained)\b/i, null);
    if (pottyTrained !== undefined) traits.pottyTrained = pottyTrained;

    const leashTrained = detect(/\b(?:leash[\s-]?trained|walks?\s*(?:well|nicely)\s*on\s*(?:a\s*)?leash|good\s*on[\s-]?leash)\b/i, null);
    if (leashTrained !== undefined) traits.leashTrained = leashTrained;

    const goodInCar = detect(/\b(?:good\s*in\s*(?:the\s*)?car|travels?\s*(?:well|beautifully|nicely)|great\s*(?:in|for)\s*(?:the\s*)?car|road[\s-]?trip)\b/i, null);
    if (goodInCar !== undefined) traits.goodInCar = goodInCar;

    const freeRoam = detect(/\b(?:free[\s-]?roam|trusted?\s*(?:to\s*)?free[\s-]?roam|non[\s-]?destructive)\b/i, null);
    if (freeRoam !== undefined) traits.freeRoam = freeRoam;

    const knowsBasicCommands = detect(/\b(?:knows?\s*(?:all\s*)?(?:her|his|the)?\s*basics?|sit[\s,]\s*stay|sit[\s,]\s*(?:stay[\s,]\s*)?(?:lay\s*down|down|shake|come|leave\s*it|heel))\b/i, null);
    if (knowsBasicCommands !== undefined) traits.knowsBasicCommands = knowsBasicCommands;

    const energyLevel = text.match(/\b(low|medium|high)[\s-]?energy\b/i);
    if (energyLevel) traits.energyLevel = energyLevel[1]!.toLowerCase();

    const litterBoxTrained = detect(/\b(?:litter[\s-]?(?:box\s*)?trained|uses?\s*(?:the\s*)?litter[\s-]?box)\b/i, null);
    if (litterBoxTrained !== undefined) traits.litterBoxTrained = litterBoxTrained;

    const goodWithSeniors = detect(/\b(?:good\s*with\s*(?:senior|elderly|older)\s*(?:people|adults?|owners?)?)\b/i, null);
    if (goodWithSeniors !== undefined) traits.goodWithSeniors = goodWithSeniors;

    const separationAnxiety = detect(/\b(?:separation\s*anxiety)\b/i, null);
    if (separationAnxiety !== undefined) traits.separationAnxiety = separationAnxiety;

    const fenceRequired = detect(/\b(?:fenced[\s-]?(?:in\s*)?yard|requires?\s*(?:a\s*)?fence|physical\s*fence)\b/i, null);
    if (fenceRequired !== undefined) traits.fenceRequired = fenceRequired;

    return traits;
  }

  private detectAdoptionStatus(text: string): string | null {
    const lower = text.toLowerCase();
    if (/\b(has\s*been\s*adopted|this\s*pet\s*(?:has\s*been\s*)?adopted|already\s*adopted|no longer available|adoption\s*(?:is\s*)?complete[d]?)\b/.test(lower)) return 'adopted';
    if (/\b(adoption\s*pending|on\s*hold|application\s*received|under\s*review|pending\s*adoption)\b/.test(lower)) return 'pending';
    if (/\b(foster[\s-]*to[\s-]*adopt|in\s*foster)\b/.test(lower)) return 'foster';
    if (/\b(available\s*(?:for\s*adoption)?|adoptable|ready\s*for\s*adoption|looking\s*for\s*(?:a\s*)?(?:home|family)|needs?\s*a\s*home|adopt\s*me|apply\s*to\s*adopt|meet\s*me|seeking\s*(?:a\s*)?(?:home|family))\b/.test(lower)) return 'available';
    return null;
  }

  private extractBreed(text: string): string | null {
    const labeled = text.match(/\b(?:breed|primary\s*breed)\s*[:]\s*([^\n,|]{2,50})/i);
    if (labeled) return this.cleanHtml(labeled[1]!.trim());

    const colonSep = text.match(/([A-Z][A-Za-z/ ]+(?:\s*\([^)]+\))?)\s+:\s*:\s+(?:Male|Female)/);
    if (colonSep) {
      let breed = colonSep[1]!.trim();
      breed = breed.replace(/^.*(?:Page|Title)\s+/i, '');
      if (breed.length > 2) return this.cleanHtml(breed);
    }

    const speciesField = text.match(/Species\s*:\s*(Dog|Cat|Bird)/i);
    const breedField = text.match(/(?:^|\n)\s*(?:Breed|Primary Breed)\s*:\s*([^\n]+)/im);
    if (breedField) return this.cleanHtml(breedField[1]!.trim());

    const breedPattern = new RegExp(`\\b(${AnimalExtractorService.BREED_NAMES.join('|')})\\b`, 'i');
    const m = text.match(breedPattern);
    if (m) {
      const afterBreed = text.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 20);
      const mixSuffix = /^\s*mix\b/i.test(afterBreed) ? ' Mix' : '';
      return m[1]!.trim() + mixSuffix;
    }
    return null;
  }

  private extractSecondaryBreed(text: string, primaryBreed: string | null): string | null {
    const labeled = text.match(/\b(?:secondary\s*breed|mix(?:ed)?\s*(?:breed|with)?)\s*[:]\s*([^\n,|]{2,50})/i);
    if (labeled) return this.cleanHtml(labeled[1]!.trim());

    if (!primaryBreed) return null;
    const primaryLower = primaryBreed.toLowerCase().replace(/\s*mix$/i, '');
    const breedPattern = new RegExp(`\\b(${AnimalExtractorService.BREED_NAMES.join('|')})\\b`, 'gi');
    const matches = [...text.matchAll(breedPattern)];
    for (const m of matches) {
      if (m[1]!.toLowerCase() !== primaryLower) return m[1]!.trim();
    }
    return null;
  }

  private extractSex(text: string): string | undefined {
    const labeled = text.match(/\b(?:sex|gender)\s*[:]\s*(male|female|m|f|boy|girl)\b/i);
    if (labeled) return this.normalizeSex(labeled[1]!);

    const inline = text.match(/\b(male|female)\b(?!\s*(?:or|\/|and)\s*(?:male|female))/i);
    if (inline) return this.normalizeSex(inline[1]!);

    if (/\b(boy|he is|he's|his |good boy|handsome)\b/i.test(text)) return 'male';
    if (/\b(girl|she is|she's|her |good girl|beautiful girl|pretty girl)\b/i.test(text)) return 'female';

    return undefined;
  }

  private extractAge(text: string): string | null {
    const labeled = text.match(/\bage\s*[:]\s*([^\n,|]{2,60})/i);
    if (labeled) {
      let age = this.cleanHtml(labeled[1]!.trim());
      age = age.replace(/\s*(?:Location|Breed|Sex|Gender|Weight|Color|Species|Size|Status|Declawed|Housetrained|Spayed|Neutered|Good\s*with).*$/i, '').trim();
      return age;
    }

    const ageExpr = text.match(/(\d+[\s-]*(?:year|yr|month|mo|week|wk|day)s?\s*(?:\d+\s*(?:month|mo)s?)?\s*(?:old)?(?:\s*\([^)]*\))?)/i);
    if (ageExpr) return ageExpr[1]!.trim();

    const approxAge = text.match(/\b(young(?:\s*adult)?|adult|senior|baby|kitten|puppy|juvenile|adolescent)\b/i);
    if (approxAge) return approxAge[1]!.trim();

    return null;
  }

  private inferAgeCategory(ageText: string | null): string | undefined {
    if (!ageText) return undefined;
    const lower = ageText.toLowerCase();
    if (/baby|kitten|puppy|neonat/i.test(lower)) return 'baby';
    if (/young|juvenile|adolescent/i.test(lower)) return 'young';
    if (/senior|old|elderly|geriatric/i.test(lower)) return 'senior';

    const yearMatch = lower.match(/(\d+)\s*(?:year|yr)/);
    if (yearMatch) {
      const years = parseInt(yearMatch[1]!, 10);
      if (years < 1) return 'baby';
      if (years < 3) return 'young';
      if (years < 8) return 'adult';
      return 'senior';
    }
    const monthMatch = lower.match(/(\d+)\s*(?:month|mo)/);
    if (monthMatch) {
      const months = parseInt(monthMatch[1]!, 10);
      if (months < 6) return 'baby';
      if (months < 18) return 'young';
      return 'adult';
    }
    if (/adult/i.test(lower)) return 'adult';
    return undefined;
  }

  private extractSize(text: string): string | null {
    const labeled = text.match(/\bsize\s*[:]\s*(extra[\s-]?small|small|medium|large|extra[\s-]?large|tiny|xl|x-large|x-small)\b/i);
    if (labeled) return labeled[1]!.trim().toLowerCase();
    const inline = text.match(/\b(extra[\s-]?small|small|medium|large|extra[\s-]?large)\s*(?:size|breed|dog|cat)?\b/i);
    if (inline) return inline[1]!.trim().toLowerCase();
    return null;
  }

  private extractColor(text: string): string | null {
    const labeled = text.match(/\b(?:color|colou?ring|markings?)\s*[:]\s*([^\n,|]{2,40})/i);
    if (labeled) return this.cleanHtml(labeled[1]!.trim());

    const descPattern = text.match(/(?:is\s+(?:a\s+)?|has\s+(?:a\s+)?)(?:beautiful\s+|gorgeous\s+|stunning\s+)?(black|white|brown|tan|golden|cream|gray|grey|brindle|merle|spotted|tricolor|fawn|sable|chocolate|orange|yellow|silver|red|blue)(?:\s*(?:and|&|\/)\s*(black|white|brown|tan|golden|cream|gray|grey|brindle|merle|spotted|tricolor|fawn|sable|chocolate|orange|yellow|silver|red|blue))?\s+(?:colored?\s+)?(?:dog|cat|pup|kitten|boy|girl|pet|mix)/i);
    if (descPattern) {
      const primary = descPattern[1]!.trim();
      const secondary = descPattern[2]?.trim();
      return secondary ? `${primary} and ${secondary}` : primary;
    }
    return null;
  }

  private extractCoat(text: string): string | null {
    const labeled = text.match(/\bcoat\s*[:]\s*([^\n,|]{2,30})/i);
    if (labeled) return this.cleanHtml(labeled[1]!.trim());
    const coat = text.match(/\b(short[\s-]?hair|long[\s-]?hair|medium[\s-]?hair|wire[\s-]?hair|curly|smooth|rough|double[\s-]?coat|hairless)\b/i);
    return coat ? coat[1]!.trim() : null;
  }

  private extractWeight(text: string): string | null {
    const labeled = text.match(/\bweight\s*[:]\s*([^\n,|]{2,30})/i);
    if (labeled) {
      let weight = this.cleanHtml(labeled[1]!.trim());
      weight = weight.replace(/\s*(?:Location|Breed|Sex|Gender|Color|Species|Size|Status|Declawed|Housetrained).*$/i, '').trim();
      return weight;
    }
    const w = text.match(/(\d+(?:\.\d+)?\s*(?:lbs?|pounds?|kg|kilograms?))/i);
    return w ? w[1]!.trim() : null;
  }

  private extractAdoptionFee(text: string): string | null {
    const fee = text.match(/\b(?:adoption\s*fee|fee)\s*[:$]\s*\$?\s*(\d+(?:\.\d{2})?)/i);
    if (fee) return `$${fee[1]}`;
    const dollarFee = text.match(/\$\s*(\d+(?:\.\d{2})?)\s*(?:adoption\s*fee)?/i);
    if (dollarFee && /adopt|fee/i.test(text.slice(Math.max(0, (dollarFee.index ?? 0) - 30), (dollarFee.index ?? 0) + dollarFee[0].length + 30))) {
      return `$${dollarFee[1]}`;
    }
    return null;
  }

  private extractSpecialNeeds(text: string): string | null {
    const labeled = text.match(/special\s*needs?\s*[:]\s*([^\n|]{2,100})/i);
    if (labeled) return this.cleanHtml(labeled[1]!.trim());
    if (/\bspecial\s*needs?\b/i.test(text)) return 'Yes';
    return null;
  }

  private extractLocation(text: string): { city?: string; state?: string } | null {
    const labeled = text.match(/\blocation\s*[:]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*,\s*([A-Z]{2})\b/);
    if (labeled) return { city: labeled[1]!.trim(), state: labeled[2]!.trim() };

    const locField = text.match(/\b(?:located?\s*(?:in|at)|based\s*in|serving)\s*[:]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*,\s*([A-Z]{2})\b/);
    if (locField) return { city: locField[1]!.trim(), state: locField[2]!.trim() };

    return null;
  }

  private extractExternalId(html: string, url: string): string | null {
    const dataId = html.match(/data-(?:pet|animal|listing)[-_]?id=["']([^"']+)["']/i);
    if (dataId) return dataId[1]!;
    const urlId = url.match(/\/(?:pet|animal|adopt(?:able)?|listing)s?\/(\d+)\b/i);
    if (urlId) return urlId[1]!;
    const slugId = url.match(/\/(?:pet|animal|adopt(?:able)?)s?\/([a-z0-9]+-[a-z0-9-]+)\/?$/i);
    if (slugId) return slugId[1]!;
    return null;
  }

  private extractAdoptionRequirements(text: string): AdoptionRequirement[] {
    const requirements: AdoptionRequirement[] = [];
    const lower = text.toLowerCase();

    const ageReq = lower.match(/(?:must\s*be|at\s*least|applicants?\s*must\s*be|adopters?\s*must\s*be)\s*(\d+)\s*(?:years?\s*(?:of\s*age|old)|or\s*older)/i);
    if (ageReq) {
      requirements.push({ type: 'minimum_age', description: `Must be at least ${ageReq[1]} years old`, value: ageReq[1]! });
    } else if (/\b(?:18\s*(?:years?\s*(?:of\s*age|old)|or\s*older|\+))\b/.test(lower)) {
      requirements.push({ type: 'minimum_age', description: 'Must be 18 years or older', value: '18' });
    } else if (/\b(?:21\s*(?:years?\s*(?:of\s*age|old)|or\s*older|\+))\b/.test(lower)) {
      requirements.push({ type: 'minimum_age', description: 'Must be 21 years or older', value: '21' });
    }

    const locationReq = lower.match(/(?:must\s*(?:live|reside|be\s*located)|within)\s*(?:within\s*)?(\d+)\s*miles?\s*(?:of|from|radius)\s*([A-Za-z\s]+?)(?:\.|,|$)/i);
    if (locationReq) {
      requirements.push({ type: 'location_radius', description: `Must live within ${locationReq[1]} miles of ${locationReq[2]!.trim()}`, value: `${locationReq[1]} miles` });
    }

    if (/\b(?:fenced[\s-]*(?:in\s*)?yard|securely?\s*fenced|physical\s*fence)\b/i.test(lower)) {
      requirements.push({ type: 'fenced_yard', description: 'Fenced yard required' });
    }

    if (/\b(?:home[\s-]*(?:visit|check|inspection)|we\s*(?:will|do)\s*(?:a\s*)?home\s*visit)\b/i.test(lower)) {
      requirements.push({ type: 'home_visit', description: 'Home visit required' });
    }

    if (/\b(?:landlord\s*(?:approval|permission|consent)|pet[\s-]*(?:friendly\s*)?(?:housing|lease)|proof\s*of\s*(?:pet\s*)?(?:policy|permission))\b/i.test(lower)) {
      requirements.push({ type: 'landlord_approval', description: 'Landlord approval required for renters' });
    }

    if (/\b(?:vet(?:erinar(?:y|ian))?\s*(?:reference|check|approval)|current\s*vet)\b/i.test(lower)) {
      requirements.push({ type: 'vet_reference', description: 'Veterinary reference required' });
    }

    if (/\b(?:no\s*(?:small\s*)?children|children\s*(?:over|older\s*than|at\s*least)\s*\d+|not\s*(?:recommended|suitable)\s*(?:for|with)\s*(?:small\s*)?children|kids?\s*(?:over|older\s*than)\s*\d+)\b/i.test(lower)) {
      const childAge = lower.match(/children\s*(?:over|older\s*than|at\s*least)\s*(\d+)/i) || lower.match(/kids?\s*(?:over|older\s*than)\s*(\d+)/i);
      requirements.push({
        type: 'children_age',
        description: childAge ? `Children must be ${childAge[1]} or older` : 'Not recommended for homes with small children',
        value: childAge?.[1],
      });
    }

    if (/\b(?:only\s*pet|no\s*other\s*(?:pets?|dogs?|cats?|animals?)|single[\s-]*pet\s*home|must\s*be\s*(?:the\s*)?only)\b/i.test(lower)) {
      requirements.push({ type: 'only_pet', description: 'Must be the only pet in the household' });
    }

    if (/\b(?:application|adoption\s*(?:application|form)|apply\s*(?:to\s*adopt|online|here))\b/i.test(lower)) {
      requirements.push({ type: 'application', description: 'Adoption application required' });
    }

    if (/\b(?:experience(?:d)?\s*(?:with|owner)|experienced\s*(?:dog|cat)\s*owner|previous\s*(?:dog|cat|pet)\s*(?:experience|ownership))\b/i.test(lower)) {
      requirements.push({ type: 'experience', description: 'Previous pet ownership experience required' });
    }

    if (/\b(?:valid\s*(?:photo\s*)?id|government[\s-]*issued\s*id|proof\s*of\s*(?:identity|address|residency))\b/i.test(lower)) {
      requirements.push({ type: 'identification', description: 'Valid ID required' });
    }

    return requirements;
  }

  private extractFromMarkdownListing(markdown: string, sourceUrl: string): AnimalCandidate[] {
    const candidates: AnimalCandidate[] = [];
    const sections = markdown.split(/(?=^#{2,4}\s+)/m);

    for (const section of sections) {
      const nameMatch = section.match(/^#{2,4}\s+(.{2,40})$/m);
      if (!nameMatch) continue;
      const name = nameMatch[1]!.trim();
      if (this.isBlockedName(name)) continue;
      if (!/[a-zA-Z]{2,}/.test(name)) continue;

      const imgMatch = section.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      const photoUrls: string[] = [];
      if (imgMatch && imgMatch[2]) {
        try { photoUrls.push(new URL(imgMatch[2], sourceUrl).href); } catch {}
      }

      const linkMatch = section.match(/\[.*?\]\(([^)]+)\)/);
      let detailUrl: string | undefined;
      if (linkMatch && linkMatch[1]) {
        try { detailUrl = new URL(linkMatch[1], sourceUrl).href; } catch {}
      }

      const sectionText = section.replace(/^#{2,4}\s+.+$/m, '').trim();
      candidates.push({
        name: this.cleanHtml(name),
        listingUrl: detailUrl,
        animalType: this.n2u(this.inferAnimalType(sectionText)),
        breed: this.n2u(this.extractBreed(sectionText)),
        sex: this.extractSex(sectionText),
        ageText: this.n2u(this.extractAge(sectionText)),
        adoptionStatus: this.n2u(this.detectAdoptionStatus(sectionText)),
        photoUrls,
        videoUrls: [],
        adoptionRequirements: [],
        description: sectionText.length > 20 && sectionText.length < 500 ? sectionText : undefined,
        confidence: 0.6 + (photoUrls.length > 0 ? 0.05 : 0),
      });
    }

    return candidates;
  }

  private computeConfidence(
    name: string | undefined, animalType: string | null, breed: string | null,
    photoUrls: string[], description: string | null | undefined,
  ): number {
    let score = 0.55;
    if (name) score += 0.1;
    if (animalType) score += 0.08;
    if (breed) score += 0.07;
    if (photoUrls.length > 0) score += 0.05;
    if (description && description.length > 50) score += 0.05;
    return Math.min(score, 0.98);
  }

  private extractField(text: string, regex: RegExp): string | null {
    const match = text.match(regex);
    return match ? this.cleanHtml(match[1]!.trim()) : null;
  }

  private metaContent(html: string, name: string, attr: string): string | null {
    const re1 = new RegExp(`<meta[^>]+${attr}=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i');
    const m1 = html.match(re1);
    if (m1) return m1[1]!.trim();
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${name}["']`, 'i');
    const m2 = html.match(re2);
    return m2 ? m2[1]!.trim() : null;
  }

  private cleanHtml(text: string): string {
    return text
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
      .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
      .replace(/&ndash;/g, '–').replace(/&mdash;/g, '—')
      .replace(/&rsquo;/g, '\u2019').replace(/&nbsp;/g, ' ')
      .trim();
  }

  private resolveUrl(url: string, base: string): string {
    try { return new URL(url, base).href; } catch { return url; }
  }

  private n2u(val: string | null): string | undefined {
    return val ?? undefined;
  }

  private isUsableMediaUrl(raw: string, base: string): boolean {
    if (!raw || raw.length < 5) return false;
    const trimmed = raw.trim();
    if (trimmed.startsWith('data:')) return false;
    if (trimmed.startsWith('blob:')) return false;
    if (trimmed === '#' || trimmed === 'about:blank') return false;
    if (/^javascript:/i.test(trimmed)) return false;
    if (/^\/\/$/.test(trimmed)) return false;
    if (/no[_-]?image|no[_-]?photo|placeholder|default[_-]?(?:pet|avatar|image|photo|thumb)|missing|coming[_-]?soon/i.test(trimmed)) return false;
    try {
      const resolved = new URL(trimmed, base);
      if (!resolved.protocol.startsWith('http')) return false;
    } catch {
      return false;
    }
    return true;
  }

  private upgradeToFullRes(url: string): string {
    let upgraded = url;

    const thumbPatterns = this.config.thumbnailPathPatterns ?? [];
    for (const pattern of thumbPatterns) {
      upgraded = upgraded.replace(new RegExp(`\\/${pattern}\\/`, 'i'), '/');
      upgraded = upgraded.replace(new RegExp(`${pattern}\\.(jpg|jpeg|png|webp)`, 'i'), '.$1');
    }

    upgraded = upgraded.replace(/[?&](w|h|width|height|size|resize|fit|crop|quality|q|thumb|thumbnail)=[^&]*/gi, '');
    upgraded = upgraded.replace(/[?&]auto=(?:compress|format|webp)[^&]*/gi, '');
    if (upgraded.endsWith('?')) upgraded = upgraded.slice(0, -1);
    return upgraded;
  }

  private pickLargestFromSrcset(srcset: string): string | null {
    const entries = srcset.split(',').map(s => {
      const parts = s.trim().split(/\s+/);
      const url = parts[0]!;
      const descriptor = parts[1] ?? '';
      let size = 0;
      const wMatch = descriptor.match(/(\d+)w/);
      const xMatch = descriptor.match(/([\d.]+)x/);
      if (wMatch) size = parseInt(wMatch[1]!, 10);
      else if (xMatch) size = parseFloat(xMatch[1]!) * 1000;
      else size = 0;
      return { url, size };
    });
    if (entries.length === 0) return null;
    entries.sort((a, b) => b.size - a.size);
    return entries[0]!.url;
  }

  private stripTags(html: string): string {
    return html.replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ');
  }
}
