import { ColorScheme } from '@/constants/colors';

export function getBudgetColor(progress: number, c: ColorScheme): string {
  if (progress > 0.9) return c.danger;
  if (progress > 0.7) return c.warning;
  return c.primary;
}
