export enum WebsiteScanType {
  Full = 'full',
  Incremental = 'incremental',
  Targeted = 'targeted',
}

export enum WebsiteScanTrigger {
  Scheduled = 'scheduled',
  Manual = 'manual',
  Retry = 'retry',
}

export enum WebsiteScanStatus {
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Partial = 'partial',
}

export enum ScanPageType {
  Home = 'home',
  About = 'about',
  Contact = 'contact',
  Directory = 'directory',
  AnimalListing = 'animal_listing',
  AnimalDetail = 'animal_detail',
  Faq = 'faq',
  Policy = 'policy',
  Other = 'other',
}

export enum ScanExtractionType {
  Organization = 'organization',
  Contact = 'contact',
  Policy = 'policy',
  AnimalListPage = 'animal_list_page',
  AnimalDetailPage = 'animal_detail_page',
  ServiceArea = 'service_area',
  TrustSignal = 'trust_signal',
  Other = 'other',
}

export enum ScanAnimalType {
  Dog = 'dog',
  Cat = 'cat',
  Bird = 'bird',
  Other = 'other',
}

export enum ScanQualityCheckStatus {
  Pass = 'pass',
  Warn = 'warn',
  Fail = 'fail',
}

export enum ScanQualitySeverity {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export enum PromotionStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Completed = 'completed',
  Failed = 'failed',
}

export enum PromotionRecordType {
  Organization = 'organization',
  AnimalListing = 'animal_listing',
  Contact = 'contact',
  TrustSignal = 'trust_signal',
}

export enum PromotionAction {
  Insert = 'insert',
  Update = 'update',
  Deactivate = 'deactivate',
  Skip = 'skip',
}

// ─── DTOs ───────────────────────────────────────────────────────────────────

export interface CreateCrawlWebsiteDto {
  domain: string;
  baseUrl: string;
  sourceType: string;
  organizationHint?: string;
}

export interface UpdateCrawlWebsiteDto {
  baseUrl?: string;
  sourceType?: string;
  organizationHint?: string;
  active?: boolean;
}

export interface StartWebsiteScanDto {
  websiteId: string;
  scanType?: WebsiteScanType;
  triggerType?: WebsiteScanTrigger;
  notes?: string;
}

export interface PromoteScanDto {
  scanId: string;
  approvedBy?: string;
  notes?: string;
}

// ─── Responses ──────────────────────────────────────────────────────────────

export interface CrawlWebsiteResponse {
  id: string;
  domain: string;
  baseUrl: string;
  sourceType: string;
  organizationHint: string | null;
  active: boolean;
  createdAt: string;
}

export interface WebsiteScanResponse {
  id: string;
  websiteId: string;
  startedAt: string;
  completedAt: string | null;
  scanType: WebsiteScanType;
  triggerType: WebsiteScanTrigger;
  status: WebsiteScanStatus;
  crawlerVersion: string | null;
  extractorVersion: string | null;
  pageCount: number;
  listingCount: number;
  notes: string | null;
}

export interface ScanPageResponse {
  id: string;
  scanId: string;
  url: string;
  canonicalUrl: string | null;
  contentType: string | null;
  httpStatus: number | null;
  title: string | null;
  pageType: ScanPageType;
  depth: number;
  isListingPage: boolean;
  isDetailPage: boolean;
  hasMarkdown: boolean;
  extractionCount: number;
}

export interface ScanPageMarkdownResponse {
  scanPageId: string;
  markdownContent: string;
  markdownGeneratorVersion: string | null;
}

export interface ScanEntityResponse {
  id: string;
  scanId: string;
  name: string;
  canonicalWebsite: string | null;
  category: string | null;
  organizationType: string | null;
  petTypes: string[];
  confidence: number | null;
  contactCount: number;
}

export interface ScanAnimalListingResponse {
  id: string;
  scanId: string;
  listingUrl: string | null;
  listingExternalId: string | null;
  name: string | null;
  animalType: ScanAnimalType | null;
  breed: string | null;
  sex: string | null;
  ageText: string | null;
  adoptionStatus: string | null;
  locationCity: string | null;
  locationState: string | null;
  organizationName: string | null;
  confidence: number | null;
  photoUrls: string[];
}

export interface ScanQualityCheckResponse {
  id: string;
  scanId: string;
  checkName: string;
  checkStatus: ScanQualityCheckStatus;
  severity: ScanQualitySeverity;
  details: Record<string, unknown> | null;
}

export interface ScanQualitySummary {
  scanId: string;
  totalChecks: number;
  passed: number;
  warnings: number;
  failures: number;
  isPromotable: boolean;
}

export interface ScanPromotionBatchResponse {
  id: string;
  scanId: string;
  startedAt: string;
  completedAt: string | null;
  status: PromotionStatus;
  approvedBy: string | null;
  resultCount: number;
}

export interface ScanPromotionResultResponse {
  id: string;
  recordType: PromotionRecordType;
  sourceRecordId: string;
  targetRecordId: string | null;
  action: PromotionAction;
  notes: string | null;
}

export interface ScanStatistics {
  totalPages: number;
  totalEntities: number;
  totalAnimalListings: number;
  qualityChecksSummary: ScanQualitySummary;
  pageTypeBreakdown: Record<string, number>;
  animalTypeBreakdown: Record<string, number>;
}
