'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Textarea,
  Badge,
  LoadingSpinner,
  EmptyState,
  Input,
  Select,
} from '@pet-central/ui';
import { reviews as reviewsApi } from '@/lib/api';
import type { ReviewResponse } from '@pet-central/types';

type Tab = 'received' | 'feedback';

export default function ReviewsPage() {
  const [tab, setTab] = useState<Tab>('received');

  return (
    <div className="space-y-6">
      <div className="flex gap-1 rounded-[10px] bg-gray-100 p-1">
        <TabButton active={tab === 'received'} onClick={() => setTab('received')}>
          Reviews Received
        </TabButton>
        <TabButton active={tab === 'feedback'} onClick={() => setTab('feedback')}>
          User Feedback
        </TabButton>
      </div>

      {tab === 'received' ? <ReceivedReviews /> : <UserFeedbackForm />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-[8px] px-4 py-2 text-sm font-medium transition-all duration-150 ${
        active
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}

function ReceivedReviews() {
  const { data, isLoading } = useQuery({
    queryKey: ['vendor-reviews'],
    queryFn: () => reviewsApi.listReceived(),
  });

  const items = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No reviews yet"
        description="Reviews from users will appear here once received."
      />
    );
  }

  return (
    <div className="space-y-4">
      {items.map((review: ReviewResponse) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: ReviewResponse }) {
  const queryClient = useQueryClient();
  const [showRespond, setShowRespond] = useState(false);
  const [response, setResponse] = useState('');

  const respondMutation = useMutation({
    mutationFn: () =>
      reviewsApi.respond(review.id, { content: response }),
    onSuccess: () => {
      setShowRespond(false);
      setResponse('');
      queryClient.invalidateQueries({ queryKey: ['vendor-reviews'] });
    },
  });

  return (
    <div className="rounded-[16px] border border-gray-100 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-sm font-semibold text-white">
            {review.reviewer?.displayName?.[0] ?? 'A'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Stars rating={review.ratingOverall} />
              <span className="text-sm font-semibold text-gray-900">
                {review.ratingOverall}/5
              </span>
            </div>
            <p className="mt-0.5 text-xs text-gray-500">
              By {review.reviewer?.displayName ?? 'Anonymous'} &middot;{' '}
              {new Date(review.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        {review.responses.length > 0 ? (
          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            Responded
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
            Awaiting Response
          </span>
        )}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-gray-700">{review.reviewText}</p>

      {review.responses.length > 0 && (
        <div className="mt-3 rounded-[10px] bg-gray-50 border border-gray-100 p-4">
          <p className="text-xs font-medium text-gray-500">Your response</p>
          <p className="mt-1 text-sm text-gray-700">{review.responses[0]?.responseText}</p>
        </div>
      )}

      {review.responses.length === 0 && (
        <>
          {!showRespond ? (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setShowRespond(true)}
            >
              Respond
            </Button>
          ) : (
            <div className="mt-3 space-y-3">
              <Textarea
                placeholder="Write your response…"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => respondMutation.mutate()}
                  loading={respondMutation.isPending}
                  disabled={!response.trim()}
                >
                  Submit Response
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowRespond(false);
                    setResponse('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < rating ? 'text-amber-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function UserFeedbackForm() {
  const [userId, setUserId] = useState('');
  const [responsiveness, setResponsiveness] = useState('');
  const [seriousness, setSeriousness] = useState('');
  const [courtesy, setCourtesy] = useState('');
  const [notes, setNotes] = useState('');

  const feedbackMutation = useMutation({
    mutationFn: () =>
      reviewsApi.submitFeedback({
        userId,
        responsiveness: parseInt(responsiveness),
        seriousness: parseInt(seriousness),
        courtesy: parseInt(courtesy),
        notes: notes || undefined,
      }),
    onSuccess: () => {
      setUserId('');
      setResponsiveness('');
      setSeriousness('');
      setCourtesy('');
      setNotes('');
    },
  });

  const ratingOptions = [
    { value: '1', label: '1 - Poor' },
    { value: '2', label: '2 - Fair' },
    { value: '3', label: '3 - Good' },
    { value: '4', label: '4 - Very Good' },
    { value: '5', label: '5 - Excellent' },
  ];

  return (
    <div className="rounded-[16px] border border-gray-100 bg-white p-6 shadow-card">
      <h2 className="mb-2 text-lg font-semibold text-gray-900">
        Submit User Feedback
      </h2>
      <p className="mb-6 text-sm text-gray-500">
        Provide structured feedback about your interaction with a user.
      </p>

      <div className="space-y-4">
        <Input
          label="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter user ID"
          required
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select
            label="Responsiveness"
            options={ratingOptions}
            value={responsiveness}
            onChange={(e) => setResponsiveness(e.target.value)}
          />
          <Select
            label="Seriousness"
            options={ratingOptions}
            value={seriousness}
            onChange={(e) => setSeriousness(e.target.value)}
          />
          <Select
            label="Courtesy"
            options={ratingOptions}
            value={courtesy}
            onChange={(e) => setCourtesy(e.target.value)}
          />
        </div>
        <Textarea
          label="Private Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Additional notes about this interaction…"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => feedbackMutation.mutate()}
            disabled={feedbackMutation.isPending || !userId || !responsiveness || !seriousness || !courtesy}
            className="rounded-[10px] bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-brand-700 hover:to-brand-800 disabled:opacity-60"
          >
            {feedbackMutation.isPending ? 'Submitting…' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
}
