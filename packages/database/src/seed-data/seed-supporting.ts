import { PrismaClient } from '@prisma/client';
import { pick, randInt, randomDate, slugify } from './helpers';

export async function seedPartnerOrgs(prisma: PrismaClient, _userIds: string[]) {
  const partners = [
    { name: 'National Pet Welfare Alliance', partnerType: 'NONPROFIT_PARTNER' as const, region: 'US-National', capabilities: ['verification', 'education', 'welfare_checks'] },
    { name: 'State Animal Control Association', partnerType: 'AGENCY_PARTNER' as const, region: 'US-West', capabilities: ['licensing', 'inspections', 'enforcement'] },
    { name: 'PetVet Compliance Services', partnerType: 'CONTRACTOR' as const, region: 'US-National', capabilities: ['health_records', 'vaccination_verification'] },
    { name: 'ASPCA Regional Chapter', partnerType: 'NONPROFIT_PARTNER' as const, region: 'US-Northeast', capabilities: ['rescue_coordination', 'education', 'grants'] },
    { name: 'County Animal Services Bureau', partnerType: 'AGENCY_PARTNER' as const, region: 'US-Southwest', capabilities: ['licensing', 'stray_intake', 'cruelty_investigation'] },
  ];

  const partnerOrgIds: string[] = [];
  for (const p of partners) {
    const po = await prisma.partnerOrganization.create({
      data: {
        name: p.name,
        partnerType: p.partnerType,
        region: p.region,
        status: 'ACTIVE',
        contactInfoJson: { email: `contact@${slugify(p.name)}.example.com`, phone: '+15005550000' },
        capabilitiesJson: p.capabilities,
      },
    });
    partnerOrgIds.push(po.id);
  }
  console.log(`  Created ${partners.length} partner organizations`);

  // Channel origins
  for (const poId of partnerOrgIds) {
    await prisma.channelOrigin.create({
      data: {
        channelType: pick(['PARTNER_EMBED', 'REFERRAL_LINK']),
        originPartnerOrgId: poId,
        originDomain: `${slugify(partners[partnerOrgIds.indexOf(poId)].name)}.example.com`,
        status: 'ACTIVE',
      },
    });
  }
  await prisma.channelOrigin.create({
    data: { channelType: 'FIRST_PARTY_WEB', originDomain: 'petcentral.com', status: 'ACTIVE' },
  });
  await prisma.channelOrigin.create({
    data: { channelType: 'KIOSK_TERMINAL', originLocationName: 'PetMart Downtown', originLocationAddress: '100 Main St, Portland, OR', status: 'ACTIVE' },
  });
  console.log(`  Created channel origins`);

  return partnerOrgIds;
}

export async function seedResources(prisma: PrismaClient, userIds: string[], orgIds: string[]) {
  const resources = [
    { title: 'How to Choose the Right Dog Breed for Your Family', type: 'ARTICLE' as const, body: '# Choosing the Right Dog Breed\n\nSelecting the perfect dog breed involves considering your lifestyle, living space, activity level, and family composition...\n\n## Key Factors\n\n- **Space**: Large breeds need room to roam\n- **Activity Level**: High-energy breeds need daily exercise\n- **Allergies**: Consider hypoallergenic breeds\n- **Children**: Some breeds are naturally gentle with kids', tags: ['dogs', 'breeds', 'family'] },
    { title: 'First-Time Cat Owner Guide', type: 'GUIDE' as const, body: '# Welcome to Cat Parenthood\n\nCongratulations on your new feline friend! Here is everything you need to know...\n\n## Essential Supplies\n\n- Quality cat food\n- Litter box and litter\n- Scratching post\n- Toys and enrichment\n- Cozy bed', tags: ['cats', 'beginners', 'care'] },
    { title: 'Bird Care 101: Setting Up Your Aviary', type: 'GUIDE' as const, body: '# Setting Up the Perfect Bird Habitat\n\nBirds need proper housing to thrive. Here is how to create the ideal environment...\n\n## Cage Requirements\n\n- Size appropriate for species\n- Bar spacing for safety\n- Multiple perches at different heights\n- Food and water stations', tags: ['birds', 'care', 'housing'] },
    { title: 'Understanding Pet Adoption Fees', type: 'FAQ' as const, body: '# Adoption Fees Explained\n\n**Q: Why do shelters charge adoption fees?**\n\nAdoption fees help shelters cover veterinary care, food, housing, and operational costs...\n\n**Q: What is typically included?**\n\nMost fees include spay/neuter, vaccinations, microchip, and a health check.', tags: ['adoption', 'fees', 'faq'] },
    { title: '5 Signs of a Reputable Breeder', type: 'ARTICLE' as const, body: '# Identifying Responsible Breeders\n\nNot all breeders are created equal. Here are key signs of a reputable breeder...\n\n1. Health testing of parent animals\n2. Clean, spacious facilities\n3. Willingness to answer questions\n4. Contracts and health guarantees\n5. Breed club membership', tags: ['breeders', 'trust', 'tips'] },
    { title: 'Pet-Proofing Your Home', type: 'TIP' as const, body: '# Making Your Home Safe for Pets\n\n## Quick Tips\n\n- Secure trash cans\n- Hide electrical cords\n- Remove toxic plants\n- Store chemicals safely\n- Check for small swallowable objects', tags: ['safety', 'home', 'tips'] },
    { title: 'Introducing a New Pet to Your Household', type: 'GUIDE' as const, body: '# Smooth Introductions\n\nBringing a new pet home is exciting but requires careful planning...\n\n## For Dogs\n\nMeet on neutral territory first.\n\n## For Cats\n\nUse a separate room for the first week.\n\n## For Birds\n\nKeep in a quiet room away from other pets initially.', tags: ['introduction', 'multi-pet', 'guide'] },
    { title: 'Common Health Issues by Pet Type', type: 'ARTICLE' as const, body: '# Health Awareness for Pet Owners\n\n## Dogs\n- Hip dysplasia in large breeds\n- Dental disease\n\n## Cats\n- Kidney disease\n- Obesity\n\n## Birds\n- Feather plucking\n- Respiratory issues', tags: ['health', 'veterinary', 'awareness'] },
  ];

  for (const r of resources) {
    const slug = slugify(r.title);
    const existing = await prisma.resource.findUnique({ where: { slug } });
    if (existing) continue;
    await prisma.resource.create({
      data: {
        organizationId: Math.random() > 0.5 ? pick(orgIds) : undefined,
        authorUserId: pick(userIds),
        resourceType: r.type,
        title: r.title,
        slug,
        bodyMarkdown: r.body,
        status: 'PUBLISHED_RESOURCE',
        tagsJson: r.tags,
        publishedAt: randomDate(180),
      },
    });
  }
  console.log(`  Created ${resources.length} resources`);
}

