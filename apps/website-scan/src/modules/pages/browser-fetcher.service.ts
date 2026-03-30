import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import * as crypto from 'crypto';
import type { FetchResult } from './page-fetcher.service';

export interface BrowserFetchOptions {
  waitForSelector?: string;
  waitMs?: number;
  blockResources?: string[];
}

@Injectable()
export class BrowserFetcherService implements OnModuleDestroy {
  private readonly logger = new Logger(BrowserFetcherService.name);
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private launchPromise: Promise<void> | null = null;
  private routesConfigured = false;
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

      this.routesConfigured = true;
      this.logger.log('Headless browser ready (single-page session)');
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
    this.routesConfigured = false;
  }

  async fetchPage(url: string, options?: BrowserFetchOptions): Promise<FetchResult | null> {
    const fetchStartedAt = new Date();

    try {
      await this.ensureBrowser(options?.blockResources);
      if (!this.page || this.page.isClosed()) return null;

      const response = await this.page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 15_000,
      });

      if (!response) return null;

      const httpStatus = response.status();
      if (httpStatus >= 400) {
        this.logger.debug(`Browser: HTTP ${httpStatus} for ${url}`);
        return null;
      }

      if (options?.waitForSelector) {
        await this.page.waitForSelector(options.waitForSelector, { timeout: 8_000 }).catch(() => {});
      } else if (options?.waitMs) {
        await this.page.waitForTimeout(options.waitMs);
      } else {
        await this.page.waitForTimeout(1000);
      }

      const html = await this.page.content();
      const fetchCompletedAt = new Date();

      if (html.length < 200) return null;

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
      };
    } catch (error: any) {
      this.logger.warn(`Browser fetch failed for ${url}: ${error.message}`);
      if (this.page?.isClosed()) this.page = null;
      return null;
    }
  }

  private setsEqual(a: Set<string>, b: Set<string>): boolean {
    if (a.size !== b.size) return false;
    for (const item of a) if (!b.has(item)) return false;
    return true;
  }
}
