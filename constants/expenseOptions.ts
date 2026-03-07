import { BudgetCategory } from '@/types';

export const EXPENSE_CATEGORY_OPTIONS: { key: BudgetCategory; label: string }[] = [
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'repair', label: 'Repair' },
  { key: 'upgrade', label: 'Upgrade' },
  { key: 'emergency', label: 'Emergency' },
  { key: 'inspection', label: 'Inspection' },
];

export const PAYMENT_METHODS = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'Check',
  'Venmo',
  'Zelle',
  'PayPal',
  'Other',
] as const;

export type PaymentMethod = typeof PAYMENT_METHODS[number];
