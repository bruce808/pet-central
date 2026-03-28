import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { PageClassifierService, PageClassification } from './page-classifier.service';
import { OrganizationExtractorService, OrganizationCandidate } from './organization-extractor.service';
import { AnimalExtractorService, AnimalCandidate } from './animal-extractor.service';

export interface ExtractionResult {
  extractionType: string;
  jsonPayload: any;
  extractorName: string;
  extractorVersion: string;
  confidence: number;
}

@Injectable()
export class ExtractionService {
  private readonly logger = new Logger(ExtractionService.name);
  private siteOrgCache = new Map<string, string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly pageClassifier: PageClassifierService,
    private readonly orgExtractor: OrganizationExtractorService,
    private readonly animalExtractor: AnimalExtractorService,
  ) {}

  resetCache() {
    this.siteOrgCache.clear();
  }

  classifyPage(html: string, title: string | null, url: string): PageClassification {
    return this.pageClassifier.classify(html, title, url);
  }

  async extractPageData(
    scanPageId: string,
    html: string,
    markdown: string,
    classification: PageClassification,
    pageUrl?: string,
  ): Promise<ExtractionResult[]> {
    const results: ExtractionResult[] = [];

    const contacts = this.orgExtractor.extractContacts(html);
    if (contacts.length > 0) {
      results.push({
        extractionType: 'CONTACT_EXTRACTION',
        jsonPayload: { contacts },
        extractorName: 'contact-extractor',
        extractorVersion: '2.0.0',
        confidence: 0.85,
      });
    }

    if (['HOME', 'ABOUT', 'CONTACT'].includes(classification.pageType)) {
      const org = this.orgExtractor.extract(html, markdown, pageUrl ?? '');
      if (org) {
        results.push({
          extractionType: 'ORGANIZATION_EXTRACTION',
          jsonPayload: {
            name: org.name,
            canonicalWebsite: org.canonicalWebsite,
            category: org.category,
            organizationType: org.organizationType,
            petTypes: org.petTypes,
            summaryDescription: org.summaryDescription,
            missionStatement: org.missionStatement,
            logoUrl: org.logoUrl,
            imageUrls: org.imageUrls,
            addressRaw: org.addressRaw,
            city: org.city,
            state: org.state,
            postalCode: org.postalCode,
            accreditations: org.accreditations,
            socialLinks: org.socialLinks,
            reviews: org.reviews,
            rating: org.rating,
            ratingCount: org.ratingCount,
          },
          extractorName: 'organization-extractor',
          extractorVersion: '2.0.0',
          confidence: org.confidence,
        });
      }
    }

    if (classification.isListingPage) {
      results.push({
        extractionType: 'ANIMAL_LIST_PAGE_EXTRACTION',
        jsonPayload: { pageType: 'listing', classification },
        extractorName: 'page-classifier',
        extractorVersion: '2.0.0',
        confidence: classification.confidence,
      });
    }

    if (classification.isDetailPage) {
      results.push({
        extractionType: 'ANIMAL_DETAIL_PAGE_EXTRACTION',
        jsonPayload: { pageType: 'detail', classification },
        extractorName: 'page-classifier',
        extractorVersion: '2.0.0',
        confidence: classification.confidence,
      });
    }

    return results;
  }

  async extractEntities(
    scanId: string,
    scanPageId: string,
    html: string,
    markdown: string,
    pageUrl: string,
    classification: PageClassification,
  ) {
    if (!['HOME', 'ABOUT', 'CONTACT'].includes(classification.pageType)) return;

    let origin = '';
    try { origin = new URL(pageUrl).origin; } catch {}

    if (this.siteOrgCache.has(origin)) {
      const existingId = this.siteOrgCache.get(origin)!;
      const org = this.orgExtractor.extract(html, markdown, pageUrl);
      if (org && org.contacts.length > 0) {
        for (const contact of org.contacts) {
          const exists = await this.prisma.scanEntityContact.findFirst({
            where: { scanEntityId: existingId, valueRaw: contact.valueRaw },
          });
          if (!exists) {
            await this.prisma.scanEntityContact.create({
              data: {
                scanEntityId: existingId,
                contactType: contact.contactType,
                label: contact.label,
                valueRaw: contact.valueRaw,
                valueNormalized: contact.valueNormalized,
                confidence: contact.confidence,
                sourceScanPageId: scanPageId,
              },
            });
          }
        }
      }
      return;
    }

    const org = this.orgExtractor.extract(html, markdown, pageUrl);
    if (!org) return;

    const entity = await this.prisma.scanEntity.create({
      data: {
        scanId,
        name: org.name,
        canonicalWebsite: org.canonicalWebsite,
        category: org.category,
        organizationType: org.organizationType,
        petTypes: org.petTypes ?? [],
        summaryDescription: org.summaryDescription,
        confidence: org.confidence,
        jsonPayload: {
          logoUrl: org.logoUrl,
          imageUrls: org.imageUrls,
          addressRaw: org.addressRaw,
          city: org.city,
          state: org.state,
          postalCode: org.postalCode,
          accreditations: org.accreditations,
          socialLinks: org.socialLinks,
          missionStatement: org.missionStatement,
          reviews: org.reviews.map(r => ({ ...r })),
          rating: org.rating,
          ratingCount: org.ratingCount,
        },
      },
    });

    this.siteOrgCache.set(origin, entity.id);

    for (const contact of org.contacts) {
      await this.prisma.scanEntityContact.create({
        data: {
          scanEntityId: entity.id,
          contactType: contact.contactType,
          label: contact.label,
          valueRaw: contact.valueRaw,
          valueNormalized: contact.valueNormalized,
          confidence: contact.confidence,
          sourceScanPageId: scanPageId,
        },
      });
    }
  }

  async extractAnimalListings(
    scanId: string,
    scanPageId: string,
    html: string,
    markdown: string,
    classification: PageClassification,
    pageUrl?: string,
  ): Promise<AnimalCandidate[]> {
    if (classification.isListingPage) {
      const candidates = this.animalExtractor.extractFromListingPage(html, markdown, pageUrl ?? '');
      for (const candidate of candidates) {
        await this.persistAnimalListing(scanId, scanPageId, null, candidate);
      }
      return candidates;
    }

    if (classification.isDetailPage) {
      const candidate = this.animalExtractor.extractFromDetailPage(html, markdown, pageUrl ?? '');
      if (candidate) {
        await this.persistAnimalListing(scanId, null, scanPageId, candidate);
      }
    }

    return [];
  }

  private async persistAnimalListing(
    scanId: string,
    sourceScanPageId: string | null,
    detailScanPageId: string | null,
    candidate: any,
  ) {
    await this.prisma.scanAnimalListing.create({
      data: {
        scanId,
        sourceScanPageId,
        detailScanPageId,
        listingUrl: candidate.listingUrl,
        listingExternalId: candidate.listingExternalId,
        name: candidate.name,
        animalType: candidate.animalType as any,
        breed: candidate.breed,
        secondaryBreed: candidate.secondaryBreed,
        sex: candidate.sex,
        ageText: candidate.ageText,
        ageCategory: candidate.ageCategory,
        size: candidate.size,
        color: candidate.color,
        coat: candidate.coat,
        adoptionStatus: candidate.adoptionStatus,
        availabilityStatus: candidate.availabilityStatus,
        specialNeeds: candidate.specialNeeds,
        goodWithChildren: candidate.goodWithChildren,
        goodWithDogs: candidate.goodWithDogs,
        goodWithCats: candidate.goodWithCats,
        houseTrained: candidate.houseTrained,
        spayedNeutered: candidate.spayedNeutered,
        vaccinated: candidate.vaccinated,
        declawed: candidate.declawed,
        description: candidate.description,
        locationCity: candidate.locationCity,
        locationState: candidate.locationState,
        organizationName: candidate.organizationName,
        organizationReference: candidate.organizationReference,
        photoUrlsJson: candidate.photoUrls ?? [],
        attributeJson: {
          ...(candidate.attributeJson ?? {}),
          weight: candidate.weight,
          adoptionFee: candidate.adoptionFee,
          microchipped: candidate.microchipped,
          adoptionRequirements: candidate.adoptionRequirements ?? [],
        },
        confidence: candidate.confidence,
      },
    });
  }
}
