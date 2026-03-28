'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  LoadingSpinner,
  StatusBadge,
  Badge,
  DataTable,
  Pagination,
} from '@pet-central/ui';
import type { Column } from '@pet-central/ui';
import { scans, scanQuality, scanPromotion } from '@/lib/api';

export default function ScanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'pages' | 'entities' | 'animals' | 'quality'>('pages');
  const [pagesPage, setPagesPage] = useState(1);
  const [animalsPage, setAnimalsPage] = useState(1);

  const scanQuery = useQuery({
    queryKey: ['scan', 'detail', id],
    queryFn: () => scans.getById(id),
  });

  const statsQuery = useQuery({
    queryKey: ['scan', 'stats', id],
    queryFn: () => scans.getStatistics(id),
  });

  const pagesQuery = useQuery({
    queryKey: ['scan', 'pages', id, pagesPage],
    queryFn: () => scans.getPages(id, { page: pagesPage, limit: 25 }),
    enabled: tab === 'pages',
  });

  const entitiesQuery = useQuery({
    queryKey: ['scan', 'entities', id],
    queryFn: () => scans.getEntities(id),
    enabled: tab === 'entities',
  });

  const animalsQuery = useQuery({
    queryKey: ['scan', 'animals', id, animalsPage],
    queryFn: () => scans.getAnimalListings(id, { page: animalsPage, limit: 25 }),
    enabled: tab === 'animals',
  });

  const qualityQuery = useQuery({
    queryKey: ['scan', 'quality', id],
    queryFn: () => scanQuality.getChecks(id),
    enabled: tab === 'quality',
  });

  const qualitySummary = useQuery({
    queryKey: ['scan', 'quality-summary', id],
    queryFn: () => scanQuality.getSummary(id),
  });

  const promoteMutation = useMutation({
    mutationFn: () => scanPromotion.promote(id, { approvedBy: 'admin' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scan'] }),
  });

  const scan = scanQuery.data as Record<string, unknown> | undefined;
  const stats = statsQuery.data as Record<string, unknown> | undefined;
  const website = scan?.website as Record<string, unknown> | undefined;
  const counts = scan?.counts as Record<string, number> | undefined;
  const qa = qualitySummary.data as Record<string, unknown> | undefined;

  if (scanQuery.isLoading) {
    return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  if (!scan) {
    return <div className="py-12 text-center text-gray-500">Scan not found</div>;
  }

  const pageColumns: Column<Record<string, unknown>>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (row) => (
        <div className="max-w-xs truncate">
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/scan/pages/${row.id}`); }}
            className="text-sm font-medium text-brand-600 hover:underline text-left"
          >
            {String(row.title ?? '(no title)')}
          </button>
          <p className="truncate text-xs text-gray-500">{String(row.url ?? '')}</p>
        </div>
      ),
    },
    { key: 'pageType', header: 'Type', render: (row) => <Badge variant="neutral">{String(row.pageType ?? '')}</Badge> },
    { key: 'depth', header: 'Depth', render: (row) => <span className="text-sm">{String(row.depth ?? 0)}</span> },
    { key: 'httpStatus', header: 'HTTP', render: (row) => <span className="text-xs font-mono">{String(row.httpStatus ?? '')}</span> },
    { key: 'hasMarkdown', header: 'MD', render: (row) => row.hasMarkdown ? <span className="text-green-600">Yes</span> : <span className="text-gray-400">No</span> },
    { key: 'extractionCount', header: 'Extractions', render: (row) => <span className="font-semibold">{String(row.extractionCount ?? 0)}</span> },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/scan/pages/${row.id}`); }}
            className="rounded-md px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
          >
            View
          </button>
          <a
            href={String(row.url)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50"
          >
            Original
          </a>
        </div>
      ),
    },
  ];

  const entityColumns: Column<Record<string, unknown>>[] = [
    { key: 'name', header: 'Name', render: (row) => <span className="font-medium text-gray-900">{String(row.name)}</span> },
    { key: 'category', header: 'Category', render: (row) => <Badge variant="neutral">{String(row.category ?? 'unknown')}</Badge> },
    { key: 'organizationType', header: 'Org Type', render: (row) => <span className="text-sm">{String(row.organizationType ?? '—')}</span> },
    { key: 'confidence', header: 'Confidence', render: (row) => {
      const c = Number(row.confidence ?? 0);
      return <span className={`text-sm font-semibold ${c >= 0.8 ? 'text-green-600' : c >= 0.5 ? 'text-amber-600' : 'text-red-600'}`}>{(c * 100).toFixed(0)}%</span>;
    }},
    { key: '_count', header: 'Contacts', render: (row) => {
      const cnt = row._count as Record<string, number> | undefined;
      return <span className="text-sm">{cnt?.contacts ?? 0}</span>;
    }},
  ];

  const animalColumns: Column<Record<string, unknown>>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/scan/animals/${row.id}`); }}
          className="text-sm font-medium text-brand-600 hover:underline text-left"
        >
          {String(row.name ?? '(unnamed)')}
        </button>
      ),
    },
    { key: 'animalType', header: 'Type', render: (row) => <Badge variant="neutral">{String(row.animalType ?? '').replace('SCAN_', '') || '—'}</Badge> },
    { key: 'breed', header: 'Breed', render: (row) => <span className="text-sm">{String(row.breed ?? '—')}</span> },
    { key: 'sex', header: 'Sex', render: (row) => <span className="text-sm capitalize">{String(row.sex ?? '—')}</span> },
    { key: 'ageText', header: 'Age', render: (row) => <span className="text-sm">{String(row.ageText ?? '—')}</span> },
    {
      key: 'photos',
      header: 'Photo',
      render: (row) => {
        const photos = (row.photoUrls ?? []) as string[];
        if (photos.length === 0) return <span className="text-gray-400 text-xs">—</span>;
        return (
          <img
            src={photos[0]}
            alt=""
            className="h-10 w-10 rounded-lg object-cover bg-gray-100"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        );
      },
    },
    { key: 'adoptionStatus', header: 'Status', render: (row) => row.adoptionStatus ? <StatusBadge status={String(row.adoptionStatus).toUpperCase()} /> : <span className="text-gray-400">—</span> },
    { key: 'confidence', header: 'Conf', render: (row) => <span className="text-xs">{((Number(row.confidence ?? 0)) * 100).toFixed(0)}%</span> },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/scan/animals/${row.id}`); }}
          className="rounded-md px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
        >
          Details
        </button>
      ),
    },
  ];

  const qualityColumns: Column<Record<string, unknown>>[] = [
    { key: 'checkName', header: 'Check', render: (row) => <span className="font-mono text-sm">{String(row.checkName)}</span> },
    { key: 'checkStatus', header: 'Result', render: (row) => <StatusBadge status={String(row.checkStatus)} /> },
    { key: 'severity', header: 'Severity', render: (row) => <Badge variant="neutral">{String(row.severity ?? '').replace('_SEVERITY', '')}</Badge> },
    { key: 'detailsJson', header: 'Details', render: (row) => <span className="max-w-xs truncate text-xs text-gray-500">{row.detailsJson ? JSON.stringify(row.detailsJson) : '—'}</span> },
  ];

  const isPromotable = qa?.isPromotable === true;
  const pages = (pagesQuery.data?.data ?? []) as Record<string, unknown>[];
  const entities = (entitiesQuery.data ?? []) as Record<string, unknown>[];
  const animals = (animalsQuery.data?.data ?? []) as Record<string, unknown>[];
  const qualityChecks = (qualityQuery.data ?? []) as Record<string, unknown>[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.back()} className="mb-2 text-sm text-brand-600 hover:underline">
            &larr; Back
          </button>
          <h2 className="text-2xl font-bold text-gray-900">
            Scan: {website ? String(website.domain) : 'Unknown'}
          </h2>
          <p className="text-sm text-gray-500">
            {scan.startedAt ? new Date(String(scan.startedAt)).toLocaleString() : '—'}
            {' '}&middot;{' '}
            <StatusBadge status={String(scan.status ?? 'UNKNOWN')} />
          </p>
        </div>
        <div className="flex gap-3">
          {isPromotable && scan.status === 'COMPLETED' && (
            <Button
              onClick={() => promoteMutation.mutate()}
              disabled={promoteMutation.isPending}
            >
              {promoteMutation.isPending ? 'Promoting...' : 'Promote to Production'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div className="rounded-[16px] border border-gray-100 bg-white p-4 shadow-card">
          <p className="text-xs font-medium uppercase text-gray-400">Pages</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{counts?.pages ?? 0}</p>
        </div>
        <div className="rounded-[16px] border border-gray-100 bg-white p-4 shadow-card">
          <p className="text-xs font-medium uppercase text-gray-400">Entities</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{counts?.entities ?? 0}</p>
        </div>
        <div className="rounded-[16px] border border-gray-100 bg-white p-4 shadow-card">
          <p className="text-xs font-medium uppercase text-gray-400">Animals</p>
          <p className="mt-1 text-2xl font-bold text-brand-600">{counts?.animalListings ?? 0}</p>
        </div>
        <div className="rounded-[16px] border border-gray-100 bg-white p-4 shadow-card">
          <p className="text-xs font-medium uppercase text-gray-400">QA Checks</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{counts?.qualityChecks ?? 0}</p>
        </div>
        <div className="rounded-[16px] border border-gray-100 bg-white p-4 shadow-card">
          <p className="text-xs font-medium uppercase text-gray-400">Promotable</p>
          <p className={`mt-1 text-2xl font-bold ${isPromotable ? 'text-green-600' : 'text-red-600'}`}>
            {isPromotable ? 'Yes' : 'No'}
          </p>
        </div>
      </div>

      <div className="rounded-[16px] border border-gray-100 bg-white shadow-card">
        <div className="border-b border-gray-100 px-6 py-3">
          <div className="flex gap-1">
            {(['pages', 'entities', 'animals', 'quality'] as const).map((t) => {
              const labels: Record<string, string> = {
                pages: `Pages (${counts?.pages ?? 0})`,
                entities: `Entities (${counts?.entities ?? 0})`,
                animals: `Animals (${counts?.animalListings ?? 0})`,
                quality: `QA (${counts?.qualityChecks ?? 0})`,
              };
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    tab === t
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  {labels[t]}
                </button>
              );
            })}
          </div>
        </div>

        {tab === 'pages' && (
          <>
            <DataTable columns={pageColumns} data={pages} loading={pagesQuery.isLoading} emptyMessage="No pages" />
            {(pagesQuery.data?.meta?.total ?? 0) > 25 && (
              <div className="border-t border-gray-100 p-4">
                <Pagination currentPage={pagesPage} totalPages={Math.ceil((pagesQuery.data?.meta?.total ?? 0) / 25)} onPageChange={setPagesPage} />
              </div>
            )}
          </>
        )}

        {tab === 'entities' && (
          <div>
            <DataTable columns={entityColumns} data={entities} loading={entitiesQuery.isLoading} emptyMessage="No entities extracted" />
            {entities.length > 0 && entities.map((entity, idx) => {
              const jp = (entity.jsonPayload ?? {}) as Record<string, unknown>;
              const socialLinks = (jp.socialLinks ?? {}) as Record<string, string>;
              const accreditations = (jp.accreditations ?? []) as string[];
              const imageUrls = (jp.imageUrls ?? []) as string[];
              const reviews = (jp.reviews ?? []) as Array<Record<string, unknown>>;
              return (
                <div key={idx} className="border-t border-gray-100 p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    {String(jp.logoUrl ?? '') !== '' && (
                      <img src={String(jp.logoUrl)} alt="Logo" className="h-16 w-16 rounded-lg object-contain bg-gray-50 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{String(entity.name)}</h3>
                      {String(entity.canonicalWebsite ?? '') !== '' && <a href={String(entity.canonicalWebsite)} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 hover:underline">{String(entity.canonicalWebsite)}</a>}
                    </div>
                  </div>
                  {String(entity.summaryDescription ?? '') !== '' && <p className="text-sm text-gray-700 leading-relaxed">{String(entity.summaryDescription)}</p>}
                  {String(jp.missionStatement ?? '') !== '' && (
                    <div className="bg-brand-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-brand-700 mb-1">Mission</p>
                      <p className="text-sm text-brand-800">{String(jp.missionStatement)}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {String(jp.addressRaw ?? '') !== '' && <div><span className="text-xs text-gray-400 uppercase font-medium">Address</span><p className="text-gray-800">{String(jp.addressRaw)}</p></div>}
                    {(String(jp.city ?? '') !== '' || String(jp.state ?? '') !== '') && <div><span className="text-xs text-gray-400 uppercase font-medium">Location</span><p className="text-gray-800">{[jp.city, jp.state, jp.postalCode].filter(Boolean).map(String).join(', ')}</p></div>}
                    {jp.rating != null && <div><span className="text-xs text-gray-400 uppercase font-medium">Rating</span><p className="text-gray-800">{String(jp.rating)}/5{jp.ratingCount ? ` (${String(jp.ratingCount)} reviews)` : ''}</p></div>}
                  </div>
                  {accreditations.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-medium mb-1">Accreditations</p>
                      <div className="flex flex-wrap gap-1.5">{accreditations.map((a, i) => <Badge key={i} variant="success">{a}</Badge>)}</div>
                    </div>
                  )}
                  {Object.keys(socialLinks).length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-medium mb-1">Social</p>
                      <div className="flex flex-wrap gap-2">{Object.entries(socialLinks).map(([k, v]) => <a key={k} href={v} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline capitalize">{k}</a>)}</div>
                    </div>
                  )}
                  {reviews.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-medium mb-1">Reviews</p>
                      <div className="space-y-2">{reviews.slice(0, 5).map((r, i) => (
                        <div key={i} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            {String(r.source ?? '') !== '' && <span className="text-xs font-medium text-gray-500">{String(r.source)}</span>}
                            {r.rating != null && <span className="text-xs font-bold text-amber-600">{String(r.rating)}/5</span>}
                          </div>
                          {String(r.text ?? '') !== '' && <p className="text-sm text-gray-700">{String(r.text).slice(0, 200)}</p>}
                          {String(r.author ?? '') !== '' && <p className="text-xs text-gray-400 mt-1">&mdash; {String(r.author)}</p>}
                        </div>
                      ))}</div>
                    </div>
                  )}
                  {imageUrls.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-medium mb-1">Images</p>
                      <div className="flex gap-2 overflow-x-auto">{imageUrls.slice(0, 6).map((url, i) => <img key={i} src={String(url)} alt="" className="h-20 w-28 rounded-lg object-cover shrink-0 bg-gray-100" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />)}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'animals' && (
          <>
            <DataTable columns={animalColumns} data={animals} loading={animalsQuery.isLoading} emptyMessage="No animal listings found" />
            {(animalsQuery.data?.meta?.total ?? 0) > 25 && (
              <div className="border-t border-gray-100 p-4">
                <Pagination currentPage={animalsPage} totalPages={Math.ceil((animalsQuery.data?.meta?.total ?? 0) / 25)} onPageChange={setAnimalsPage} />
              </div>
            )}
          </>
        )}

        {tab === 'quality' && (
          <DataTable columns={qualityColumns} data={qualityChecks} loading={qualityQuery.isLoading} emptyMessage="No quality checks run" />
        )}
      </div>
    </div>
  );
}
