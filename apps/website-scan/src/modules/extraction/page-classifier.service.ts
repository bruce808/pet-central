import { Injectable, Logger } from '@nestjs/common';

export interface PageClassification {
  pageType: string;
  isListingPage: boolean;
  isDetailPage: boolean;
  confidence: number;
}

@Injectable()
export class PageClassifierService {
  private readonly logger = new Logger(PageClassifierService.name);

  classify(html: string, title: string | null, url: string): PageClassification {
    const text = this.stripTags(html).toLowerCase();
    const urlPath = this.getUrlPath(url);
    const titleLower = (title ?? '').toLowerCase();

    if (this.isFaqPage(urlPath, titleLower))
      return { pageType: 'FAQ', isListingPage: false, isDetailPage: false, confidence: 0.9 };
    if (this.isPolicyPage(urlPath, titleLower))
      return { pageType: 'POLICY', isListingPage: false, isDetailPage: false, confidence: 0.85 };
    if (this.isResourcePage(urlPath, titleLower))
      return { pageType: 'OTHER_PAGE', isListingPage: false, isDetailPage: false, confidence: 0.8 };
    if (this.isNonAnimalPage(urlPath, titleLower))
      return { pageType: 'OTHER_PAGE', isListingPage: false, isDetailPage: false, confidence: 0.8 };

    if (this.isAnimalListingByUrl(urlPath))
      return { pageType: 'ANIMAL_LISTING', isListingPage: true, isDetailPage: false, confidence: 0.9 };
    if (this.isAnimalDetailByUrl(urlPath))
      return { pageType: 'ANIMAL_DETAIL', isListingPage: false, isDetailPage: true, confidence: 0.9 };

    if (this.isAnimalListingBySignals(urlPath, titleLower, html, text))
      return { pageType: 'ANIMAL_LISTING', isListingPage: true, isDetailPage: false, confidence: 0.8 };
    if (this.isAnimalDetailBySignals(urlPath, titleLower, text))
      return { pageType: 'ANIMAL_DETAIL', isListingPage: false, isDetailPage: true, confidence: 0.75 };

    if (this.isHomePage(urlPath))
      return { pageType: 'HOME', isListingPage: false, isDetailPage: false, confidence: 0.9 };
    if (this.isAboutPage(urlPath, titleLower))
      return { pageType: 'ABOUT', isListingPage: false, isDetailPage: false, confidence: 0.8 };
    if (this.isContactPage(urlPath, titleLower))
      return { pageType: 'CONTACT', isListingPage: false, isDetailPage: false, confidence: 0.8 };

    return { pageType: 'OTHER_PAGE', isListingPage: false, isDetailPage: false, confidence: 0.5 };
  }

  private getUrlPath(url: string): string {
    try { return new URL(url).pathname.toLowerCase(); } catch { return ''; }
  }

  private isHomePage(path: string): boolean {
    return path === '/' || path === '' || path === '/index.html' || path === '/home';
  }

  private isAboutPage(path: string, title: string): boolean {
    return /^\/(about|our-story|our-mission|who-we-are|history|mission)(\/|$)/.test(path) ||
      (/\babout\s*(us|our)\b/.test(title) && !/adopt|pet|animal|dog|cat/.test(title));
  }

  private isContactPage(path: string, title: string): boolean {
    return /^\/(contact|contact-us|get-in-touch|locations?)(\/|$)/.test(path) &&
      !/adopt|pet|animal|dog|cat|faq/.test(path);
  }

  private isFaqPage(path: string, title: string): boolean {
    return /\/faq/.test(path) || /\/frequently-asked/.test(path) ||
      /\bfaq\b/.test(title) || /\bfrequently asked\b/.test(title);
  }

  private isPolicyPage(path: string, title: string): boolean {
    return /^\/(privacy|terms|policy|policies|disclaimer|cookie|legal)(\/|$)/.test(path);
  }

  private isResourcePage(path: string, title: string): boolean {
    return /^\/(resources|resource|clinic|services|programs|events?|news|blog|press|media|newsletter|careers?|jobs?|intern|volunteer|donate|donation|support|give|sponsor|membership|store|shop|cart|calendar|schedule)(\/|$)/.test(path) &&
      !/\/(dogs|cats|pets|animals|adopt)/.test(path);
  }

  private isNonAnimalPage(path: string, title: string): boolean {
    return /^\/(foster|volunteer|donate|donation|give|support|sponsor|careers?|jobs?|intern|press|media|newsletter|store|shop|cart|calendar|schedule|events?|news|blog|board|governance|financials|annual-report|staff|team|groups|youth|requirements)(\/|$)/.test(path) &&
      !/\/(dogs|cats|pets|animals|adopt)/.test(path);
  }

  private isAnimalDetailByUrl(path: string): boolean {
    if (/\/(adopt|adoptable|available)\/(dogs|cats|pets|birds|other-animals)\/[a-z0-9]+-?[a-z0-9-]+\/?$/i.test(path)) return true;
    if (/\/(pet|animal|dog|cat|bird)s?\/[a-z0-9]+-[a-z0-9-]+\/?$/i.test(path)) return true;
    if (/\/(adopt|adoptable|available|pets?|animals?|dogs?|cats?)\/\d+\/?$/i.test(path)) return true;
    if (/\/(pet|animal|listing)[-_]?detail/i.test(path)) return true;
    return false;
  }

