import { useCallback, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { Appliance, MaintenanceTask, BudgetItem, HomeProfile, TrustedPro, PrivateNote, ReviewRating, ProServiceCategory, HouseholdMember, toISODateString, toISOTimestamp } from '../types';
import { RecommendedGroup, RecommendedItem, recommendedGroups as defaultRecommendedGroups } from '../mocks/recommendedItems';
import { STORAGE_KEYS, loadFromStorage, loadMonthlyBudget, resetAllData, saveToStorage, saveMonthlyBudget } from './storage';
import { DEFAULT_PROFILE } from '@/constants/defaultProfile';
import { parseLocalDate } from '@/utils/dates';

export const [HomeProvider, useHome] = createContextHook(() => {
  const queryClient = useQueryClient();

  const appliancesQuery = useQuery({
    queryKey: ['appliances'],
    queryFn: () => loadFromStorage<Appliance[]>(STORAGE_KEYS.appliances, []),
  });

  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: () => loadFromStorage<MaintenanceTask[]>(STORAGE_KEYS.tasks, []),
  });

  const budgetItemsQuery = useQuery({
    queryKey: ['budgetItems'],
    queryFn: () => loadFromStorage<BudgetItem[]>(STORAGE_KEYS.budgetItems, []),
  });

  const monthlyBudgetQuery = useQuery({
    queryKey: ['monthlyBudget'],
    queryFn: loadMonthlyBudget,
  });

  const homeProfileQuery = useQuery({
    queryKey: ['homeProfile'],
    queryFn: () => loadFromStorage<HomeProfile>(STORAGE_KEYS.homeProfile, DEFAULT_PROFILE),
  });

  const recommendedGroupsQuery = useQuery({
    queryKey: ['recommendedGroups'],
    queryFn: () => loadFromStorage<RecommendedGroup[]>(STORAGE_KEYS.recommendedItems, defaultRecommendedGroups),
  });

  const trustedProsQuery = useQuery({
    queryKey: ['trustedPros'],
    queryFn: () => loadFromStorage<TrustedPro[]>(STORAGE_KEYS.trustedPros, []),
  });

  const appliances = appliancesQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];
  const budgetItems = budgetItemsQuery.data ?? [];
  const monthlyBudget = monthlyBudgetQuery.data ?? 1500;
  const homeProfile = homeProfileQuery.data ?? DEFAULT_PROFILE;
  const customRecommendedGroups = recommendedGroupsQuery.data ?? defaultRecommendedGroups;
  const trustedPros = trustedProsQuery.data ?? [];
  const isLoading = appliancesQuery.isLoading || tasksQuery.isLoading || budgetItemsQuery.isLoading || monthlyBudgetQuery.isLoading || homeProfileQuery.isLoading || recommendedGroupsQuery.isLoading || trustedProsQuery.isLoading;
  const isError = appliancesQuery.isError || tasksQuery.isError || budgetItemsQuery.isError || monthlyBudgetQuery.isError || homeProfileQuery.isError || recommendedGroupsQuery.isError || trustedProsQuery.isError;
  const errors = useMemo(() => {
    const entries: { key: string; error: Error }[] = [];
    if (appliancesQuery.error) entries.push({ key: 'appliances', error: appliancesQuery.error });
    if (tasksQuery.error) entries.push({ key: 'tasks', error: tasksQuery.error });
    if (budgetItemsQuery.error) entries.push({ key: 'budgetItems', error: budgetItemsQuery.error });
    if (monthlyBudgetQuery.error) entries.push({ key: 'monthlyBudget', error: monthlyBudgetQuery.error });
    if (homeProfileQuery.error) entries.push({ key: 'homeProfile', error: homeProfileQuery.error });
    if (recommendedGroupsQuery.error) entries.push({ key: 'recommendedGroups', error: recommendedGroupsQuery.error });
    if (trustedProsQuery.error) entries.push({ key: 'trustedPros', error: trustedProsQuery.error });
    return entries;
  }, [appliancesQuery.error, tasksQuery.error, budgetItemsQuery.error, monthlyBudgetQuery.error, homeProfileQuery.error, recommendedGroupsQuery.error, trustedProsQuery.error]);

  const listMutate = useCallback(async <TItem extends { id: string }>(
    storageKey: string,
    queryKey: string[],
    updater: (items: TItem[]) => TItem[],
  ) => {
    const currentItems = (queryClient.getQueryData<TItem[]>(queryKey) ?? []);
    const updated = updater(currentItems);
    try {
      await saveToStorage(storageKey, updated);
      queryClient.setQueryData(queryKey, updated);
    } catch (error) {
      console.error(`[HomeContext] Failed to persist ${storageKey}:`, error);
    }
    return updated;
  }, [queryClient]);

  const addAppliance = useCallback((appliance: Appliance) => {
    listMutate<Appliance>(STORAGE_KEYS.appliances, ['appliances'], (items) => {
      if (items.some((a) => a.id === appliance.id)) {
        console.warn('[HomeContext] Duplicate appliance rejected:', appliance.id);
        return items;
      }
      return [...items, appliance];
    });
  }, [listMutate]);

  const updateAppliance = useCallback((appliance: Appliance) => {
    listMutate<Appliance>(STORAGE_KEYS.appliances, ['appliances'], (items) =>
      items.map((a) => (a.id === appliance.id ? appliance : a))
    );
  }, [listMutate]);

  const deleteAppliance = useCallback((id: string) => {
    listMutate<Appliance>(STORAGE_KEYS.appliances, ['appliances'], (items) =>
      items.filter((a) => a.id !== id)
    );
  }, [listMutate]);

  const addTask = useCallback((task: MaintenanceTask) => {
    listMutate<MaintenanceTask>(STORAGE_KEYS.tasks, ['tasks'], (items) => {
      if (items.some((t) => t.id === task.id)) {
        console.warn('[HomeContext] Duplicate task rejected:', task.id);
        return items;
      }
      return [...items, task];
    });
  }, [listMutate]);

  const updateTask = useCallback((task: MaintenanceTask) => {
    listMutate<MaintenanceTask>(STORAGE_KEYS.tasks, ['tasks'], (items) =>
      items.map((t) => (t.id === task.id ? task : t))
    );
  }, [listMutate]);

  const completeTask = useCallback((taskId: string) => {
    listMutate<MaintenanceTask>(STORAGE_KEYS.tasks, ['tasks'], (items) => {
      const task = items.find((t) => t.id === taskId);
      if (!task) return items;

      const completedItems = items.map((t) =>
        t.id === taskId
          ? { ...t, status: 'completed' as const, completedDate: toISODateString(new Date()) }
          : t
      );

      if (task.recurring && task.recurringInterval) {
        const intervalDays = task.recurringInterval;
        const currentDue = new Date(task.dueDate);
        const nextDue = new Date(currentDue);
        nextDue.setDate(nextDue.getDate() + intervalDays);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (nextDue < today) {
          nextDue.setTime(today.getTime());
          nextDue.setDate(nextDue.getDate() + intervalDays);
        }

        const nextTask: MaintenanceTask = {
          id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title: task.title,
          description: task.description,
          dueDate: toISODateString(nextDue),
          priority: task.priority,
          status: 'upcoming',
          recurring: true,
          recurringInterval: task.recurringInterval,
          estimatedCost: task.estimatedCost,
          applianceId: task.applianceId,
          trustedProId: task.trustedProId,
          notes: [],
        };

        console.log('[HomeContext] Recurring task completed:', task.title, '| Next due:', nextTask.dueDate);
        return [...completedItems, nextTask];
      }

      return completedItems;
    });
  }, [listMutate]);

  const archiveTask = useCallback((taskId: string) => {
    listMutate<MaintenanceTask>(STORAGE_KEYS.tasks, ['tasks'], (items) =>
      items.map((t) =>
        t.id === taskId
          ? { ...t, status: 'archived' as const, archivedDate: toISODateString(new Date()) }
          : t
      )
    );
  }, [listMutate]);

  const unarchiveTask = useCallback((taskId: string) => {
    listMutate<MaintenanceTask>(STORAGE_KEYS.tasks, ['tasks'], (items) =>
      items.map((t) =>
        t.id === taskId
          ? { ...t, status: 'upcoming' as const, archivedDate: undefined }
          : t
      )
    );
  }, [listMutate]);

  const deleteTask = useCallback((taskId: string) => {
    listMutate<MaintenanceTask>(STORAGE_KEYS.tasks, ['tasks'], (items) =>
      items.filter((t) => t.id !== taskId)
    );
  }, [listMutate]);

  const addTaskNote = useCallback(({ taskId, note }: { taskId: string; note: string }) => {
    listMutate<MaintenanceTask>(STORAGE_KEYS.tasks, ['tasks'], (items) =>
      items.map((t) =>
        t.id === taskId ? { ...t, notes: [...(t.notes ?? []), note] } : t
      )
    );
  }, [listMutate]);

  const removeTaskNote = useCallback(({ taskId, noteIndex }: { taskId: string; noteIndex: number }) => {
    listMutate<MaintenanceTask>(STORAGE_KEYS.tasks, ['tasks'], (items) =>
      items.map((t) => {
        if (t.id !== taskId) return t;
        const notes = [...(t.notes ?? [])];
        notes.splice(noteIndex, 1);
        return { ...t, notes };
      })
    );
  }, [listMutate]);

  const updateTaskProductLink = useCallback(({ taskId, productLink }: { taskId: string; productLink: string | undefined }) => {
    listMutate<MaintenanceTask>(STORAGE_KEYS.tasks, ['tasks'], (items) =>
      items.map((t) => (t.id === taskId ? { ...t, productLink } : t))
    );
  }, [listMutate]);

  const updateTaskTrustedPro = useCallback(({ taskId, trustedProId }: { taskId: string; trustedProId: string | undefined }) => {
    listMutate<MaintenanceTask>(STORAGE_KEYS.tasks, ['tasks'], (items) =>
      items.map((t) => (t.id === taskId ? { ...t, trustedProId } : t))
    );
    console.log('[HomeContext] Updated trusted pro for task:', taskId, 'pro:', trustedProId);
  }, [listMutate]);

  const addBudgetItem = useCallback((item: BudgetItem) => {
    listMutate<BudgetItem>(STORAGE_KEYS.budgetItems, ['budgetItems'], (items) => {
      if (items.some((i) => i.id === item.id)) {
        console.warn('[HomeContext] Duplicate budget item rejected:', item.id);
        return items;
      }
      return [...items, item];
    });
  }, [listMutate]);

  const updateBudgetItem = useCallback((item: BudgetItem) => {
    listMutate<BudgetItem>(STORAGE_KEYS.budgetItems, ['budgetItems'], (items) =>
      items.map((i) => (i.id === item.id ? item : i))
    );
  }, [listMutate]);

  const deleteBudgetItem = useCallback((id: string) => {
    listMutate<BudgetItem>(STORAGE_KEYS.budgetItems, ['budgetItems'], (items) =>
      items.filter((i) => i.id !== id)
    );
  }, [listMutate]);

  const addTrustedPro = useCallback((pro: TrustedPro) => {
    listMutate<TrustedPro>(STORAGE_KEYS.trustedPros, ['trustedPros'], (items) => [...items, pro]);
  }, [listMutate]);

  const updateTrustedPro = useCallback((pro: TrustedPro) => {
    listMutate<TrustedPro>(STORAGE_KEYS.trustedPros, ['trustedPros'], (items) =>
      items.map((p) => (p.id === pro.id ? pro : p))
    );
  }, [listMutate]);

  const deleteTrustedPro = useCallback((id: string) => {
    listMutate<TrustedPro>(STORAGE_KEYS.trustedPros, ['trustedPros'], (items) =>
      items.filter((p) => p.id !== id)
    );
  }, [listMutate]);

  const addProPrivateNote = useCallback((proId: string, text: string) => {
    const note: PrivateNote = { id: `note-${Date.now()}`, text, createdAt: toISOTimestamp(new Date()) };
    listMutate<TrustedPro>(STORAGE_KEYS.trustedPros, ['trustedPros'], (items) =>
      items.map((p) => p.id === proId ? { ...p, privateNotes: [...(p.privateNotes ?? []), note] } : p)
    );
    console.log('[HomeContext] Added private note to pro:', proId);
  }, [listMutate]);

  const removeProPrivateNote = useCallback((proId: string, noteId: string) => {
    listMutate<TrustedPro>(STORAGE_KEYS.trustedPros, ['trustedPros'], (items) =>
      items.map((p) => p.id === proId ? { ...p, privateNotes: (p.privateNotes ?? []).filter((n) => n.id !== noteId) } : p)
    );
    console.log('[HomeContext] Removed private note:', noteId, 'from pro:', proId);
  }, [listMutate]);

  const updateProPrivateNote = useCallback((proId: string, noteId: string, text: string) => {
    listMutate<TrustedPro>(STORAGE_KEYS.trustedPros, ['trustedPros'], (items) =>
      items.map((p) => p.id === proId ? { ...p, privateNotes: (p.privateNotes ?? []).map((n) => n.id === noteId ? { ...n, text } : n) } : p)
    );
  }, [listMutate]);

  const linkApplianceToPro = useCallback((proId: string, applianceId: string) => {
    listMutate<TrustedPro>(STORAGE_KEYS.trustedPros, ['trustedPros'], (items) =>
      items.map((p) => {
        if (p.id !== proId) return p;
        const existing = p.linkedApplianceIds ?? [];
        if (existing.includes(applianceId)) return p;
        return { ...p, linkedApplianceIds: [...existing, applianceId] };
      })
    );
    console.log('[HomeContext] Linked appliance:', applianceId, 'to pro:', proId);
  }, [listMutate]);

  const unlinkApplianceFromPro = useCallback((proId: string, applianceId: string) => {
    listMutate<TrustedPro>(STORAGE_KEYS.trustedPros, ['trustedPros'], (items) =>
      items.map((p) => p.id === proId ? { ...p, linkedApplianceIds: (p.linkedApplianceIds ?? []).filter((id) => id !== applianceId) } : p)
    );
    console.log('[HomeContext] Unlinked appliance:', applianceId, 'from pro:', proId);
  }, [listMutate]);

  const updateProRatings = useCallback((proId: string, ratings: ReviewRating[]) => {
    listMutate<TrustedPro>(STORAGE_KEYS.trustedPros, ['trustedPros'], (items) =>
      items.map((p) => p.id === proId ? { ...p, ratings } : p)
    );
    console.log('[HomeContext] Updated ratings for pro:', proId);
  }, [listMutate]);

  const updateProServiceInfo = useCallback((proId: string, serviceCategories: ProServiceCategory[], serviceRadius?: number) => {
    listMutate<TrustedPro>(STORAGE_KEYS.trustedPros, ['trustedPros'], (items) =>
      items.map((p) => p.id === proId ? { ...p, serviceCategories, serviceRadius } : p)
    );
  }, [listMutate]);

  const setMonthlyBudget = useCallback(async (amount: number) => {
    try {
      await saveMonthlyBudget(amount);
      queryClient.setQueryData(['monthlyBudget'], amount);
    } catch (error) {
      console.error('[HomeContext] Failed to persist monthlyBudget:', error);
    }
  }, [queryClient]);

  const updateHomeProfile = useCallback(async (profile: HomeProfile) => {
    try {
      await saveToStorage(STORAGE_KEYS.homeProfile, profile);
      queryClient.setQueryData(['homeProfile'], profile);
    } catch (error) {
      console.error('[HomeContext] Failed to persist homeProfile:', error);
    }
  }, [queryClient]);

  const addHouseholdMember = useCallback(async (member: HouseholdMember) => {
    const current = queryClient.getQueryData<HomeProfile>(['homeProfile']) ?? DEFAULT_PROFILE;
    const updated = { ...current, householdMembers: [...(current.householdMembers ?? []), member] };
    await updateHomeProfile(updated);
    console.log('[HomeContext] Added household member:', member.name);
  }, [queryClient, updateHomeProfile]);

  const removeHouseholdMember = useCallback(async (memberId: string) => {
    const current = queryClient.getQueryData<HomeProfile>(['homeProfile']) ?? DEFAULT_PROFILE;
    const updated = { ...current, householdMembers: (current.householdMembers ?? []).filter((m) => m.id !== memberId) };
    await updateHomeProfile(updated);
    console.log('[HomeContext] Removed household member:', memberId);
  }, [queryClient, updateHomeProfile]);

  const updateHouseholdMember = useCallback(async (member: HouseholdMember) => {
    const current = queryClient.getQueryData<HomeProfile>(['homeProfile']) ?? DEFAULT_PROFILE;
    const updated = { ...current, householdMembers: (current.householdMembers ?? []).map((m) => m.id === member.id ? member : m) };
    await updateHomeProfile(updated);
  }, [queryClient, updateHomeProfile]);

  const updateRecommendedGroups = useCallback(async (groups: RecommendedGroup[]) => {
    try {
      await saveToStorage(STORAGE_KEYS.recommendedItems, groups);
      queryClient.setQueryData(['recommendedGroups'], groups);
    } catch (error) {
      console.error('[HomeContext] Failed to persist recommendedGroups:', error);
    }
  }, [queryClient]);

  const addRecommendedItem = useCallback(async (groupKey: string, item: RecommendedItem) => {
    const groups = queryClient.getQueryData<RecommendedGroup[]>(['recommendedGroups']) ?? defaultRecommendedGroups;
    const updated = groups.map((g) =>
      g.key === groupKey ? { ...g, items: [...g.items, item] } : g
    );
    console.log('[HomeContext] Adding recommended item:', item.name, 'to group:', groupKey);
    await updateRecommendedGroups(updated);
  }, [queryClient, updateRecommendedGroups]);

  const removeRecommendedItem = useCallback(async (groupKey: string, itemId: string) => {
    const groups = queryClient.getQueryData<RecommendedGroup[]>(['recommendedGroups']) ?? defaultRecommendedGroups;
    const updated = groups.map((g) =>
      g.key === groupKey ? { ...g, items: g.items.filter((i) => i.id !== itemId) } : g
    );
    console.log('[HomeContext] Removing recommended item:', itemId, 'from group:', groupKey);
    await updateRecommendedGroups(updated);
  }, [queryClient, updateRecommendedGroups]);

  const duplicateRecommendedItem = useCallback(async (groupKey: string, itemId: string) => {
    const groups = queryClient.getQueryData<RecommendedGroup[]>(['recommendedGroups']) ?? defaultRecommendedGroups;
    const updated = groups.map((g) => {
      if (g.key !== groupKey) return g;
      const original = g.items.find((i) => i.id === itemId);
      if (!original) return g;
      const duplicate: RecommendedItem = {
        ...original,
        id: `rec-custom-${Date.now()}`,
        name: `${original.name} (Copy)`,
        isCustom: true,
      };
      const idx = g.items.findIndex((i) => i.id === itemId);
      const newItems = [...g.items];
      newItems.splice(idx + 1, 0, duplicate);
      return { ...g, items: newItems };
    });
    console.log('[HomeContext] Duplicating recommended item:', itemId, 'in group:', groupKey);
    await updateRecommendedGroups(updated);
  }, [queryClient, updateRecommendedGroups]);

  const syncRecommendedItem = useCallback(async (groupKey: string, itemId: string) => {
    const groups = queryClient.getQueryData<RecommendedGroup[]>(['recommendedGroups']) ?? defaultRecommendedGroups;
    const currentAppliances = queryClient.getQueryData<Appliance[]>(['appliances']) ?? [];
    const group = groups.find((g) => g.key === groupKey);
    const item = group?.items.find((i) => i.id === itemId);
    if (!item) return;
    const matchingAppliance = currentAppliances.find((a) => {
      const nameMatch = a.name.toLowerCase() === item.name.toLowerCase();
      if (!nameMatch) return false;
      if (item.category && a.category !== item.category) return false;
      if (item.location && a.location && a.location.toLowerCase() !== item.location.toLowerCase()) return false;
      return true;
    });
    if (!matchingAppliance) return;
    const updatedGroups = groups.map((g) =>
      g.key === groupKey
        ? {
            ...g,
            items: g.items.map((i) =>
              i.id === itemId
                ? { ...i, name: matchingAppliance.name, category: matchingAppliance.category as any, location: matchingAppliance.location }
                : i
            ),
          }
        : g
    );
    console.log('[HomeContext] Syncing recommended item:', item.name, 'with appliance:', matchingAppliance.name);
    await updateRecommendedGroups(updatedGroups);
  }, [queryClient, updateRecommendedGroups]);

  const resetDataMutation = useMutation({
    mutationFn: resetAllData,
    onMutate: () => {
      queryClient.setQueryData(['appliances'], []);
      queryClient.setQueryData(['tasks'], []);
      queryClient.setQueryData(['budgetItems'], []);
      queryClient.setQueryData(['monthlyBudget'], 1500);
      queryClient.setQueryData(['homeProfile'], DEFAULT_PROFILE);
      queryClient.setQueryData(['recommendedGroups'], defaultRecommendedGroups);
      queryClient.setQueryData(['trustedPros'], []);
      console.log('[HomeContext] Cache optimistically cleared before reset');
    },
    onSuccess: async () => {
      const { initializeData } = await import('./storage');
      await initializeData();
      console.log('[HomeContext] Re-seeding complete after reset');
      const queryKeys = ['appliances', 'tasks', 'budgetItems', 'monthlyBudget', 'homeProfile', 'recommendedGroups', 'trustedPros'];
      queryKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
      console.log('[HomeContext] All queries invalidated after re-seed');
    },
    onError: (error) => {
      console.error('[HomeContext] Reset failed, refetching to restore state:', error);
      const queryKeys = ['appliances', 'tasks', 'budgetItems', 'monthlyBudget', 'homeProfile', 'recommendedGroups', 'trustedPros'];
      queryKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
    },
  });

  const resetData = useCallback(() => {
    resetDataMutation.mutate();
  }, [resetDataMutation]);

  useEffect(() => {
    if (errors.length > 0) {
      errors.forEach(({ key, error }) => {
        console.error(`[HomeContext] Query "${key}" failed:`, error.message);
      });
    }
  }, [errors]);

  useEffect(() => {
    if (tasksQuery.isLoading || tasks.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const needsUpdate = tasks.some((t) => {
      if (t.status !== 'upcoming') return false;
      const due = parseLocalDate(t.dueDate);
      due.setHours(0, 0, 0, 0);
      return due < today;
    });

    if (!needsUpdate) return;

    console.log('[HomeContext] Detected overdue tasks, updating statuses');
    listMutate<MaintenanceTask>(STORAGE_KEYS.tasks, ['tasks'], (items) =>
      items.map((t) => {
        if (t.status !== 'upcoming') return t;
        const due = parseLocalDate(t.dueDate);
        due.setHours(0, 0, 0, 0);
        if (due < today) {
          console.log('[HomeContext] Task marked overdue:', t.title, '| due:', t.dueDate);
          return { ...t, status: 'overdue' as const };
        }
        return t;
      })
    );
  }, [tasks, tasksQuery.isLoading, listMutate]);

  const totalSpent = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return budgetItems
      .filter((item) => {
        const d = parseLocalDate(item.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, item) => sum + item.amount, 0);
  }, [budgetItems]);

  const upcomingTasks = useMemo(
    () => tasks.filter((t) => t.status === 'upcoming').sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [tasks]
  );

  const overdueTasks = useMemo(
    () => tasks.filter((t) => t.status === 'overdue'),
    [tasks]
  );

  const completedTasks = useMemo(
    () => tasks.filter((t) => t.status === 'completed'),
    [tasks]
  );

  const archivedTasks = useMemo(
    () => tasks.filter((t) => t.status === 'archived'),
    [tasks]
  );

  const activeTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'archived'),
    [tasks]
  );

  const getApplianceById = useCallback(
    (id: string) => appliances.find((a) => a.id === id),
    [appliances]
  );

  const refreshAll = useCallback(() => {
    const queryKeys = ['appliances', 'tasks', 'budgetItems', 'monthlyBudget', 'homeProfile', 'recommendedGroups', 'trustedPros'];
    console.log('[HomeContext] Pull-to-refresh: invalidating all queries');
    return Promise.all(queryKeys.map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
  }, [queryClient]);

  const isRefreshing = appliancesQuery.isRefetching || tasksQuery.isRefetching || budgetItemsQuery.isRefetching || monthlyBudgetQuery.isRefetching || homeProfileQuery.isRefetching || recommendedGroupsQuery.isRefetching || trustedProsQuery.isRefetching;

  return {
    appliances,
    tasks,
    budgetItems,
    monthlyBudget,
    homeProfile,
    customRecommendedGroups,
    isLoading,
    isError,
    errors,
    totalSpent,
    upcomingTasks,
    overdueTasks,
    completedTasks,
    archivedTasks,
    activeTasks,
    getApplianceById,
    addAppliance,
    updateAppliance,
    deleteAppliance,
    addTask,
    updateTask,
    completeTask,
    archiveTask,
    unarchiveTask,
    deleteTask,
    addTaskNote,
    removeTaskNote,
    updateTaskProductLink,
    updateTaskTrustedPro,
    trustedPros,
    addBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
    addTrustedPro,
    updateTrustedPro,
    deleteTrustedPro,
    addProPrivateNote,
    removeProPrivateNote,
    updateProPrivateNote,
    linkApplianceToPro,
    unlinkApplianceFromPro,
    updateProRatings,
    updateProServiceInfo,
    setMonthlyBudget,
    updateHomeProfile,
    addRecommendedItem,
    removeRecommendedItem,
    duplicateRecommendedItem,
    syncRecommendedItem,
    resetData,
    isResetting: resetDataMutation.isPending,
    refreshAll,
    isRefreshing,
    addHouseholdMember,
    removeHouseholdMember,
    updateHouseholdMember,
  };
});
