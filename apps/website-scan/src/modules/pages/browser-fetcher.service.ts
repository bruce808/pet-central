import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { chromium, Browser, BrowserContext, Page, Response } from 'playwright';
import * as crypto from 'crypto';
import type { FetchResult } from './page-fetcher.service';

export interface BrowserFetchOptions {
  waitForSelector?: string;
  waitMs?: number;
  blockResources?: string[];
  interceptApis?: boolean;
}

export interface InterceptedApiData {
  url: string;
  data: unknown;
}

export interface BrowserFetchResult extends FetchResult {
  interceptedApis: InterceptedApiData[];
}

const API_PATTERNS = [
  /\/api\//i,
  /\/v\d+\//i,
  /shelterluv\.com/i,
  /adopets\.com/i,
  /petango\.com/i,
  /petfinder\.com/i,
  /24petconnect\.com/i,
  /rescuegroups\.org/i,
  /\/graphql/i,
  /\/animals/i,
  /\/pets/i,
  /\/adoptable/i,
  /\/search/i,
  /\/listings/i,
];

@Injectable()
export class BrowserFetcherService implements OnModuleDestroy {
  private readonly logger = new Logger(BrowserFetcherService.name);
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private launchPromise: Promise<void> | null = null;
  private currentBlockedTypes = new Set<string>();

  async onModuleDestroy() {
    await this.close();
  }

  private async ensureBrowser(blockResources?: string[]) {
    if (this.browser?.isConnected() && this.page && !this.page.isClosed()) {
      const newBlocked = new Set(blockResources ?? ['media', 'font']);
      if (this.setsEqual(newBlocked, this.currentBlockedTypes)) return;
    }

    if (this.launchPromise) { await this.launchPromise; return; }

    this.launchPromise = (async () => {
      if (!this.browser?.isConnected()) {
        this.logger.log('Launching headless browser...');
        this.browser = await chromium.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
        });
      }

      if (this.page && !this.page.isClosed()) await this.page.close().catch(() => {});
      if (this.context) await this.context.close().catch(() => {});

      this.context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 900 },
        ignoreHTTPSErrors: true,
      });

      this.page = await this.context.newPage();
      this.currentBlockedTypes = new Set(blockResources ?? ['media', 'font']);

      await this.page.route('**/*', (route) => {
        const type = route.request().resourceType();
        if (this.currentBlockedTypes.has(type)) return route.abort();
        const url = route.request().url();
        if (/google-analytics|googletagmanager|facebook\.com\/tr|doubleclick|hotjar|mixpanel|sentry/i.test(url)) {
          return route.abort();
        }
        return route.continue();
      });

      this.logger.log('Headless browser ready (single-page session with API interception)');
    })();

    await this.launchPromise;
    this.launchPromise = null;
  }

  async close() {
    if (this.page && !this.page.isClosed()) await this.page.close().catch(() => {});
    this.page = null;
    if (this.context) await this.context.close().catch(() => {});
    this.context = null;
    if (this.browser) await this.browser.close().catch(() => {});
    this.browser = null;
  }

  async fetchPage(url: string, options?: BrowserFetchOptions): Promise<BrowserFetchResult | null> {
    const fetchStartedAt = new Date();
    const interceptedApis: InterceptedApiData[] = [];

    try {
      await this.ensureBrowser(options?.blockResources);
      if (!this.page || this.page.isClosed()) return null;

      const responseHandler = async (resp: Response) => {
        try {
          const respUrl = resp.url();
          const contentType = resp.headers()['content-type'] ?? '';
          if (!contentType.includes('json') && !contentType.includes('graphql')) return;
          if (resp.status() >= 400) return;

          const bodyText = await resp.text().catch(() => '');
          if (bodyText.length < 100 || bodyText.length > 5_000_000) return;

          let body: unknown;
          try { body = JSON.parse(bodyText); } catch { return; }

          const isApiResponse = API_PATTERNS.some(p => p.test(respUrl));
          const hasAnimalData = this.looksLikeAnimalData(body);

          if (isApiResponse || hasAnimalData) {
            if (hasAnimalData) {
              this.logger.log(`Intercepted API with animal data: ${respUrl.substring(0, 120)} (${bodyText.length} bytes)`);
              interceptedApis.push({ url: respUrl, data: body });
            }
          }
        } catch {}
      };

      this.page.on('response', responseHandler);

      const response = await this.page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 15_000,
      });

      if (!response) {
        this.page.off('response', responseHandler);
        return null;
      }

      const httpStatus = response.status();
      if (httpStatus >= 400) {
        this.logger.debug(`Browser: HTTP ${httpStatus} for ${url}`);
        this.page.off('response', responseHandler);
        return null;
      }

      if (options?.waitForSelector) {
        await this.page.waitForSelector(options.waitForSelector, { timeout: 8_000 }).catch(() => {});
      }

      const waitTime = options?.waitMs ?? (interceptedApis.length > 0 ? 1000 : 3000);
      await this.page.waitForTimeout(waitTime);

      this.page.off('response', responseHandler);

      const html = await this.page.content();
      const fetchCompletedAt = new Date();

      if (html.length < 200 && interceptedApis.length === 0) return null;

      const checksum = crypto.createHash('sha256').update(html).digest('hex');
      const title = await this.page.title().catch(() => null);
      const metaDescription = await this.page.$eval(
        'meta[name="description"]',
        (el) => el.getAttribute('content'),
      ).catch(() => null);
      const canonicalUrl = await this.page.$eval(
        'link[rel="canonical"]',
        (el) => el.getAttribute('href'),
      ).catch(() => null);

      if (interceptedApis.length > 0) {
        this.logger.log(`Captured ${interceptedApis.length} API response(s) from ${url}`);
      }

      return {
        html,
        canonicalUrl,
        contentType: 'text/html',
        httpStatus,
        fetchStartedAt,
        fetchCompletedAt,
        checksum,
        rawStoragePath: null,
        title,
        metaDescription,
        interceptedApis,
      };
    } catch (error: any) {
      this.logger.warn(`Browser fetch failed for ${url}: ${error.message}`);
      if (this.page?.isClosed()) this.page = null;
      return null;
    }
  }

  private looksLikeAnimalData(data: unknown): boolean {
    if (!data) return false;
    const str = JSON.stringify(data).toLowerCase();
    if (str.length < 50) return false;

    const signals = ['"name"', '"breed"', '"species"', '"animal"', '"pet"', '"sex"', '"gender"', '"age"', '"photo"', '"image"'];
    const matchCount = signals.filter(s => str.includes(s)).length;
    if (matchCount >= 3) return true;

    if (Array.isArray(data) && data.length >= 2) {
      const first = data[0];
      if (typeof first === 'object' && first !== null) {
        const keys = Object.keys(first).map(k => k.toLowerCase());
        const animalKeys = keys.filter(k => /name|breed|species|animal|pet|sex|gender|age|photo|image|color|weight|description|bio/.test(k));
        if (animalKeys.length >= 2) return true;
      }
    }

    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      for (const val of Object.values(data)) {
        if (Array.isArray(val) && val.length >= 2) {
          const first = val[0];
          if (typeof first === 'object' && first !== null) {
            const keys = Object.keys(first).map(k => k.toLowerCase());
            const animalKeys = keys.filter(k => /name|breed|species|animal|pet|sex|gender|age|photo|image/.test(k));
            if (animalKeys.length >= 2) return true;
          }
        }
      }
    }

    return false;
  }

  private setsEqual(a: Set<string>, b: Set<string>): boolean {
    if (a.size !== b.size) return false;
    for (const item of a) if (!b.has(item)) return false;
    return true;
  }
}
