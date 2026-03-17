import { useCallback, useMemo } from 'react';
import { useHome } from '@/contexts/HomeContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getBudgetCategoryColors } from '@/constants/categories';
import { parseLocalDate } from '@/utils/dates';
import { signedAmount } from '@/types';

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export function useBudgetSummary() {
  const { budgetItems } = useHome();
  const { colors: themeColors } = useTheme();
  const budgetCategoryColors = useMemo(() => getBudgetCategoryColors(themeColors), [themeColors]);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const spentThisMonth = useMemo(() => {
    return budgetItems
      .filter((item) => {
        const d = parseLocalDate(item.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, item) => sum + signedAmount(item), 0);
  }, [budgetItems, currentMonth, currentYear]);

  const spentThisYear = useMemo(() => {
    return budgetItems
      .filter((item) => {
        const d = parseLocalDate(item.date);
        return d.getFullYear() === currentYear;
      })
      .reduce((sum, item) => sum + signedAmount(item), 0);
  }, [budgetItems, currentYear]);

  const totalSpentAllTime = useMemo(() => {
    return budgetItems.reduce((sum, item) => sum + signedAmount(item), 0);
  }, [budgetItems]);

  const spentInRange = useCallback(
    (range: DateRange): number => {
      return budgetItems
        .filter((item) => {
          const d = parseLocalDate(item.date);
          return d >= range.from && d <= range.to;
        })
        .reduce((sum, item) => sum + signedAmount(item), 0);
    },
    [budgetItems]
  );

  const categoryBreakdownForRange = useCallback(
    (range: DateRange): CategoryBreakdown[] => {
      const rangeItems = budgetItems.filter((item) => {
        const d = parseLocalDate(item.date);
        return d >= range.from && d <= range.to;
      });
      const total = rangeItems.reduce((s, i) => s + signedAmount(i), 0);
      const breakdown: Record<string, number> = {};
      rangeItems.forEach((item) => {
        breakdown[item.category] = (breakdown[item.category] || 0) + signedAmount(item);
      });
      return Object.entries(breakdown)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: total > 0 ? (amount / total) * 100 : 0,
          color: budgetCategoryColors[category] || themeColors.textTertiary,
        }))
        .sort((a, b) => b.amount - a.amount);
    },
    [budgetItems, budgetCategoryColors, themeColors.textTertiary]
  );

  const categoryBreakdown = useMemo((): CategoryBreakdown[] => {
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
    return categoryBreakdownForRange({ from: monthStart, to: monthEnd });
  }, [currentYear, currentMonth, categoryBreakdownForRange]);

  const recentItems = useMemo(
    () => [...budgetItems].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10),
    [budgetItems]
  );

  return {
    budgetItems,
    spentThisMonth,
    spentThisYear,
    totalSpentAllTime,
    spentInRange,
    categoryBreakdown,
    categoryBreakdownForRange,
    recentItems,
  };
}
