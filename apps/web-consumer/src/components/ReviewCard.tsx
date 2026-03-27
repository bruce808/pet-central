import { Avatar } from '@pet-central/ui';
import type { ReviewResponse } from '@pet-central/types';

interface ReviewCardProps {
  review: ReviewResponse;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i <= rating ? 'text-amber-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.07 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.28-3.957z" />
        </svg>
      ))}
    </div>
  );
}

export function ReviewCard({ review }: ReviewCardProps) {
  const date = new Date(review.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <Avatar
          name={review.reviewer.displayName}
          src={review.reviewer.avatarUrl ?? undefined}
          size="sm"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">
              {review.reviewer.displayName}
            </span>
            <span className="text-xs text-gray-400">{date}</span>
          </div>
          <div className="mt-1">
            <StarDisplay rating={review.ratingOverall} />
          </div>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            {review.reviewText}
          </p>

          {/* Vendor response */}
          {review.responses.length > 0 && (
            <div className="mt-3 rounded-lg bg-gray-50 p-3">
              <span className="text-xs font-semibold text-gray-700">
                Vendor Response
              </span>
              <p className="mt-1 text-sm text-gray-600">
                {review.responses[0]!.responseText}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
