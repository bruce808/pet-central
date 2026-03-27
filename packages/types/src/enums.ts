export enum UserStatus {
  Active = 'active',
  Pending = 'pending',
  Suspended = 'suspended',
  Banned = 'banned',
}

export enum Role {
  Guest = 'guest',
  AuthenticatedUser = 'authenticated_user',
  VendorMember = 'vendor_member',
  VendorAdmin = 'vendor_admin',
  Validator = 'validator',
  NonprofitPartner = 'nonprofit_partner',
  AgencyPartner = 'agency_partner',
  SupportAgent = 'support_agent',
  TrustAnalyst = 'trust_analyst',
  Moderator = 'moderator',
  Admin = 'admin',
}

export enum OrgType {
  Breeder = 'breeder',
  Shelter = 'shelter',
  HumaneSociety = 'humane_society',
  Rescue = 'rescue',
  Nonprofit = 'nonprofit',
  Agency = 'agency',
  FosterNetwork = 'foster_network',
}

export enum OrgStatus {
  Draft = 'draft',
  PendingVerification = 'pending_verification',
  Active = 'active',
  Suspended = 'suspended',
  Rejected = 'rejected',
}

export enum MembershipRole {
  Admin = 'admin',
  Staff = 'staff',
  Reviewer = 'reviewer',
}

export enum VerificationType {
  Identity = 'identity',
  BusinessLicense = 'business_license',
  NonprofitStatus = 'nonprofit_status',
  RescueAffiliation = 'rescue_affiliation',
  AgencyCertification = 'agency_certification',
  Insurance = 'insurance',
  BackgroundCheck = 'background_check',
}

export enum VerificationStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
  Expired = 'expired',
  Revoked = 'revoked',
}

export enum DocumentStatus {
  Pending = 'pending',
  Verified = 'verified',
  Rejected = 'rejected',
  Expired = 'expired',
}

export enum PetType {
  Dog = 'dog',
  Cat = 'cat',
  Bird = 'bird',
}

export enum PetSex {
  Male = 'male',
  Female = 'female',
  Unknown = 'unknown',
}

export enum SizeCategory {
  Tiny = 'tiny',
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
  ExtraLarge = 'extra_large',
}

export enum AdoptionOrSaleType {
  Adoption = 'adoption',
  Sale = 'sale',
  Foster = 'foster',
  Rehome = 'rehome',
}

export enum ListingStatus {
  Draft = 'draft',
  PendingReview = 'pending_review',
  Published = 'published',
  Paused = 'paused',
  AdoptedOrSold = 'adopted_or_sold',
  Removed = 'removed',
  Suspended = 'suspended',
}

export enum AvailabilityStatus {
  Available = 'available',
  Pending = 'pending',
  Reserved = 'reserved',
  Unavailable = 'unavailable',
}

export enum ModerationStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
  Flagged = 'flagged',
  RequiresReview = 'requires_review',
}

export enum InteractionType {
  Inquiry = 'inquiry',
  Visit = 'visit',
  Application = 'application',
  Adoption = 'adoption',
  Purchase = 'purchase',
  SupportCase = 'support_case',
}

export enum ReviewerActorType {
  User = 'user',
  VendorMember = 'vendor_member',
}

export enum ReviewSubjectType {
  Organization = 'organization',
  User = 'user',
}

export enum VisibilityScope {
  Public = 'public',
  Internal = 'internal',
  Limited = 'limited',
}

export enum DisputeStatus {
  None = 'none',
  Disputed = 'disputed',
  UnderReview = 'under_review',
  Resolved = 'resolved',
}

export enum ConversationType {
  UserVendor = 'user_vendor',
  CaseInternal = 'case_internal',
  PartnerCase = 'partner_case',
}

export enum ParticipantRole {
  Initiator = 'initiator',
  Responder = 'responder',
  Observer = 'observer',
  Moderator = 'moderator',
}

export enum MessageType {
  Text = 'text',
  Attachment = 'attachment',
  System = 'system',
  AiGenerated = 'ai_generated',
  AiAssisted = 'ai_assisted',
}