export async function seedCases(prisma: PrismaClient, userIds: string[], orgIds: string[]) {
  const adminId = userIds[0];
  const supportIds = userIds.slice(34, 36);
  const caseTypes = ['VENDOR_VERIFICATION', 'COMPLAINT', 'FRAUD_REPORT', 'REVIEW_DISPUTE', 'WELFARE_ISSUE'] as const;

  for (let i = 0; i < 20; i++) {
    const ct = pick([...caseTypes]);
    const status = pick(['NEW_CASE', 'TRIAGED', 'ASSIGNED', 'INVESTIGATING', 'RESOLVED', 'CLOSED'] as const);
    const c = await prisma.case.create({
      data: {
        caseType: ct,
        sourceType: 'organization',
        sourceId: pick(orgIds),
        priority: pick(['LOW', 'MEDIUM', 'MEDIUM', 'HIGH', 'CRITICAL']),
        severity: pick(['MINOR', 'MODERATE', 'MODERATE', 'SERIOUS']),
        status,
        region: pick(['US-West', 'US-East', 'US-South', 'US-Midwest']),
        assignedUserId: supportIds.length > 0 ? pick(supportIds) : adminId,
        createdByUserId: pick([adminId, ...supportIds]),
        resolvedAt: status === 'RESOLVED' || status === 'CLOSED' ? randomDate(30) : undefined,
      },
    });

    await prisma.caseEvent.create({
      data: {
        caseId: c.id,
        eventType: 'created',
        actorUserId: adminId,
        payloadJson: { note: 'Case created during seed' },
      },
    });

    await prisma.caseNote.create({
      data: {
        caseId: c.id,
        authorUserId: supportIds.length > 0 ? pick(supportIds) : adminId,
        body: `Initial assessment for ${ct.toLowerCase().replace(/_/g, ' ')} case.`,
        visibility: 'INTERNAL',
      },
    });
  }
  console.log(`  Created 20 cases with events and notes`);
}

export async function seedAuditLogs(prisma: PrismaClient) {
  const actions = [
    { actionType: 'user.login', targetType: 'user' },
    { actionType: 'listing.publish', targetType: 'pet_listing' },
    { actionType: 'org.verify', targetType: 'organization' },
    { actionType: 'review.approve', targetType: 'review' },
    { actionType: 'case.create', targetType: 'case' },
    { actionType: 'badge.assign', targetType: 'organization' },
    { actionType: 'listing.moderate', targetType: 'pet_listing' },
    { actionType: 'user.register', targetType: 'user' },
  ];

  for (let i = 0; i < 50; i++) {
    const a = pick(actions);
    await prisma.auditLog.create({
      data: {
        actorType: pick(['USER_ACTOR', 'SYSTEM_ACTOR', 'ADMIN_ACTOR']),
        actorId: `seed-actor-${randInt(1, 50)}`,
        actionType: a.actionType,
        targetType: a.targetType,
        targetId: `seed-target-${randInt(1, 100)}`,
        metadataJson: { seeded: true, index: i },
        createdAt: randomDate(365),
      },
    });
  }
  console.log(`  Created 50 audit log entries`);
}
