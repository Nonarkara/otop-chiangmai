'use client';
import type { Review } from '@/lib/types';

interface Props { review: Review; }

export default function ReviewCard({ review }: Props) {
  const stars = Array.from({ length: 5 }, (_, i) => i < review.rating);

  return (
    <div className="review-card">
      <div className="review-card-header">
        <span className={`review-platform-badge ${review.source_platform}`}>
          {review.source_platform === 'line' ? 'LINE' : 'Telegram'}
        </span>
        <div className="review-rating" aria-label={`${review.rating} ดาว`}>
          {stars.map((filled, i) => (
            <div key={i} className={`review-star${filled ? ' filled' : ''}`} />
          ))}
        </div>
      </div>

      <p className="review-text thai">{review.text}</p>

      {review.ai_summary && (
        <p className="review-summary thai">AI: {review.ai_summary}</p>
      )}
    </div>
  );
}
