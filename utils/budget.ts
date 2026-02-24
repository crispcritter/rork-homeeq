import Colors from '@/constants/colors';

export function getBudgetColor(progress: number): string {
  if (progress > 0.9) return Colors.danger;
  if (progress > 0.7) return Colors.warning;
  return Colors.primary;
}
