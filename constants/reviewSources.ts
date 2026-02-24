import { ReviewRating } from '@/types';

export const REVIEW_SOURCES: Record<ReviewRating['source'], { label: string; color: string }> = {
  google: { label: 'Google', color: '#4285F4' },
  yelp: { label: 'Yelp', color: '#D32323' },
  angies_list: { label: 'Angi', color: '#FF6138' },
  bbb: { label: 'BBB', color: '#005A8B' },
  homeadvisor: { label: 'HomeAdvisor', color: '#F68B1F' },
  thumbtack: { label: 'Thumbtack', color: '#009FD9' },
};
