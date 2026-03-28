import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SOURCE = process.argv[2] || 'mock';

async function purge() {
  const start = Date.now();
  console.log(`\n=== Purging all data with dataSource = "${SOURCE}" ===\n`);

  // Delete in dependency order (children before parents) to avoid FK violations
  const deletions = [
    { label: 'AuditLog',             fn: () => prisma.auditLog.deleteMany({ where: { dataSource: SOURCE } }) },
    { label: 'Message',              fn: () => prisma.message.deleteMany({ where: { dataSource: SOURCE } }) },
    { label: 'ConversationParticipant', fn: () => prisma.conversationParticipant.deleteMany({ where: { conversation: { dataSource: SOURCE } } }) },
    { label: 'Conversation',         fn: () => prisma.conversation.deleteMany({ where: { dataSource: SOURCE } }) },
    { label: 'Favorite',             fn: () => prisma.favorite.deleteMany({ where: { dataSource: SOURCE } }) },
    { label: 'Interaction',          fn: () => prisma.interaction.deleteMany({ where: { dataSource: SOURCE } }) },
    { label: 'ReviewResponse',       fn: () => prisma.reviewResponse.deleteMany({ where: { review: { dataSource: SOURCE } } }) },
    { label: 'ReviewFlag',           fn: () => prisma.reviewFlag.deleteMany({ where: { review: { dataSource: SOURCE } } }) },
    { label: 'Review',               fn: () => prisma.review.deleteMany({ where: { dataSource: SOURCE } }) },
    { label: 'PartnerReferral',      fn: () => prisma.partnerReferral.deleteMany({ where: { channelOrigin: { dataSource: SOURCE } } }) },
    { label: 'ChannelOrigin',        fn: () => prisma.channelOrigin.deleteMany({ where: { dataSource: SOURCE } }) },
    { label: 'CaseEvent',            fn: () => prisma.caseEvent.deleteMany({ where: { case: { dataSource: SOURCE } } }) },
    { label: 'CaseNote',             fn: () => prisma.caseNote.deleteMany({ where: { case: { dataSource: SOURCE } } }) },
    { label: 'Assignment',           fn: () => prisma.assignment.deleteMany({ where: { case: { dataSource: SOURCE } } }) },
    { label: 'Case',                 fn: () => prisma.case.deleteMany({ where: { dataSource: SOURCE } }) },
    { label: 'PartnerMember',        fn: () => prisma.partnerMember.deleteMany({ where: { partnerOrganization: { dataSource: SOURCE } } }) },
    { label: 'PartnerOrganization',  fn: () => prisma.partnerOrganization.deleteMany({ where: { dataSource: SOURCE } }) },
    { label: 'Resource',             fn: () => prisma.resource.deleteMany({ where: { dataSource: SOURCE } }) },
    { label: 'PetAttribute',         fn: () => prisma.petAttribute.deleteMany({ where: { pet: { dataSource: SOURCE } } }) },
    { label: 'PetMedia',             fn: () => prisma.petMedia.deleteMany({ where: { pet: { dataSource: SOURCE } } }) },
    { label: 'PetListing',           fn: () => prisma.petListing.deleteMany({ where: { dataSource: SOURCE } }) },
    { label: 'Pet',                  fn: () => prisma.pet.deleteMany({ where: { dataSource: SOURCE } }) },
    { label: 'OrganizationBadge',    fn: () => prisma.organizationBadge.deleteMany({ where: { organization: { dataSource: SOURCE } } }) },
    { label: 'OrganizationVerification', fn: () => prisma.organizationVerification.deleteMany({ where: { organization: { dataSource: SOURCE } } }) },
    { label: 'OrganizationDocument', fn: () => prisma.organizationDocument.deleteMany({ where: { organization: { dataSource: SOURCE } } }) },
    { label: 'OrganizationMember',   fn: () => prisma.organizationMember.deleteMany({ where: { organization: { dataSource: SOURCE } } }) },
    { label: 'Organization',         fn: () => prisma.organization.deleteMany({ where: { dataSource: SOURCE } }) },
    { label: 'Session',              fn: () => prisma.session.deleteMany({ where: { user: { dataSource: SOURCE } } }) },
    { label: 'UserRole',             fn: () => prisma.userRole.deleteMany({ where: { user: { dataSource: SOURCE } } }) },
    { label: 'UserProfile',          fn: () => prisma.userProfile.deleteMany({ where: { user: { dataSource: SOURCE } } }) },
    { label: 'User',                 fn: () => prisma.user.deleteMany({ where: { dataSource: SOURCE } }) },
  ];

  let totalDeleted = 0;
  for (const { label, fn } of deletions) {
    const result = await fn();
    if (result.count > 0) {
      console.log(`  ${label}: ${result.count} deleted`);
      totalDeleted += result.count;
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n=== Purge complete: ${totalDeleted} total rows deleted in ${elapsed}s ===`);
}

purge()
  .catch((e) => {
    console.error('Purge failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
