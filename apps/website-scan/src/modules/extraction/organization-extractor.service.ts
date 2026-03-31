import { Injectable, Logger } from '@nestjs/common';

export interface ReviewCandidate {
  source: string;
  rating?: number;
  text?: string;
  author?: string;
}

export interface OrganizationCandidate {
  name: string;
  canonicalWebsite?: string;
  category?: string;
  subcategory?: string;
  organizationType?: string;
  petTypes: string[];
  summaryDescription?: string;
  missionStatement?: string;
  logoUrl?: string;
  imageUrls: string[];
  addressRaw?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  accreditations: string[];
  socialLinks: Record<string, string>;
  confidence: number;
  contacts: ContactCandidate[];
  reviews: ReviewCandidate[];
  rating?: number;
  ratingCount?: number;
}

export interface ContactCandidate {
  contactType: string;
  label?: string;
  valueRaw: string;
  valueNormalized?: string;
  confidence: number;
}

@Injectable()
export class OrganizationExtractorService {
  private readonly logger = new Logger(OrganizationExtractorService.name);

  extractSiteName(html: string): string | null {
    const ogSiteName = this.metaContent(html, 'og:site_name', 'property');
    if (ogSiteName && ogSiteName.length < 80) return this.clean(ogSiteName);

    const schemaName = html.match(/"name"\s*:\s*"([^"]{2,80})"/);
    if (schemaName) return this.clean(schemaName[1]!);

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      const raw = titleMatch[1]!.trim();
      const parts = raw.split(/\s*[|\-–—]\s*/);
      const last = parts[parts.length - 1]!.trim();
      if (last.length > 2 && last.length < 80 && parts.length > 1) return this.clean(last);
      if (parts[0]!.trim().length > 2 && parts[0]!.trim().length < 80) return this.clean(parts[0]!.trim());
    }

    return null;
  }

  extract(html: string, markdown: string, url: string): OrganizationCandidate | null {
    const name = this.extractSiteName(html);
    if (!name) return null;

    let origin = '';
    try { origin = new URL(url).origin; } catch {}

    const reviewData = this.extractReviews(html);

      const addressRaw = this.extractAddress(html);
      const schemaCity = this.extractAddressPart(html, 'city');
      const schemaState = this.extractAddressPart(html, 'state');
      const schemaZip = this.extractAddressPart(html, 'postalCode');

      let city = schemaCity;
      let state = schemaState;
      let postalCode = schemaZip;

      if (addressRaw && (!city || !state)) {
        const parsed = addressRaw.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\s+(\d{5})/);
        if (parsed) {
          city = city ?? parsed[1]!.trim();
          state = state ?? parsed[2]!.trim();
          postalCode = postalCode ?? parsed[3]!.trim();
        }
      }

      return {
        name,
        canonicalWebsite: origin || undefined,
        category: this.inferCategory(html) ?? undefined,
        organizationType: this.inferOrgType(html) ?? undefined,
        petTypes: this.inferPetTypes(html),
        summaryDescription: this.extractDescription(html, markdown) ?? undefined,
        missionStatement: this.extractMissionStatement(html, markdown) ?? undefined,
        logoUrl: this.extractLogo(html, url),
        imageUrls: this.extractOrgImages(html, url),
        addressRaw,
        city,
        state,
        postalCode,
      accreditations: this.extractAccreditations(html),
      socialLinks: this.extractSocialLinks(html),
      confidence: 0.7,
      contacts: this.extractContacts(html),
      reviews: reviewData.reviews,
      rating: reviewData.rating,
      ratingCount: reviewData.ratingCount,
    };
  }

  extractContacts(html: string): ContactCandidate[] {
    const text = this.stripTags(html);
    const contacts: ContactCandidate[] = [];

    const phoneRegex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phones = new Set<string>();
    let pm;
    while ((pm = phoneRegex.exec(text)) !== null) {
      const raw = pm[0];
      const digits = raw.replace(/\D/g, '');
      if (digits.length >= 10 && !phones.has(digits)) {
        phones.add(digits);
        contacts.push({
          contactType: 'phone',
          valueRaw: raw,
          valueNormalized: this.normalizePhone(raw),
          confidence: 0.85,
        });
      }
    }

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = new Set<string>();
    let em;
    while ((em = emailRegex.exec(text)) !== null) {
      const raw = em[0].toLowerCase();
      if (!emails.has(raw) && !raw.includes('example.com') && !raw.includes('sentry')) {
        emails.add(raw);
        contacts.push({
          contactType: 'email',
          valueRaw: raw,
          valueNormalized: raw,
          confidence: 0.9,
        });
      }
    }

    return contacts.slice(0, 6);
  }

  private extractDescription(html: string, markdown?: string): string | null {
    if (markdown) {
      const cleaned = markdown
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/^#{1,6}\s+.*$/gm, '')
        .replace(/^\s*[-*]\s+(Home|Adopt|Donate|Volunteer|Foster|Contact|Events?|News|Blog|Store|Shop|Login|Sign|Register|Menu|Search|Hours|Cart|Account)\b.*$/gmi, '')
        .trim();

      const paragraphs = cleaned.split(/\n\n+/)
        .map(p => p.trim())
        .filter(p => p.length > 50 && p.length < 1000)
        .filter(p => !/^\s*[-*]\s/.test(p))
        .filter(p => !this.isScheduleText(p))
        .filter(p => /\b(animal|rescue|shelter|adopt|mission|foster|pet|dog|cat|community|care|sanctuary|nonprofit|humane|welfare|volunteer|save|protect|compassion|dedicate)\b/i.test(p));

      if (paragraphs.length > 0) return paragraphs[0]!.slice(0, 1000);
    }

    const ogDesc = this.metaContent(html, 'og:description', 'property');
    if (ogDesc && ogDesc.length > 20 && !this.isScheduleText(ogDesc)) return this.clean(ogDesc);

    const metaDesc = this.metaContent(html, 'description', 'name');
    if (metaDesc && metaDesc.length > 20 && !this.isScheduleText(metaDesc)) return this.clean(metaDesc);

    const schemaDesc = html.match(/"description"\s*:\s*"([^"]{20,500})"/);
    if (schemaDesc && !this.isScheduleText(schemaDesc[1]!)) return this.clean(schemaDesc[1]!);

    return null;
  }

  private extractLogo(html: string, baseUrl: string): string | undefined {
    const ogImage = this.metaContent(html, 'og:image', 'property');
    
    const logoPatterns = [
      /<img[^>]+class="[^"]*logo[^"]*"[^>]+src=["']([^"']+)["']/i,
      /<img[^>]+src=["']([^"']+logo[^"']*\.(?:png|jpg|svg|webp))["']/i,
      /<link[^>]+rel="icon"[^>]+href=["']([^"']+)["']/i,
      /<img[^>]+alt="[^"]*logo[^"]*"[^>]+src=["']([^"']+)["']/i,
      /<img[^>]+src=["']([^"']+)["'][^>]+class="[^"]*logo[^"]*"/i,
      /<img[^>]+src=["']([^"']+)["'][^>]+alt="[^"]*logo[^"]*"/i,
      /<header[^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i,
    ];

    for (const pattern of logoPatterns) {
      const match = html.match(pattern);
      if (match) return this.resolveUrl(match[1]!, baseUrl);
    }

    if (ogImage) return this.resolveUrl(ogImage, baseUrl);
    return undefined;
  }

  private extractOrgImages(html: string, baseUrl: string): string[] {
    const imgs: string[] = [];
    const ogImage = this.metaContent(html, 'og:image', 'property');
    if (ogImage) imgs.push(this.resolveUrl(ogImage, baseUrl));

    const sectionPatterns = [
      /<(?:section|div)[^>]+class="[^"]*(?:hero|banner|about|gallery|slider)[^"]*"[^>]*>[\s\S]*?<\/(?:section|div)>/gi,
    ];
    for (const pattern of sectionPatterns) {
      let sm;
      while ((sm = pattern.exec(html)) !== null) {
        const sectionImgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
        let sim;
        while ((sim = sectionImgRegex.exec(sm[0])) !== null) {
          const src = sim[1]!;
          if (/logo|icon|sprite|badge|button|avatar|tracking|pixel/i.test(src)) continue;
          if (/\.(svg|gif|ico)(\?|$)/i.test(src)) continue;
          imgs.push(this.resolveUrl(src, baseUrl));
        }
      }
    }

    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let m;
    while ((m = imgRegex.exec(html)) !== null) {
      const src = m[1]!;
      const tag = m[0];
      if (/logo|icon|sprite|badge|button|avatar|tracking|pixel/i.test(src)) continue;
      if (/\.(svg|gif|ico)(\?|$)/i.test(src)) continue;
      const alt = (tag.match(/alt=["']([^"']*)["']/i) || [])[1] || '';

      const widthMatch = tag.match(/width=["']?(\d+)/i);
      const heightMatch = tag.match(/height=["']?(\d+)/i);
      const isLarge = (widthMatch && parseInt(widthMatch[1]!, 10) > 200) ||
                      (heightMatch && parseInt(heightMatch[1]!, 10) > 200);

      if (isLarge || /\b(building|facility|shelter|rescue|team|staff|volunteer|location|hero|banner|about|gallery)\b/i.test(alt + src)) {
        imgs.push(this.resolveUrl(src, baseUrl));
      }
    }

    return [...new Set(imgs)].slice(0, 8);
  }

  private extractAddress(html: string): string | undefined {
    const schemaAddr = html.match(/"streetAddress"\s*:\s*"([^"]+)"/);
    if (schemaAddr) return this.clean(schemaAddr[1]!);

    const addrTag = html.match(/<address[^>]*>([\s\S]*?)<\/address>/i);
    if (addrTag) {
      const text = this.stripTags(addrTag[1]!).trim();
      if (text.length > 10 && text.length < 200) return text;
    }

    const text = this.stripTags(html);
    const addrMatch = text.match(/(\d{1,5}\s+[A-Z][a-zA-Z\s.]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd|Lane|Ln|Way|Circle|Cir|Court|Ct|Place|Pl)\.?[,\s]+(?:Suite|Ste|#|Apt\.?)?\s*\d*[,\s]+[A-Z][a-zA-Z\s]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)/);
    if (addrMatch) return addrMatch[1]!.trim();

    const looseAddr = text.match(/(\d{1,5}\s+[A-Z][a-zA-Z\s.]+[,\s]+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,\s*[A-Z]{2}\s+\d{5})/);
    if (looseAddr) return looseAddr[1]!.trim();

    const cityStateZip = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)/);
    if (cityStateZip && !/Select|Choose|Enter|Welcome|Home|About|Contact/.test(cityStateZip[0]!.split(',')[0]!.split(' ')[0]!)) {
      return cityStateZip[1]!.trim();
    }
    if (cityStateZip) {
      const cleaned = cityStateZip[1]!.replace(/^(?:Welcome|Home|About|Contact|Visit)\s+/i, '').trim();
      if (/[A-Z][a-z]+,\s*[A-Z]{2}\s+\d{5}/.test(cleaned)) return cleaned;
    }

    return undefined;
  }

  private extractAddressPart(html: string, part: string): string | undefined {
    const schemaMap: Record<string, string> = {
      city: 'addressLocality',
      state: 'addressRegion',
      postalCode: 'postalCode',
    };
    const key = schemaMap[part];
    if (key) {
      const m = html.match(new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`));
      if (m) return this.clean(m[1]!);
    }

    const text = this.stripTags(html);
    const fullAddr = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\s+(\d{5})/);
    if (fullAddr) {
      if (part === 'city') return fullAddr[1]!.trim();
      if (part === 'state') return fullAddr[2]!.trim();
      if (part === 'postalCode') return fullAddr[3]!.trim();
    }
    return undefined;
  }

  private extractAccreditations(html: string): string[] {
    const accreds: string[] = [];
    const text = this.stripTags(html).toLowerCase();

    const patterns = [
      { re: /\b(501\s*\(?\s*c\s*\)?\s*\(?\s*3\s*\)?)\b/i, label: '501(c)(3) Nonprofit' },
      { re: /\bguidestar\b/i, label: 'GuideStar Listed' },
      { re: /\bcharity navigator\b/i, label: 'Charity Navigator Rated' },
      { re: /\bbbb\s*accredited\b/i, label: 'BBB Accredited' },
      { re: /\bno.?kill\b/i, label: 'No-Kill' },
      { re: /\bfear.?free\b/i, label: 'Fear Free Certified' },
      { re: /\baspcapro\b/i, label: 'ASPCA Pro Partner' },
      { re: /\bbest friends\s*network\b/i, label: 'Best Friends Network Partner' },
      { re: /\bmaddie.?s?\s*fund\b/i, label: "Maddie's Fund Partner" },
      { re: /\b(usda|aphis)\s*(licensed|registered)\b/i, label: 'USDA Licensed' },
      { re: /\bakc\s*(registered|breeder|club)\b/i, label: 'AKC Registered' },
      { re: /\b(tica|cfa)\s*(registered|breeder)\b/i, label: 'Cat Registry Registered' },
      { re: /\baccredited\b/i, label: 'Accredited' },
      { re: /\bsahperd\b/i, label: 'SAHPERD Affiliated' },
    ];

    for (const { re, label } of patterns) {
      if (re.test(text)) accreds.push(label);
    }

    return [...new Set(accreds)];
  }

  private extractSocialLinks(html: string): Record<string, string> {
    const links: Record<string, string> = {};
    const hrefRegex = /href=["'](https?:\/\/(?:www\.)?(?:facebook|instagram|twitter|x|youtube|linkedin|tiktok)\.[a-z]+\/[^"']+)["']/gi;
    let m;
    while ((m = hrefRegex.exec(html)) !== null) {
      const url = m[1]!;
      if (url.includes('facebook')) links.facebook = url;
      else if (url.includes('instagram')) links.instagram = url;
      else if (url.includes('twitter') || url.includes('x.com')) links.twitter = url;
      else if (url.includes('youtube')) links.youtube = url;
      else if (url.includes('linkedin')) links.linkedin = url;
      else if (url.includes('tiktok')) links.tiktok = url;
    }
    return links;
  }

  inferCategory(html: string): string | null {
    const text = this.stripTags(html).toLowerCase();
    if (/humane\s*society/i.test(text)) return 'humane_society';
    if (/\banimal\s*shelter\b|\bshelter\b/i.test(text) && /\b(adopt|rescue|animal)\b/i.test(text)) return 'shelter';
    if (/\brescue\b/i.test(text) && /\b(animal|dog|cat|pet)\b/i.test(text)) return 'rescue';
    if (/\bbreeder|breeding\b/i.test(text)) return 'breeder';
    if (/\bfoster\b/i.test(text) && /\bnetwork|program\b/i.test(text)) return 'foster_network';
    if (/\bnon.?profit|501\s*\(?\s*c\b/i.test(text)) return 'nonprofit';
    if (/\bspca\b/i.test(text)) return 'humane_society';
    return null;
  }

  private inferOrgType(html: string): string | null {
    const cat = this.inferCategory(html);
    const map: Record<string, string> = {
      humane_society: 'HUMANE_SOCIETY', shelter: 'SHELTER', rescue: 'RESCUE',
      breeder: 'BREEDER', foster_network: 'FOSTER_NETWORK', nonprofit: 'NONPROFIT',
    };
    return cat ? map[cat] ?? null : null;
  }

  private inferPetTypes(html: string): string[] {
    const types: string[] = [];
    const text = this.stripTags(html).toLowerCase();
    if (/\b(dog|puppy|puppies|canine)\b/.test(text)) types.push('DOG');
    if (/\b(cat|kitten|kittens|feline)\b/.test(text)) types.push('CAT');
    if (/\b(bird|parrot|parakeet|avian|cockatiel)\b/.test(text)) types.push('BIRD');
    return types;
  }

  private extractReviews(html: string): { reviews: ReviewCandidate[]; rating?: number; ratingCount?: number } {
    const reviews: ReviewCandidate[] = [];
    let rating: number | undefined;
    let ratingCount: number | undefined;

    const ratingValueMatch = html.match(/"ratingValue"\s*:\s*"?(\d+(?:\.\d+)?)"?/);
    const reviewCountMatch = html.match(/"reviewCount"\s*:\s*"?(\d+)"?/) || html.match(/"ratingCount"\s*:\s*"?(\d+)"?/);
    if (ratingValueMatch) {
      rating = parseFloat(ratingValueMatch[1]!);
      if (reviewCountMatch) ratingCount = parseInt(reviewCountMatch[1]!, 10);
    }

    const text = this.stripTags(html);
    if (!rating) {
      const ratedPattern = text.match(/(?:rated|rating)\s*:?\s*(\d+(?:\.\d+)?)\s*(?:out\s*of\s*(\d+)|\/\s*(\d+))/i);
      if (ratedPattern) {
        const val = parseFloat(ratedPattern[1]!);
        const max = parseFloat(ratedPattern[2] || ratedPattern[3] || '5');
        rating = max === 5 ? val : (val / max) * 5;
      }
    }
    if (!rating) {
      const simpleRating = text.match(/(\d+(?:\.\d+)?)\s*(?:out\s*of\s*5|\/\s*5)\s*(?:stars?)?/i);
      if (simpleRating) rating = parseFloat(simpleRating[1]!);
    }

    if (!ratingCount) {
      const countPattern = text.match(/(\d+)\s*(?:reviews?|ratings?|testimonials?)/i);
      if (countPattern) ratingCount = parseInt(countPattern[1]!, 10);
    }

    const googleSnippet = text.match(/(\d+(?:\.\d+)?)\s*(?:stars?\s*)?(?:on\s*)?Google(?:\s*Reviews?)?/i);
    if (googleSnippet) {
      reviews.push({ source: 'google', rating: parseFloat(googleSnippet[1]!) });
    }
    const yelpSnippet = text.match(/(\d+(?:\.\d+)?)\s*(?:stars?\s*)?(?:on\s*)?Yelp/i);
    if (yelpSnippet) {
      reviews.push({ source: 'yelp', rating: parseFloat(yelpSnippet[1]!) });
    }
    const fbSnippet = text.match(/(\d+(?:\.\d+)?)\s*(?:stars?\s*)?(?:on\s*)?Facebook/i);
    if (fbSnippet) {
      reviews.push({ source: 'facebook', rating: parseFloat(fbSnippet[1]!) });
    }

    const starElements = [...html.matchAll(/<[^>]+class="[^"]*(?:star|rating)[^"]*"[^>]*>[\s\S]*?<\/[^>]+>/gi)];
    for (const el of starElements.slice(0, 5)) {
      const elText = this.stripTags(el[0]).trim();
      const starRating = elText.match(/(\d+(?:\.\d+)?)/);
      if (starRating && !reviews.some(r => r.source === 'website')) {
        reviews.push({ source: 'website', rating: parseFloat(starRating[1]!) });
      }
    }

    return { reviews, rating, ratingCount };
  }

  private extractMissionStatement(html: string, markdown?: string): string | null {
    if (markdown) {
      const missionSection = markdown.match(/#{1,4}\s*(?:Our\s*)?(?:Mission|Vision|Values|About\s*Us|Who\s*We\s*Are)\s*\n+([\s\S]*?)(?=\n#{1,4}\s|\n---|\n\*\*\*|$)/i);
      if (missionSection) {
        const text = missionSection[1]!
          .replace(/!\[.*?\]\(.*?\)/g, '')
          .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
          .trim();
        if (text.length > 30 && text.length < 1000) return text.slice(0, 500);
      }
    }

    const missionPatterns = [
      /<(?:div|section|p)[^>]*class="[^"]*(?:mission|vision|values|about)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|section|p)>/i,
      /<h[1-4][^>]*>[^<]*(?:Our\s*)?(?:Mission|Vision)[^<]*<\/h[1-4]>\s*(?:<[^>]+>)*\s*<p[^>]*>([\s\S]*?)<\/p>/i,
    ];

    for (const pattern of missionPatterns) {
      const match = html.match(pattern);
      if (match) {
        const text = this.stripTags(match[1]!).trim();
        if (text.length > 30 && text.length < 1000) return text.slice(0, 500);
      }
    }

    return null;
  }

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return `+1-${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+1-${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
    return phone;
  }

  private metaContent(html: string, name: string, attr: string): string | null {
    const re1 = new RegExp(`<meta[^>]+${attr}=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i');
    const m1 = html.match(re1);
    if (m1) return m1[1]!.trim();
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${name}["']`, 'i');
    const m2 = html.match(re2);
    return m2 ? m2[1]!.trim() : null;
  }

  private resolveUrl(url: string, base: string): string {
    try { return new URL(url, base).href; } catch { return url; }
  }

  private isScheduleText(text: string): boolean {
    const lower = text.toLowerCase();
    const scheduleSignals = [
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b.*\d{1,2}\s*(am|pm)/i,
      /\b(closed|open)\b.*\b(closed|open)\b/i,
      /\d{1,2}\s*(am|pm)\s*[-–]\s*\d{1,2}\s*(am|pm)/i,
      /\b(thanksgiving|christmas|july\s*4|memorial\s*day|labor\s*day|new\s*year|easter|mlk|independence\s*day)\b/i,
      /\b(hours|schedule|holiday)\b.*\b(closed|open)\b/i,
      /\bselect\s*a\s*department\b/i,
      /\b(department|category)\s*\*\s*select/i,
      /\bcontact\s*us\b.*\bquestions\b/i,
      /\bshoot\s*us\s*a\s*message\b/i,
      /\b(form|submit|first\s*name|last\s*name|email\s*address|phone\s*number)\b.*\b(form|submit|first\s*name|last\s*name|email\s*address)\b/i,
    ];
    const matchCount = scheduleSignals.filter(re => re.test(lower)).length;
    if (matchCount >= 1) return true;
    const pipeCount = (text.match(/\|/g) || []).length;
    if (pipeCount >= 3 && /\b(closed|open|am|pm)\b/i.test(lower)) return true;
    if (pipeCount >= 5) return true;
    return false;
  }

  private clean(text: string): string {
    return text
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
      .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
      .replace(/&ndash;/g, '–').replace(/&mdash;/g, '—')
      .replace(/&rsquo;/g, '\u2019').replace(/&lsquo;/g, '\u2018')
      .replace(/&nbsp;/g, ' ')
      .trim();
  }

  private stripTags(html: string): string {
    return html.replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ');
  }
}
