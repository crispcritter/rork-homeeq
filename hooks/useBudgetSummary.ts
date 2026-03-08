import { useCallback, useMemo } from 'react';
import { useHome } from '@/contexts/HomeContext';
import { BUDGET_CATEGORY_COLORS } from '@/constants/categories';
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
          color: BUDGET_CATEGORY_COLORS[category] || '#AEA69D',
        }))
        .sort((a, b) => b.amount - a.amount);
    },
    [budgetItems]
  );

  const categoryBreakdown = useMemo((): CategoryBreakdown[] => {
    const monthItems = budgetItems.filter((item) => {
      const d = parseLocalDate(item.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const total = monthItems.reduce((s, i) => s + signedAmount(i), 0);
    const breakdown: Record<string, number> = {};
    monthItems.forEach((item) => {
      breakdown[item.category] = (breakdown[item.category] || 0) + signedAmount(item);
    });
    return Object.entries(breakdown)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
        color: BUDGET_CATEGORY_COLORS[category] || '#AEA69D',
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [budgetItems, currentMonth, currentYear]);

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