  private isAnimalDetailBySignals(path: string, title: string, text: string): boolean {
    const isSpecificAnimalUrl =
      /\/(adopt|adoptable|available)\/.+\/.+/.test(path) &&
      !/\/(dogs|cats|pets|birds|other-animals|all|special-needs|in-training|featured|category|breed|filter|search|page|puppies|kittens|senior|large|small|available|nc-|medical-needs)\/?$/i.test(path) &&
      !/\/(adopt|adoptable|available)\/(dogs|cats|pets|birds|other-animals)\/?$/i.test(path);

    if (isSpecificAnimalUrl) {
      const detailSignals = [
        /\b(adoption fee|adopt me|apply to adopt|adoption application|submit\s*(?:an?\s*)?application)\b/,
        /\b(spayed|neutered|vaccinated|microchipped|altered)\b/,
        /\b(good with (?:kids|children|dogs|cats|other))\b/,
        /\b(breed|age|sex|weight|size|color)\s*[:]\s*\S/,
        /\b(house[\s-]?trained|potty[\s-]?trained|crate[\s-]?trained)\b/,
      ];
      if (detailSignals.filter(re => re.test(text)).length >= 1) return true;
    }

    const titleDetailSignals = /\b(meet|adopt)\s+[A-Z][a-z]+\b/.test(title) ||
      /^[A-Z][a-z]+\s*[-|–—]\s*\w/.test(title);
    if (titleDetailSignals) {
      const detailSignals = [
        /\b(breed|age|sex|weight)\s*[:]\s*\S/,
        /\b(spayed|neutered|vaccinated|microchipped)\b/,
      ];
      if (detailSignals.filter(re => re.test(text)).length >= 1) return true;
    }

    return false;
  }

  private isAnimalListingByUrl(path: string): boolean {
    if (/^\/(adopt|adoptable|adoptables|available-pets|available-animals|our-pets|our-animals|find-a-pet|meet-our-pets|meet-our-animals|pets-for-adoption|animals-for-adoption|available|adoptions?)(\/)?$/i.test(path)) return true;
    if (/^\/(adopt|adoptable|available|meet-our)\/(dogs|cats|pets|birds|other-animals|rabbits|small-animals|all)(\/)?$/i.test(path)) return true;
    if (/^\/(adopt|adoptable|available|meet-our)\/(dogs|cats|pets|birds|other-animals)\/(special-needs|in-training|featured|senior|puppies|kittens|large|small|available|all|medical-needs[a-z-]*)(\/)?$/i.test(path)) return true;
    if (/^\/(dogs|cats|pets|animals)\/(available|adoptable|for-adoption)(\/)?$/i.test(path)) return true;
    if (/^\/(adopt|adoptable)\/(nc-|all-)?available[- ]?(pets|animals|dogs|cats)?(\/)?$/i.test(path)) return true;
    return false;
  }

  private isAnimalListingBySignals(path: string, title: string, html: string, text: string): boolean {
    if (/^\/(dogs|cats|puppies|kittens)(\/)?$/i.test(path) && /adopt/i.test(text)) return true;

    const titleSignals = /\b(adoptable|available)\s*(dogs|cats|pets|animals)\b/.test(title) ||
      /\b(dogs?|cats?|pets?|animals?)\s*(for|available for)\s*adoption\b/.test(title) ||
      /\b(meet our|find a|browse|search|view)\s*(pets|animals|dogs|cats)\b/.test(title) ||
      /\b(available|adoptable)\s*(pets|animals|dogs|cats|puppies|kittens)\b/.test(title);
    if (titleSignals) return true;

    const cardCount = (html.match(/<(?:div|article|li|a)[^>]*class="[^"]*(?:pet-card|animal-card|adoptable|pet-item|listing-card|result-card|pet-listing|large-tile|small-tile)[^"]*"/gi) || []).length;
    if (cardCount >= 3) return true;

    const articleCount = (html.match(/<article[^>]*>/gi) || []).length;
    if (articleCount >= 3 && /\b(adopt|pet|animal|dog|cat)\b/i.test(text)) return true;

    if (!this.looksLikeDetailPage(path)) {
      const animalLinkCount = (html.match(/href="[^"]*\/(?:adopt|pet|animal)s?\/(?:dogs|cats|birds|other-animals)\/[a-z0-9]+-[a-z0-9-]+"/gi) || []).length;
      if (animalLinkCount >= 6) return true;
    }

    return false;
  }

  private looksLikeDetailPage(path: string): boolean {
    if (/\/[a-z]+-[a-z]-\d+\/?$/i.test(path)) return true;
    if (/\/apa-a-\d+\/?$/i.test(path)) return true;
    if (/\/(pet|animal|dog|cat|bird)s?\/[a-z0-9]+-[a-z0-9-]+\/?$/i.test(path)) return true;
    if (/\/(adopt|adoptable|available)\/(dogs|cats|pets|birds|other-animals)\/[a-z0-9]+-?[a-z0-9-]+\/?$/i.test(path)) return true;
    return false;
  }

  private stripTags(html: string): string {
    return html.replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ');
  }
}
