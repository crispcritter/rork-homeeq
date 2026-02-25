import { useMemo } from 'react';
import { useHome } from '@/contexts/HomeContext';
import { BUDGET_CATEGORY_COLORS } from '@/constants/categories';

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export function useBudgetSummary() {
  const { budgetItems } = useHome();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const spentThisMonth = useMemo(() => {
    return budgetItems
      .filter((item) => {
        const d = new Date(item.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, item) => sum + item.amount, 0);
  }, [budgetItems, currentMonth, currentYear]);

  const spentThisYear = useMemo(() => {
    return budgetItems
      .filter((item) => {
        const d = new Date(item.date);
        return d.getFullYear() === currentYear;
      })
      .reduce((sum, item) => sum + item.amount, 0);
  }, [budgetItems, currentYear]);

  const categoryBreakdown = useMemo((): CategoryBreakdown[] => {
    const monthItems = budgetItems.filter((item) => {
      const d = new Date(item.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const total = monthItems.reduce((s, i) => s + i.amount, 0);
    const breakdown: Record<string, number> = {};
    monthItems.forEach((item) => {
      breakdown[item.category] = (breakdown[item.category] || 0) + item.amount;
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
    categoryBreakdown,
    recentItems,
  };
}
