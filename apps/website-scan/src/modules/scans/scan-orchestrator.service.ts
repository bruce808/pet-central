import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../common/prisma.service';
import { WebsiteScanStatus } from '@pet-central/database';
import { ScansService } from './scans.service';
import { PageFetcherService } from '../pages/page-fetcher.service';
import { MarkdownService } from '../pages/markdown.service';
import { ExtractionService } from '../extraction/extraction.service';
import { AnimalExtractorService } from '../extraction/animal-extractor.service';
import { QualityChecksService } from '../quality-checks/quality-checks.service';

const PRIORITY_DETAIL = 0;
const PRIORITY_PAGINATION = 1;
const PRIORITY_DISCOVERY = 2;

interface FrontierItem {
  url: string;
  depth: number;
  priority: number;
  discoveredFromUrl?: string;
}

@Injectable()
export class ScanOrchestratorService {
  private readonly logger = new Logger(ScanOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scansService: ScansService,
    private readonly pageFetcher: PageFetcherService,
    private readonly markdownService: MarkdownService,
    private readonly extractionService: ExtractionService,
    private readonly animalExtractor: AnimalExtractorService,
    private readonly qualityChecksService: QualityChecksService,
    @InjectQueue('website-scan') private readonly scanQueue: Queue,
  ) {}

  async startScan(
    websiteId: string,
    scanType: string = 'FULL',
    triggerType: string = 'MANUAL',
    notes?: string,
  ) {
    const website = await this.prisma.crawlWebsite.findUnique({
      where: { id: websiteId },
    });
    if (!website) throw new NotFoundException('Website not found');
    if (!website.active) throw new NotFoundException('Website is inactive');

    const scan = await this.scansService.createScan(
      websiteId,
      scanType,
      triggerType,
      notes,
    );

    await this.scanQueue.add('execute-scan', {
      scanId: scan.id,
      websiteId: website.id,
      baseUrl: website.baseUrl,
      domain: website.domain,
    });

    return scan;
  }

  async startScanSync(
    websiteId: string,
    scanType: string = 'FULL',
    triggerType: string = 'MANUAL',
    notes?: string,
  ) {
    const website = await this.prisma.crawlWebsite.findUnique({
      where: { id: websiteId },
    });
    if (!website) throw new NotFoundException('Website not found');
    if (!website.active) throw new NotFoundException('Website is inactive');

    const scan = await this.scansService.createScan(
      websiteId,
      scanType,
      triggerType,
      notes,
    );

    await this.executeScan(scan.id, website.baseUrl, website.domain);
    return this.scansService.findById(scan.id);
  }

