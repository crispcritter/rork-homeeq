import { ISODateString } from '@/types';

export function parseLocalDate(dateStr: ISODateString | string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
    return new Date(year, month - 1, day);
  }
  return new Date(dateStr);
}

export function formatRelativeDate(dateStr: ISODateString | string): string {
  const date = parseLocalDate(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
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

export interface WarrantyStatus {
  label: string;
  color: string;
  daysLeft: number;
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

export function getWarrantyStatus(expiryDate: ISODateString | string, colors: { danger: string; warning: string; success: string; textTertiary: string }): WarrantyStatus {
  if (!expiryDate || typeof expiryDate !== 'string' || expiryDate.trim() === '') {
    return { label: 'Unknown', color: colors.textTertiary, daysLeft: 0 };
  }
  const expiry = parseLocalDate(expiryDate);
  if (isNaN(expiry.getTime())) {
    return { label: 'Unknown', color: colors.textTertiary, daysLeft: 0 };
  }
  const now = new Date();
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'Expired', color: colors.danger, daysLeft: diffDays };
  if (diffDays < 90) return { label: 'Expiring Soon', color: colors.warning, daysLeft: diffDays };
  return { label: 'Covered', color: colors.success, daysLeft: diffDays };
}
