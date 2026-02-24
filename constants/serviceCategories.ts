import { ProServiceCategory } from '@/types';

export interface ServiceCategoryOption {
  value: ProServiceCategory;
  label: string;
}

export const SERVICE_CATEGORY_OPTIONS: ServiceCategoryOption[] = [
  { value: 'hvac', label: 'HVAC' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'laundry', label: 'Laundry' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'garage', label: 'Garage' },
  { value: 'pool', label: 'Pool' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'painting', label: 'Painting' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'pest-control', label: 'Pest Control' },
  { value: 'security', label: 'Security' },
  { value: 'general', label: 'General' },
  { value: 'other', label: 'Other' },
];

export const SERVICE_FILTER_OPTIONS: { value: ProServiceCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  ...SERVICE_CATEGORY_OPTIONS,
];

export const APPLIANCE_TO_SERVICE: Record<string, string> = {
  hvac: 'HVAC technician',
  plumbing: 'plumber',
  electrical: 'electrician',
  kitchen: 'kitchen appliance repair',
  laundry: 'appliance repair',
  outdoor: 'outdoor maintenance',
  roofing: 'roofer',
  pool: 'pool service',
  garage: 'garage door repair',
  other: 'home repair',
};

export const RADIUS_FILTER_OPTIONS = [
  { value: 0, label: 'Any' },
  { value: 5, label: '5 mi' },
  { value: 10, label: '10 mi' },
  { value: 15, label: '15 mi' },
  { value: 20, label: '20 mi' },
  { value: 25, label: '25 mi' },
  { value: 50, label: '50 mi' },
];

export const SEARCH_RADIUS_OPTIONS = [
  { value: 5, label: '5 miles' },
  { value: 10, label: '10 miles' },
  { value: 15, label: '15 miles' },
  { value: 20, label: '20 miles' },
  { value: 25, label: '25 miles' },
  { value: 50, label: '50 miles' },
];

export const RADIUS_OPTIONS = [5, 10, 15, 20, 25, 30, 50, 75, 100];

export function getServiceCategoryLabel(value: string): string {
  return SERVICE_CATEGORY_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
