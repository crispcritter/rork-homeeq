export const ALL_QUERY_KEYS = [
  'appliances',
  'tasks',
  'budgetItems',
  'monthlyBudget',
  'homeProfile',
  'recommendedGroups',
  'trustedPros',
  'sectionsDefaultOpen',
] as const;

export type QueryKeyName = typeof ALL_QUERY_KEYS[number];
