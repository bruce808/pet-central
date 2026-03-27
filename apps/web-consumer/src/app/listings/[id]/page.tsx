import Link from 'next/link';
import { Badge, Button, Card } from '@pet-central/ui';
import { listings, organizations } from '@/lib/api';
import { TrustBadge } from '@/components/TrustBadge';
import { ReviewCard } from '@/components/ReviewCard';
import { ListingActions } from './listing-actions';
import { ListingTabs } from './listing-tabs';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const listing = await listings.getById(id);
    return {
      title: `${listing.title} — PetCentral`,
      description: listing.summary,
    };
  } catch {
    return { title: 'Listing — PetCentral' };
  }
}

export default async function ListingDetailPage({ params }: Props) {
  let listing;
  let orgReviews;
  const { id } = await params;

  try {
    listing = await listings.getById(id);
    orgReviews = await organizations.getReviews(listing.organization.id, 1, 5);
  } catch {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Listing Not Found</h1>
          <p className="mt-2 text-gray-500">This listing may have been removed or is no longer available.</p>
          <Link href="/search" className="mt-4 inline-block">
            <Button>Back to Search</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { pet, organization, media } = listing;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-brand-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/search" className="hover:text-brand-600">Search</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{listing.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content (2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Image Gallery */}
          <div className="grid gap-2 sm:grid-cols-2">
            {media.length > 0 ? (
              <>
                <div className="aspect-[4/3] overflow-hidden rounded-xl bg-gray-100 sm:col-span-2">
                  <img
                    src={media[0]!.url}
                    alt={listing.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                {media.slice(1, 5).map((m) => (
                  <div key={m.id} className="aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
                    <img src={m.url} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </>
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-purple-50 text-8xl sm:col-span-2">
                🐾
              </div>
            )}
          </div>

          {/* Pet Info */}
          <div>
            <div className="flex flex-wrap items-start gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{pet.name}</h1>
              <Badge variant="info">{pet.adoptionOrSaleType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}</Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Breed', value: pet.breedPrimary },
                { label: 'Age', value: pet.ageValue ? `${pet.ageValue} ${pet.ageUnit ?? 'yrs'}` : 'Unknown' },
                { label: 'Sex', value: pet.sex.charAt(0).toUpperCase() + pet.sex.slice(1).toLowerCase() },
                { label: 'Size', value: pet.sizeCategory?.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ?? 'Not specified' },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-gray-50 p-3">
                  <span className="text-xs text-gray-500">{item.label}</span>
                  <p className="mt-0.5 text-sm font-semibold text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Temperament Tags */}
            {pet.temperament.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {pet.temperament.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <p className="mt-6 leading-relaxed text-gray-600">{pet.description}</p>
          </div>

          {/* Tabs: About, Health & Care, Reviews */}
          <ListingTabs pet={pet} reviews={orgReviews?.items ?? []} />
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Organization Card */}
          <Card className="sticky top-24">
            <Link href={`/organizations/${organization.id}`} className="group block">
              <h3 className="font-semibold text-gray-900 group-hover:text-brand-600">
                {organization.publicName}
              </h3>
            </Link>
            <div className="mt-2 flex flex-wrap gap-2">
              <TrustBadge label={organization.organizationType.replace('_', ' ')} />
            </div>

            <hr className="my-4" />

            {/* Fee */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {pet.adoptionOrSaleType === 'adoption' ? 'Adoption Fee' : 'Price'}
              </span>
              <span className="text-xl font-bold text-gray-900">
                {listing.feeAmount === null || listing.feeAmount === 0
                  ? 'Free'
                  : `$${listing.feeAmount.toLocaleString()}`}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
              </svg>
              {listing.locationCity}, {listing.locationRegion}
            </div>

            <hr className="my-4" />

            <ListingActions listingId={listing.id} organizationId={organization.id} />
          </Card>
        </aside>
      </div>
    </div>
  );
}
