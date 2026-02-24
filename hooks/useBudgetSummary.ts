import { useMemo } from 'react';
import { useHome } from '@/contexts/HomeContext';
import { getBudgetColor } from '@/utils/budget';
import { BudgetItem } from '@/types';
import { BUDGET_CATEGORY_COLORS } from '@/constants/categories';

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export function useBudgetSummary() {
  const { budgetItems, monthlyBudget, totalSpent } = useHome();

  const budgetProgress = monthlyBudget > 0 ? Math.min(totalSpent / monthlyBudget, 1) : 0;
  const remaining = Math.max(monthlyBudget - totalSpent, 0);
  const budgetColor = getBudgetColor(budgetProgress);
  const budgetPercentUsed = Math.round(budgetProgress * 100);

  const categoryBreakdown = useMemo((): CategoryBreakdown[] => {
    const breakdown: Record<string, number> = {};
    budgetItems.forEach((item) => {
      breakdown[item.category] = (breakdown[item.category] || 0) + item.amount;
    });
    return Object.entries(breakdown)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
        color: BUDGET_CATEGORY_COLORS[category] || '#AEA69D',
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [budgetItems, totalSpent]);

  const recentItems = useMemo(
    () => [...budgetItems].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10),
    [budgetItems]
  );

  return {
    budgetItems,
    monthlyBudget,
    totalSpent,
    budgetProgress,
    remaining,
    budgetColor,
    budgetPercentUsed,
    categoryBreakdown,
    recentItems,
  };
}
