import { ReviewRating } from '@/types';

export function getAverageRating(ratings: ReviewRating[] | undefined): number | null {
  if (!ratings?.length) return null;
  const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
  return sum / ratings.length;
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}
