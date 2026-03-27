import Link from 'next/link';
import { Badge, Button } from '@pet-central/ui';
import { organizations, listings } from '@/lib/api';
import { TrustBadge } from '@/components/TrustBadge';
import { OrgTabs } from './org-tabs';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const org = await organizations.getById(id);
    return {
      title: `${org.publicName} — PetCentral`,
      description: org.description,
    };
  } catch {
    return { title: 'Organization — PetCentral' };
  }
}

export default async function OrganizationDetailPage({ params }: Props) {
  let org;
  let orgListings;
  let reviews;
  const { id } = await params;

  try {
    [org, orgListings, reviews] = await Promise.all([
      organizations.getById(id),
      listings.search({ page: 1, limit: 12 }),
      organizations.getReviews(id, 1, 10),
    ]);
  } catch {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Organization Not Found</h1>
          <p className="mt-2 text-gray-500">This organization may no longer be active.</p>
          <Link href="/search" className="mt-4 inline-block">
            <Button>Back to Search</Button>
          </Link>
        </div>
      </div>
    );
  }

  const memberSinceDate = new Date(org.memberSince).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-brand-600">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{org.publicName}</span>
      </nav>

      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                {org.publicName}
              </h1>
              <Badge variant="info" size="md">
                {org.organizationType.replace('_', ' ')}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              {org.badges.map((badge) => (
                <TrustBadge key={badge.code} label={badge.label} />
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
                </svg>
                {org.city}, {org.region}, {org.country}
              </span>
              <span>Member since {memberSinceDate}</span>
            </div>
          </div>

          {/* Score card */}
          <div className="flex gap-6 rounded-lg bg-gray-50 p-4">
            {org.reviewScore !== null && (
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{org.reviewScore.toFixed(1)}</div>
                <div className="mt-0.5 flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg
                      key={i}
                      className={`h-3.5 w-3.5 ${i <= Math.round(org.reviewScore!) ? 'text-amber-400' : 'text-gray-200'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.07 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.28-3.957z" />
                    </svg>
                  ))}
                </div>
                <span className="text-xs text-gray-500">Rating</span>
              </div>
            )}
            {org.responseRate !== null && (
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round(org.responseRate * 100)}%
                </div>
                <span className="text-xs text-gray-500">Response Rate</span>
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 leading-relaxed text-gray-600">{org.description}</p>
      </div>

      {/* Tabs */}
      <div className="mt-8">
        <OrgTabs
          listings={orgListings?.items ?? []}
          reviews={reviews?.items ?? []}
          org={org}
        />
      </div>
    </div>
  );
}
