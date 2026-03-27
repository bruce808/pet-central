import Link from 'next/link';
import { Badge, Button } from '@pet-central/ui';
import { resources } from '@/lib/api';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const resource = await resources.getBySlug(slug);
    return {
      title: `${resource.title} — PetCentral Resources`,
      description: resource.bodyMarkdown.slice(0, 160),
    };
  } catch {
    return { title: 'Resource — PetCentral' };
  }
}

export default async function ResourceDetailPage({ params }: Props) {
  let resource;
  const { slug } = await params;

  try {
    resource = await resources.getBySlug(slug);
  } catch {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Resource Not Found</h1>
          <p className="mt-2 text-gray-500">This resource may have been removed.</p>
          <Link href="/resources" className="mt-4 inline-block">
            <Button>Back to Resources</Button>
          </Link>
        </div>
      </div>
    );
  }

  const publishedDate = resource.publishedAt
    ? new Date(resource.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-brand-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/resources" className="hover:text-brand-600">Resources</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{resource.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* Main content */}
        <article className="lg:col-span-3">
          <Badge variant="info" size="md">{resource.resourceType}</Badge>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">{resource.title}</h1>

          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
            {resource.author && <span>By {resource.author.displayName}</span>}
            {resource.organization && (
              <span>&middot; {resource.organization.publicName}</span>
            )}
            {publishedDate && <span>&middot; {publishedDate}</span>}
          </div>

          {resource.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {resource.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <hr className="my-6" />

          {/* Markdown content rendered as HTML-like prose */}
          <div className="prose prose-gray max-w-none">
            {resource.bodyMarkdown.split('\n').map((line, i) => {
              if (line.startsWith('# '))
                return <h1 key={i} className="mt-8 text-2xl font-bold">{line.slice(2)}</h1>;
              if (line.startsWith('## '))
                return <h2 key={i} className="mt-6 text-xl font-semibold">{line.slice(3)}</h2>;
              if (line.startsWith('### '))
                return <h3 key={i} className="mt-4 text-lg font-medium">{line.slice(4)}</h3>;
              if (line.startsWith('- '))
                return <li key={i} className="ml-4 text-gray-600">{line.slice(2)}</li>;
              if (line.trim() === '') return <br key={i} />;
              return <p key={i} className="mt-2 leading-relaxed text-gray-600">{line}</p>;
            })}
          </div>
        </article>

        {/* Sidebar */}
        <aside className="space-y-6 lg:col-span-1">
          {resource.author && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-gray-900">Author</h3>
              <p className="mt-2 text-sm text-gray-600">
                {resource.author.displayName}
              </p>
              {resource.organization && (
                <p className="mt-1 text-xs text-gray-400">
                  {resource.organization.publicName}
                </p>
              )}
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-900">Related Resources</h3>
            <p className="mt-2 text-xs text-gray-400">
              Explore more resources in our library.
            </p>
            <Link
              href="/resources"
              className="mt-3 block text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              View all resources &rarr;
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
