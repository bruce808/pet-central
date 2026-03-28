import { PrismaClient } from '@prisma/client';
import { BreedInfo, pick, randInt, randFloat, randomDate } from './helpers';
import { ORGANIZATIONS } from './organizations';

type PetType = 'DOG' | 'CAT' | 'BIRD';
type DescFn = (name: string, breed: string, age: number) => string;

interface PetGenConfig {
  petType: PetType;
  breeds: BreedInfo[];
  names: string[];
  descriptions: DescFn[];
  count: number;
}

export async function seedPets(
  prisma: PrismaClient,
  orgIds: string[],
  configs: PetGenConfig[],
) {
  const listingIds: string[] = [];

  for (const config of configs) {
    console.log(`  Generating ${config.count} ${config.petType.toLowerCase()}s...`);

    for (let i = 0; i < config.count; i++) {
      const breed = config.breeds[i % config.breeds.length];
      const name = config.names[i % config.names.length];
      const orgId = orgIds[i % orgIds.length];
      const sex = pick(['MALE', 'FEMALE'] as const);
      const age = randInt(breed.ageRange[0], breed.ageRange[1]);
      const color = pick(breed.colors);
      const size = pick(breed.sizes);
      const temperament = pick(breed.temperaments);
      const descFn = pick(config.descriptions);
      const description = descFn(name, breed.breed, age);
      const adoptionType = pick(['ADOPTION', 'ADOPTION', 'ADOPTION', 'SALE', 'REHOME'] as const);
      const fee = adoptionType === 'ADOPTION'
        ? randInt(25, 500)
        : randInt(breed.priceRange[0], breed.priceRange[1]);

      const vaccinated = Math.random() > 0.1;
      const fixed = Math.random() > 0.3;
      const chipped = Math.random() > 0.2;

      const pet = await prisma.pet.create({
        data: {
          organizationId: orgId,
          petType: config.petType,
          breedPrimary: breed.breed,
          breedSecondary: Math.random() > 0.8 ? pick(config.breeds).breed : undefined,
          name,
          description,
          sex,
          ageValue: age,
          ageUnit: age === 1 ? 'year' : 'years',
          sizeCategory: size,
          color,
          temperamentJson: temperament,
          healthJson: {
            vaccinated,
            [sex === 'MALE' ? 'neutered' : 'spayed']: fixed,
            microchipped: chipped,
          },
          adoptionOrSaleType: adoptionType,
          dataSource: 'mock',
        },
      });

      await prisma.petMedia.create({
        data: {
          petId: pet.id,
          mediaType: 'image/jpeg',
          storageKey: breed.imageUrl,
          sortOrder: 0,
          isPrimary: true,
        },
      });

      const extras = breed.extraImages ?? [];
      for (let ei = 0; ei < extras.length; ei++) {
        const extraUrl = extras[ei];
        if (!extraUrl) continue;
        await prisma.petMedia.create({
          data: {
            petId: pet.id,
            mediaType: 'image/jpeg',
            storageKey: extraUrl,
            sortOrder: ei + 1,
            isPrimary: false,
          },
        });
      }

      const attrs: { key: string; value: string }[] = [
        { key: 'coat_length', value: pick(['short', 'medium', 'long']) },
        { key: 'house_trained', value: Math.random() > 0.2 ? 'yes' : 'no' },
        { key: 'good_with_kids', value: Math.random() > 0.3 ? 'yes' : 'unknown' },
        { key: 'good_with_other_pets', value: pick(['yes', 'no', 'unknown']) },
      ];
      if (config.petType === 'DOG') {
        attrs.push({ key: 'leash_trained', value: Math.random() > 0.3 ? 'yes' : 'in_progress' });
        attrs.push({ key: 'crate_trained', value: Math.random() > 0.4 ? 'yes' : 'no' });
      }
      if (config.petType === 'BIRD') {
        attrs.push({ key: 'hand_tamed', value: Math.random() > 0.3 ? 'yes' : 'no' });
        attrs.push({ key: 'talks', value: Math.random() > 0.5 ? 'yes' : 'no' });
      }
      for (const a of attrs) {
        await prisma.petAttribute.create({
          data: { petId: pet.id, attributeKey: a.key, attributeValue: a.value },
        });
      }

      const orgIdx = orgIds.indexOf(orgId);
      const orgData = ORGANIZATIONS[orgIdx % ORGANIZATIONS.length];

      const listingStatus = pick(['PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'PENDING_REVIEW', 'PAUSED'] as const);
      const listing = await prisma.petListing.create({
        data: {
          petId: pet.id,
          listingStatus,
          title: `${name} - ${breed.breed}${color ? ` (${color})` : ''}`,
          summary: description.substring(0, 120) + '...',
          feeAmount: fee,
          feeCurrency: 'USD',
          availabilityStatus: listingStatus === 'PUBLISHED' ? 'AVAILABLE' : pick(['AVAILABLE', 'PENDING_AVAILABILITY', 'RESERVED'] as const),
          locationCity: orgData.city,
          locationRegion: orgData.region,
          locationCountry: 'US',
          latitude: orgData.latitude + randFloat(-0.05, 0.05),
          longitude: orgData.longitude + randFloat(-0.05, 0.05),
          publishedAt: listingStatus === 'PUBLISHED' ? randomDate(90) : undefined,
          moderationStatus: listingStatus === 'PUBLISHED' ? 'APPROVED' : 'PENDING_MODERATION',
          trustRankSnapshot: randFloat(0.5, 1.0),
          dataSource: 'mock',
        },
      });
      listingIds.push(listing.id);

      if ((i + 1) % 100 === 0) {
        console.log(`    ...${i + 1}/${config.count} ${config.petType.toLowerCase()}s created`);
      }
    }
    console.log(`  Finished ${config.count} ${config.petType.toLowerCase()}s with listings & media`);
  }

  return { listingIds };
}
