import { PrismaClient } from '@prisma/client';
import { pick, randInt, randomDate } from './helpers';

export async function seedInteractionsAndReviews(
  prisma: PrismaClient,
  userIds: string[],
  orgIds: string[],
  listingIds: string[],
) {
  const consumerIds = userIds.slice(1, 26);

  // Favorites (200 random)
  let favCount = 0;
  for (let i = 0; i < 200; i++) {
    try {
      await prisma.favorite.create({
        data: { userId: pick(consumerIds), listingId: pick(listingIds) },
      });
      favCount++;
    } catch { /* duplicate */ }
  }
  console.log(`  Created ${favCount} favorites`);

  // Interactions (150 random)
  for (let i = 0; i < 150; i++) {
    const orgId = pick(orgIds);
    await prisma.interaction.create({
      data: {
        userId: pick(consumerIds),
        organizationId: orgId,
        listingId: Math.random() > 0.3 ? pick(listingIds) : undefined,
        interactionType: pick(['INQUIRY', 'INQUIRY', 'VISIT', 'APPLICATION', 'ADOPTION', 'PURCHASE']),
        occurredAt: randomDate(180),
      },
    });
  }
  console.log(`  Created 150 interactions`);

  // Reviews (100 random on organizations)
  const reviewTexts = [
    'Wonderful experience! The staff was very helpful and caring.',
    'Great selection of pets and very transparent about health history.',
    'The adoption process was smooth and well-organized.',
    'Highly recommend. They truly care about finding the right match.',
    'Very professional and knowledgeable about their breeds.',
    'Good experience overall. Paperwork was a bit slow but worth it.',
    'Amazing organization. You can tell the animals are well cared for.',
    'Friendly staff, clean facility, and healthy happy animals.',
    'They went above and beyond to answer all our questions.',
    'Our new family member is perfect. Thank you for the great match!',
    'Decent experience but felt a bit rushed during the visit.',
    'Outstanding! They followed up after adoption to check on our pet.',
    'Very thorough screening process. Felt confident in the adoption.',
    'The team here is passionate about animal welfare. Top notch.',
    'Could improve communication timelines but otherwise excellent.',
  ];

  for (let i = 0; i < 100; i++) {
    await prisma.review.create({
      data: {
        reviewerUserId: pick(consumerIds),
        reviewerActorType: 'USER_REVIEWER',
        subjectType: 'ORGANIZATION_SUBJECT',
        subjectId: pick(orgIds),
        ratingOverall: pick([4, 4, 4, 5, 5, 5, 5, 3, 3, 2]),
        ratingDimensionsJson: {
          communication: randInt(3, 5),
          transparency: randInt(3, 5),
          animal_care: randInt(3, 5),
        },
        reviewText: pick(reviewTexts),
        visibilityScope: 'PUBLIC',
        moderationStatus: 'APPROVED',
        createdAt: randomDate(365),
      },
    });
  }
  console.log(`  Created 100 reviews`);
}

export async function seedConversations(
  prisma: PrismaClient,
  userIds: string[],
  orgIds: string[],
  listingIds: string[],
) {
  const consumerIds = userIds.slice(1, 26);
  const messages = [
    'Hi, I\'m interested in learning more about this pet. Is it still available?',
    'Yes! They are still available. Would you like to schedule a visit?',
    'That would be great! What times work best this week?',
    'We have openings Tuesday and Thursday between 10am-4pm.',
    'Perfect, I\'ll come by Thursday at 2pm. Any paperwork I should bring?',
    'Just a valid photo ID and proof of address. See you then!',
    'Thank you so much! Looking forward to meeting them.',
    'Can you tell me more about their temperament and health history?',
    'Of course! They are very friendly and up to date on all vaccinations.',
    'What is the adoption fee and what does it include?',
  ];

  for (let i = 0; i < 50; i++) {
    const userId = pick(consumerIds);
    const orgId = pick(orgIds);
    const conv = await prisma.conversation.create({
      data: {
        conversationType: 'USER_VENDOR',
        listingId: Math.random() > 0.2 ? pick(listingIds) : undefined,
        organizationId: orgId,
        createdByUserId: userId,
      },
    });

    await prisma.conversationParticipant.create({
      data: { conversationId: conv.id, userId, participantRole: 'INITIATOR' },
    });

    const vendorUserId = userIds[26 + (i % 5)];
    await prisma.conversationParticipant.create({
      data: { conversationId: conv.id, userId: vendorUserId, participantRole: 'RESPONDER' },
    }).catch(() => {});

    const numMsgs = randInt(2, 6);
    for (let m = 0; m < numMsgs; m++) {
      await prisma.message.create({
        data: {
          conversationId: conv.id,
          senderUserId: m % 2 === 0 ? userId : vendorUserId,
          bodyText: messages[m % messages.length],
          messageType: 'TEXT',
          moderationStatus: 'APPROVED',
          createdAt: new Date(Date.now() - (numMsgs - m) * 3600000 * randInt(1, 24)),
        },
      });
    }
  }
  console.log(`  Created 50 conversations with messages`);
}
