export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return `In ${diffDays} days`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatMonthDay(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatLongDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function formatMonthYear(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export interface WarrantyStatus {
  label: string;
  color: string;
  daysLeft: number;
}

export function getWeekEndingSaturday(dateStr: string): Date {
  const date = new Date(dateStr);
  const day = date.getDay();
  const daysUntilSaturday = day === 6 ? 0 : 6 - day;
  const saturday = new Date(date.getFullYear(), date.getMonth(), date.getDate() + daysUntilSaturday);
  return saturday;
}

export function formatWeekEnding(saturday: Date): string {
  return `Week ending ${saturday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

export function getWarrantyStatus(expiryDate: string, colors: { danger: string; warning: string; success: string; textTertiary: string }): WarrantyStatus {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'Expired', color: colors.danger, daysLeft: diffDays };
  if (diffDays < 90) return { label: 'Expiring Soon', color: colors.warning, daysLeft: diffDays };
  return { label: 'Covered', color: colors.success, daysLeft: diffDays };
}
