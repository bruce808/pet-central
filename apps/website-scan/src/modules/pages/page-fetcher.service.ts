import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface FetchResult {
  html: string;
  canonicalUrl: string | null;
  contentType: string;
  httpStatus: number;
  fetchStartedAt: Date;
  fetchCompletedAt: Date;
  checksum: string;
  rawStoragePath: string | null;
  title: string | null;
  metaDescription: string | null;
}

const SKIP_EXTENSIONS = /\.(jpg|jpeg|png|gif|svg|webp|ico|css|js|pdf|zip|mp4|mp3|woff|woff2|ttf|eot|xml|json|txt|rss|atom)(\?|$)/i;
const SKIP_PATHS = /(\/wp-content\/uploads|\/wp-includes|\/assets\/favicon|\/static\/|\/cdn-cgi\/|\/feed\/?$|\/xmlrpc|\/wp-json)/i;

@Injectable()
export class PageFetcherService {
  private readonly logger = new Logger(PageFetcherService.name);
  private readonly userAgent =
    'PetCentralBot/1.0 (+https://petcentral.com/bot)';

  async fetchPage(url: string): Promise<FetchResult | null> {
    if (SKIP_EXTENSIONS.test(url) || SKIP_PATHS.test(url)) {
      return null;
    }

    const fetchStartedAt = new Date();

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(20_000),
      });

      const fetchCompletedAt = new Date();

      if (response.status >= 400) {
        this.logger.debug(`Skipping HTTP ${response.status}: ${url}`);
        return null;
      }

      const contentType = response.headers.get('content-type') || 'text/html';

      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
        return null;
      }

      const html = await response.text();

      if (html.length < 200) {
        return null;
      }

      const checksum = crypto.createHash('sha256').update(html).digest('hex');
      const title = this.decodeHtmlEntities(this.extractTitle(html));
      const metaDescription = this.decodeHtmlEntities(this.extractMetaDescription(html));
      const canonicalUrl = this.extractCanonicalUrl(html);

      return {
        html,
        canonicalUrl,
        contentType,
        httpStatus: response.status,
        fetchStartedAt,
        fetchCompletedAt,
        checksum,
        rawStoragePath: null,
        title,
        metaDescription,
      };
    } catch (error: any) {
      this.logger.warn(`Failed to fetch ${url}: ${error.message}`);
      return null;
    }
  }

  discoverLinks(html: string, sourceUrl: string, domain: string): string[] {
    const links: string[] = [];
    const hrefRegex = /href=["']([^"'#]+)["']/gi;
    let match: RegExpExecArray | null;

    while ((match = hrefRegex.exec(html)) !== null) {
      const raw = match[1]!;
      if (raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('javascript:')) continue;
      if (SKIP_EXTENSIONS.test(raw)) continue;

      try {
        const resolved = new URL(raw, sourceUrl);
        if (
          (resolved.hostname === domain ||
            resolved.hostname.endsWith(`.${domain}`)) &&
          (resolved.protocol === 'http:' || resolved.protocol === 'https:')
        ) {
          resolved.hash = '';
          resolved.searchParams.delete('utm_source');
          resolved.searchParams.delete('utm_medium');
          resolved.searchParams.delete('utm_campaign');
          links.push(resolved.href);
        }
      } catch {
        // skip
      }
    }

    return [...new Set(links)];
  }

  discoverPaginationLinks(html: string, sourceUrl: string, domain: string): string[] {
    const links = new Set<string>();

    const relNext = html.match(/<link[^>]+rel=["']next["'][^>]+href=["']([^"']+)["']/i)
      ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']next["']/i);
    if (relNext) {
      this.addPaginationUrl(relNext[1]!, sourceUrl, domain, links);
    }

    const paginationContainerRegex = /<(?:nav|div|ul|ol)[^>]*class="[^"]*(?:pagination|pager|page-nav|page-numbers|paging|paginator|wp-pagenavi)[^"]*"[^>]*>([\s\S]*?)<\/(?:nav|div|ul|ol)>/gi;
    let containerMatch;
    while ((containerMatch = paginationContainerRegex.exec(html)) !== null) {
      const containerHtml = containerMatch[1]!;
      const hrefRegex = /href=["']([^"'#]+)["']/gi;
      let hrefMatch;
      while ((hrefMatch = hrefRegex.exec(containerHtml)) !== null) {
        this.addPaginationUrl(hrefMatch[1]!, sourceUrl, domain, links);
      }
    }

    const navTextRegex = /<a[^>]+href=["']([^"'#]+)["'][^>]*>\s*(?:<[^>]*>\s*)*(?:Next|Next\s*Page|&gt;|>>|›|→|&raquo;|&#8250;|&#8594;|&#187;)\s*(?:<[^>]*>\s*)*<\/a>/gi;
    let navMatch;
    while ((navMatch = navTextRegex.exec(html)) !== null) {
      this.addPaginationUrl(navMatch[1]!, sourceUrl, domain, links);
    }

    const pageParamRegex = /href=["']([^"'#]*[?&]page=\d+[^"'#]*)["']/gi;
    let paramMatch;
    while ((paramMatch = pageParamRegex.exec(html)) !== null) {
      this.addPaginationUrl(paramMatch[1]!, sourceUrl, domain, links);
    }

    const pagePathRegex = /href=["']([^"'#]*\/page\/\d+[^"'#]*)["']/gi;
    let pathMatch;
    while ((pathMatch = pagePathRegex.exec(html)) !== null) {
      this.addPaginationUrl(pathMatch[1]!, sourceUrl, domain, links);
    }

    const numberLinkRegex = /<a[^>]+href=["']([^"'#]+)["'][^>]*>\s*(\d+)\s*<\/a>/gi;
    let numMatch;
    while ((numMatch = numberLinkRegex.exec(html)) !== null) {
      const num = parseInt(numMatch[2]!, 10);
      if (num >= 2 && num <= 200) {
        this.addPaginationUrl(numMatch[1]!, sourceUrl, domain, links);
      }
    }

    links.delete(this.normalizeForPagination(sourceUrl));

    return [...links];
  }

  private addPaginationUrl(raw: string, sourceUrl: string, domain: string, links: Set<string>) {
    if (raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('javascript:')) return;
    if (SKIP_EXTENSIONS.test(raw)) return;
    try {
      const resolved = new URL(raw, sourceUrl);
      if (
        (resolved.hostname === domain || resolved.hostname.endsWith(`.${domain}`)) &&
        (resolved.protocol === 'http:' || resolved.protocol === 'https:')
      ) {
        resolved.hash = '';
        links.add(resolved.href);
      }
    } catch {}
  }

  private normalizeForPagination(url: string): string {
    try {
      const parsed = new URL(url);
      parsed.hash = '';
      return parsed.href;
    } catch {
      return url;
    }
  }

  private extractTitle(html: string): string | null {
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match ? match[1]!.trim() : null;
  }

  private extractMetaDescription(html: string): string | null {
    const match = html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    );
    if (match) return match[1]!.trim();
    const match2 = html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
    );
    return match2 ? match2[1]!.trim() : null;
  }

  private extractCanonicalUrl(html: string): string | null {
    const match = html.match(
      /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
    );
    return match ? match[1]!.trim() : null;
  }

  decodeHtmlEntities(text: string | null): string | null {
    if (!text) return null;
    return text
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
      .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&ndash;/g, '–')
      .replace(/&mdash;/g, '—')
      .replace(/&rsquo;/g, '\u2019')
      .replace(/&lsquo;/g, '\u2018')
      .replace(/&rdquo;/g, '\u201D')
      .replace(/&ldquo;/g, '\u201C')
      .replace(/&nbsp;/g, ' ');
  }
}