export enum CaseType {
  VendorVerification = 'vendor_verification',
  Complaint = 'complaint',
  FraudReport = 'fraud_report',
  ReviewDispute = 'review_dispute',
  WelfareIssue = 'welfare_issue',
}

export enum CasePriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export enum CaseSeverity {
  Minor = 'minor',
  Moderate = 'moderate',
  Serious = 'serious',
  Critical = 'critical',
}

export enum CaseStatus {
  NewCase = 'new_case',
  Triaged = 'triaged',
  AwaitingDocs = 'awaiting_docs',
  Assigned = 'assigned',
  Investigating = 'investigating',
  PendingPartner = 'pending_partner',
  Resolved = 'resolved',
  Closed = 'closed',
  Escalated = 'escalated',
}

export enum PartnerType {
  Nonprofit = 'nonprofit',
  Agency = 'agency',
  Contractor = 'contractor',
}

export enum ResourceType {
  Article = 'article',
  Tip = 'tip',
  Faq = 'faq',
  Guide = 'guide',
}

export enum ResourceStatus {
  Draft = 'draft',
  PendingReview = 'pending_review',
  Published = 'published',
  Archived = 'archived',
}

export enum ChannelType {
  FirstPartyWeb = 'first_party_web',
  PartnerEmbed = 'partner_embed',
  KioskTerminal = 'kiosk_terminal',
  ReferralLink = 'referral_link',
}

export enum ReferralType {
  Lead = 'lead',
  RecommendationClick = 'recommendation_click',
  Inquiry = 'inquiry',
  ListingView = 'listing_view',
  ProductRecommendation = 'product_recommendation',
}

export enum AIChannelType {
  WebChat = 'web_chat',
  Kiosk = 'kiosk',
  PartnerEmbed = 'partner_embed',
  InternalAssistant = 'internal_assistant',
}

export enum AIRunType {
  DraftReply = 'draft_reply',
  AutoReply = 'auto_reply',
  Summary = 'summary',
  Classification = 'classification',
  PartnerDiscovery = 'partner_discovery',
  VendorScan = 'vendor_scan',
}

export enum AIRunStatus {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

export enum HumanOverrideStatus {
  None = 'none',
  PendingReview = 'pending_review',
  Approved = 'approved',
  Rejected = 'rejected',
  Modified = 'modified',
}

export enum DiscoveredEntityType {
  Vendor = 'vendor',
  Shelter = 'shelter',
  HumaneSociety = 'humane_society',
  Nonprofit = 'nonprofit',
  Agency = 'agency',
  Contractor = 'contractor',
  Partner = 'partner',
}

export enum DiscoveryMethod {
  AiScan = 'ai_scan',
  PartnerReferral = 'partner_referral',
  Manual = 'manual',
}

export enum MatchStatus {
  NewMatch = 'new_match',
  Reviewing = 'reviewing',
  Confirmed = 'confirmed',
  Rejected = 'rejected',
  Duplicate = 'duplicate',
}

export enum AuditActorType {
  User = 'user',
  System = 'system',
  Ai = 'ai',
  Admin = 'admin',
  Partner = 'partner',
}

export enum RiskLevel {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export enum EnforcementAction {
  Warn = 'warn',
  LimitCapability = 'limit_capability',
  HideContent = 'hide_content',
  RequireVerification = 'require_verification',
  SuspendListing = 'suspend_listing',
  SuspendVendor = 'suspend_vendor',
  SuspendUser = 'suspend_user',
  CreateCase = 'create_case',
}

export enum TrustState {
  PendingVerification = 'pending_verification',
  VerifiedIdentity = 'verified_identity',
  VerifiedOrganization = 'verified_organization',
  NonprofitPartnerValidated = 'nonprofit_partner_validated',
  AgencyAffiliated = 'agency_affiliated',
  HighComplaintRisk = 'high_complaint_risk',
  Suspended = 'suspended',
}

export enum BadgeVisibility {
  Public = 'public',
  Internal = 'internal',
}

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc',
}
