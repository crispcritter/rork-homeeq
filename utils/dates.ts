import { ISODateString } from '@/types';

export function parseLocalDate(dateStr: ISODateString | string): Date {
  const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = datePart.split('-').map(Number);
  const [year, month, day] = parts;
  if (parts.length === 3 && Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
    return new Date(year, month - 1, day);
  }
  console.warn('parseLocalDate: unexpected format, falling back to Date constructor:', dateStr);
  return new Date(dateStr);
}

export function formatRelativeDate(dateStr: ISODateString | string): string {
  const date = parseLocalDate(dateStr);
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((dateMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return `In ${diffDays} days`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatShortDate(dateStr: ISODateString | string): string {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatMonthDay(dateStr: ISODateString | string): string {
  return parseLocalDate(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatLongDate(dateStr: ISODateString | string): string {
  return parseLocalDate(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function formatMonthYear(dateStr: ISODateString | string): string {
  return parseLocalDate(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export type WarrantyColorKey = 'danger' | 'warning' | 'success' | 'textTertiary';

export interface WarrantyStatus {
  label: string;
  colorKey: WarrantyColorKey;
  daysLeft: number | null;
}

export function getWeekEndingSaturday(dateStr: ISODateString | string): Date {
  const date = parseLocalDate(dateStr);
  const day = date.getDay();
  const daysUntilSaturday = day === 6 ? 0 : 6 - day;
  const saturday = new Date(date.getFullYear(), date.getMonth(), date.getDate() + daysUntilSaturday);
  return saturday;
}

export function formatWeekEnding(saturday: Date): string {
  return `Week ending ${saturday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

export function isValidDateString(dateStr: string): boolean {
  const match = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  if (!match) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function getWarrantyStatus(expiryDate: ISODateString | string): WarrantyStatus {
  if (!expiryDate || typeof expiryDate !== 'string' || expiryDate.trim() === '') {
    return { label: 'Unknown', colorKey: 'textTertiary', daysLeft: null };
  }
  const expiry = parseLocalDate(expiryDate);
  if (isNaN(expiry.getTime())) {
    return { label: 'Unknown', colorKey: 'textTertiary', daysLeft: null };
  }
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expiryMidnight = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
  const diffDays = Math.round((expiryMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'Expired', colorKey: 'danger', daysLeft: diffDays };
  if (diffDays < 90) return { label: 'Expiring Soon', colorKey: 'warning', daysLeft: diffDays };
  return { label: 'Covered', colorKey: 'success', daysLeft: diffDays };
}
