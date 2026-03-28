import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import {
  ScanQualityCheckStatus,
  ScanQualitySeverity,
} from '@pet-central/database';

interface CheckResult {
  checkName: string;
  checkStatus: ScanQualityCheckStatus;
  severity: ScanQualitySeverity;
  details?: Record<string, any>;
}

@Injectable()
export class QualityChecksService {
  private readonly logger = new Logger(QualityChecksService.name);

  constructor(private readonly prisma: PrismaService) {}

  async runChecks(scanId: string): Promise<CheckResult[]> {
    const scan = await this.prisma.websiteScan.findUnique({
      where: { id: scanId },
    });
    if (!scan) throw new NotFoundException('Scan not found');

    await this.prisma.scanQualityCheck.deleteMany({ where: { scanId } });

    const results: CheckResult[] = [];

    results.push(...(await this.runPageChecks(scanId)));
    results.push(...(await this.runEntityChecks(scanId)));
    results.push(...(await this.runAnimalListingChecks(scanId)));

    for (const result of results) {
      await this.prisma.scanQualityCheck.create({
        data: {
          scanId,
          checkName: result.checkName,
          checkStatus: result.checkStatus,
          severity: result.severity,
          detailsJson: result.details ?? null,
        },
      });
    }

    this.logger.log(
      `Quality checks for scan ${scanId}: ${results.length} checks run`,
    );
    return results;
  }

  async getChecks(scanId: string) {
    return this.prisma.scanQualityCheck.findMany({
      where: { scanId },
      orderBy: [{ checkStatus: 'asc' }, { severity: 'desc' }],
    });
  }

  async getSummary(scanId: string) {
    const checks = await this.prisma.scanQualityCheck.groupBy({
      by: ['checkStatus'],
      where: { scanId },
      _count: true,
    });

    const summary = { passed: 0, warnings: 0, failures: 0, total: 0 };
    for (const c of checks) {
      if (c.checkStatus === 'PASS') summary.passed = c._count;
      else if (c.checkStatus === 'WARN') summary.warnings = c._count;
      else if (c.checkStatus === 'FAIL') summary.failures = c._count;
    }
    summary.total = summary.passed + summary.warnings + summary.failures;

    return { scanId, ...summary, isPromotable: summary.failures === 0 };
  }

  private async runPageChecks(scanId: string): Promise<CheckResult[]> {
    const results: CheckResult[] = [];

    const pages = await this.prisma.scanPage.findMany({
      where: { scanId },
      include: {
        markdown: { select: { scanPageId: true } },
        _count: { select: { extractions: true } },
      },
    });

    if (pages.length === 0) {
      results.push({
        checkName: 'pages.minimum_count',
        checkStatus: ScanQualityCheckStatus.FAIL,
        severity: ScanQualitySeverity.CRITICAL_SEVERITY,
        details: { message: 'No pages were fetched' },
      });
      return results;
    }

    results.push({
      checkName: 'pages.minimum_count',
      checkStatus: ScanQualityCheckStatus.PASS,
      severity: ScanQualitySeverity.LOW_SEVERITY,
      details: { pageCount: pages.length },
    });

    const withoutMarkdown = pages.filter((p) => !p.markdown);
    if (withoutMarkdown.length > 0) {
      const ratio = withoutMarkdown.length / pages.length;
      results.push({
        checkName: 'pages.markdown_coverage',
        checkStatus: ratio > 0.5 ? ScanQualityCheckStatus.FAIL : ScanQualityCheckStatus.WARN,
        severity: ratio > 0.5 ? ScanQualitySeverity.HIGH_SEVERITY : ScanQualitySeverity.MEDIUM_SEVERITY,
        details: { missing: withoutMarkdown.length, total: pages.length },
      });
    } else {
      results.push({
        checkName: 'pages.markdown_coverage',
        checkStatus: ScanQualityCheckStatus.PASS,
        severity: ScanQualitySeverity.LOW_SEVERITY,
      });
    }

    const classified = pages.filter((p) => p.pageType !== 'OTHER_PAGE');
    results.push({
      checkName: 'pages.classification_coverage',
      checkStatus: classified.length > 0 ? ScanQualityCheckStatus.PASS : ScanQualityCheckStatus.WARN,
      severity: ScanQualitySeverity.MEDIUM_SEVERITY,
      details: { classified: classified.length, total: pages.length },
    });

    return results;
  }

  private async runEntityChecks(scanId: string): Promise<CheckResult[]> {
    const results: CheckResult[] = [];

    const entities = await this.prisma.scanEntity.findMany({
      where: { scanId },
      include: { _count: { select: { contacts: true } } },
    });

    if (entities.length === 0) {
      results.push({
        checkName: 'entities.present',
        checkStatus: ScanQualityCheckStatus.WARN,
        severity: ScanQualitySeverity.MEDIUM_SEVERITY,
        details: { message: 'No entities extracted' },
      });
      return results;
    }

    results.push({
      checkName: 'entities.present',
      checkStatus: ScanQualityCheckStatus.PASS,
      severity: ScanQualitySeverity.LOW_SEVERITY,
      details: { count: entities.length },
    });

    for (const entity of entities) {
      if (!entity.category) {
        results.push({
          checkName: 'entities.category_confidence',
          checkStatus: ScanQualityCheckStatus.WARN,
          severity: ScanQualitySeverity.MEDIUM_SEVERITY,
          details: { entityId: entity.id, name: entity.name },
        });
      }

      if (entity._count.contacts === 0) {
        results.push({
          checkName: 'entities.contact_present',
          checkStatus: ScanQualityCheckStatus.WARN,
          severity: ScanQualitySeverity.MEDIUM_SEVERITY,
          details: { entityId: entity.id, name: entity.name },
        });
      }
    }

    return results;
  }

  private async runAnimalListingChecks(scanId: string): Promise<CheckResult[]> {
    const results: CheckResult[] = [];

    const listings = await this.prisma.scanAnimalListing.findMany({
      where: { scanId },
    });

    if (listings.length === 0) {
      results.push({
        checkName: 'animals.present',
        checkStatus: ScanQualityCheckStatus.PASS,
        severity: ScanQualitySeverity.LOW_SEVERITY,
        details: { message: 'No animal listings (may be expected)' },
      });
      return results;
    }

    results.push({
      checkName: 'animals.present',
      checkStatus: ScanQualityCheckStatus.PASS,
      severity: ScanQualitySeverity.LOW_SEVERITY,
      details: { count: listings.length },
    });

    const withoutType = listings.filter((l) => !l.animalType);
    if (withoutType.length > 0) {
      results.push({
        checkName: 'animals.type_present',
        checkStatus: ScanQualityCheckStatus.WARN,
        severity: ScanQualitySeverity.MEDIUM_SEVERITY,
        details: { missing: withoutType.length, total: listings.length },
      });
    }

    const withoutName = listings.filter((l) => !l.name && !l.listingExternalId);
    if (withoutName.length > 0) {
      results.push({
        checkName: 'animals.identity_present',
        checkStatus: ScanQualityCheckStatus.WARN,
        severity: ScanQualitySeverity.MEDIUM_SEVERITY,
        details: { missing: withoutName.length, total: listings.length },
      });
    }

    const withoutSource = listings.filter((l) => !l.listingUrl && !l.sourceScanPageId);
    if (withoutSource.length > 0) {
      results.push({
        checkName: 'animals.source_present',
        checkStatus: ScanQualityCheckStatus.WARN,
        severity: ScanQualitySeverity.MEDIUM_SEVERITY,
        details: { missing: withoutSource.length, total: listings.length },
      });
    }

    return results;
  }
}