  async executeScan(scanId: string, baseUrl: string, domain: string) {
    this.logger.log(`Starting scan ${scanId} for ${domain}`);
    this.extractionService.resetCache();

    const visited = new Set<string>();
    const checksums = new Set<string>();
    const frontier: FrontierItem[] = [{ url: baseUrl, depth: 0, priority: PRIORITY_DISCOVERY }];
    const maxPages = parseInt(process.env.SCAN_MAX_PAGES || '300', 10);
    const maxDepth = parseInt(process.env.SCAN_MAX_DEPTH || '4', 10);

    try {
      while (frontier.length > 0 && visited.size < maxPages) {
        frontier.sort((a, b) => a.priority - b.priority);
        const item = frontier.shift()!;

        const normalizedUrl = this.normalizeUrl(item.url, baseUrl);
        if (!normalizedUrl || visited.has(normalizedUrl)) continue;
        if (!this.isAllowedUrl(normalizedUrl, domain)) continue;
        if (item.priority !== PRIORITY_PAGINATION && item.depth > maxDepth) continue;

        visited.add(normalizedUrl);

        try {
          const fetchResult = await this.pageFetcher.fetchPage(normalizedUrl);
          if (!fetchResult) continue;

          if (checksums.has(fetchResult.checksum)) continue;
          checksums.add(fetchResult.checksum);

          const scanPage = await this.prisma.scanPage.create({
            data: {
              scanId,
              url: normalizedUrl,
              canonicalUrl: fetchResult.canonicalUrl,
              contentType: fetchResult.contentType,
              httpStatus: fetchResult.httpStatus,
              fetchStartedAt: fetchResult.fetchStartedAt,
              fetchCompletedAt: fetchResult.fetchCompletedAt,
              checksum: fetchResult.checksum,
              rawStoragePath: fetchResult.rawStoragePath,
              title: fetchResult.title,
              metaDescription: fetchResult.metaDescription,
              discoveredFromUrl: item.discoveredFromUrl,
              depth: item.depth,
            },
          });

          const markdown = await this.markdownService.convertToMarkdown(
            fetchResult.html,
            normalizedUrl,
          );
          if (markdown) {
            await this.prisma.scanPageMarkdown.create({
              data: {
                scanPageId: scanPage.id,
                markdownContent: markdown,
                markdownGeneratorVersion: '1.0.0',
              },
            });
          }

          const pageClassification = this.extractionService.classifyPage(
            fetchResult.html,
            fetchResult.title,
            normalizedUrl,
          );
          await this.prisma.scanPage.update({
            where: { id: scanPage.id },
            data: {
              pageType: pageClassification.pageType as any,
              isListingPage: pageClassification.isListingPage,
              isDetailPage: pageClassification.isDetailPage,
            },
          });

          const extractions = await this.extractionService.extractPageData(
            scanPage.id,
            fetchResult.html,
            markdown ?? '',
            pageClassification,
            normalizedUrl,
          );

          for (const extraction of extractions) {
            await this.prisma.scanPageExtraction.create({
              data: {
                scanPageId: scanPage.id,
                extractionType: extraction.extractionType as any,
                jsonPayload: extraction.jsonPayload,
                extractorName: extraction.extractorName,
                extractorVersion: extraction.extractorVersion,
                confidence: extraction.confidence,
              },
            });
          }

          await this.extractionService.extractEntities(
            scanId,
            scanPage.id,
            fetchResult.html,
            markdown ?? '',
            normalizedUrl,
            pageClassification,
          );
          const animalCandidates = await this.extractionService.extractAnimalListings(
            scanId,
            scanPage.id,
            fetchResult.html,
            markdown ?? '',
            pageClassification,
            normalizedUrl,
          );

          if (pageClassification.isListingPage) {
            const detailUrlsFromCards = new Set<string>();
            for (const candidate of animalCandidates) {
              if (candidate.listingUrl && !visited.has(candidate.listingUrl)) {
                detailUrlsFromCards.add(candidate.listingUrl);
                frontier.push({
                  url: candidate.listingUrl,
                  depth: item.depth + 1,
                  priority: PRIORITY_DETAIL,
                  discoveredFromUrl: normalizedUrl,
                });
              }
            }

            const allDetailUrls = this.animalExtractor.extractDetailUrlsFromListingPage(
              fetchResult.html,
              normalizedUrl,
              domain,
            );
            for (const detailUrl of allDetailUrls) {
              if (!visited.has(detailUrl) && !detailUrlsFromCards.has(detailUrl)) {
                frontier.push({
                  url: detailUrl,
                  depth: item.depth + 1,
                  priority: PRIORITY_DETAIL,
                  discoveredFromUrl: normalizedUrl,
                });
              }
            }

            const paginationLinks = this.pageFetcher.discoverPaginationLinks(
              fetchResult.html,
              normalizedUrl,
              domain,
            );
            for (const pgLink of paginationLinks) {
              if (!visited.has(pgLink)) {
                frontier.push({
                  url: pgLink,
                  depth: item.depth,
                  priority: PRIORITY_PAGINATION,
                  discoveredFromUrl: normalizedUrl,
                });
              }
            }
          }

          const links = this.pageFetcher.discoverLinks(
            fetchResult.html,
            normalizedUrl,
            domain,
          );
          for (const link of links) {
            if (!visited.has(link)) {
              frontier.push({
                url: link,
                depth: item.depth + 1,
                priority: PRIORITY_DISCOVERY,
                discoveredFromUrl: normalizedUrl,
              });
            }
          }
        } catch (pageError: any) {
          this.logger.warn(`Failed to process ${normalizedUrl}: ${pageError.message}`);
        }
      }

      await this.qualityChecksService.runChecks(scanId);
      await this.scansService.finalizeScan(scanId, WebsiteScanStatus.COMPLETED);
      this.logger.log(`Scan ${scanId} completed. Pages: ${visited.size}`);
    } catch (error: any) {
      this.logger.error(`Scan ${scanId} failed: ${error.message}`);
      await this.scansService.finalizeScan(scanId, WebsiteScanStatus.FAILED);
      throw error;
    }
  }

  private normalizeUrl(url: string, baseUrl: string): string | null {
    try {
      const resolved = new URL(url, baseUrl);
      resolved.hash = '';
      return resolved.href;
    } catch {
      return null;
    }
  }

  private isAllowedUrl(url: string, domain: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`);
    } catch {
      return false;
    }
  }
}
