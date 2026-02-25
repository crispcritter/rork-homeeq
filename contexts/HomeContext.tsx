import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Appliance, MaintenanceTask, BudgetItem, HomeProfile, TrustedPro, PrivateNote, ReviewRating, ProServiceCategory, HouseholdMember } from '../types';
import { RecommendedGroup, RecommendedItem, recommendedGroups as defaultRecommendedGroups } from '../mocks/recommendedItems';
import { STORAGE_KEYS, loadFromStorage, loadMonthlyBudget, resetAllData } from './storage';
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

  const listMutate = useCallback(async <TItem extends { id: string }>(
    storageKey: string,
    queryKey: string[],
    updater: (items: TItem[]) => TItem[],
  ) => {
    const currentItems = (queryClient.getQueryData<TItem[]>(queryKey) ?? []);
    const updated = updater(currentItems);
    await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
    queryClient.setQueryData(queryKey, updated);
    return updated;
  }, [queryClient]);

  const addAppliance = useCallback((appliance: Appliance) => {
    listMutate<Appliance>(STORAGE_KEYS.appliances, ['appliances'], (items) => [...items, appliance]);
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
    listMutate<MaintenanceTask>(STORAGE_KEYS.tasks, ['tasks'], (items) => [...items, task]);
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
          ? { ...t, status: 'completed' as const, completedDate: new Date().toISOString().split('T')[0] }
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
          dueDate: nextDue.toISOString().split('T')[0],
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
          ? { ...t, status: 'archived' as const, archivedDate: new Date().toISOString().split('T')[0] }
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
    listMutate<BudgetItem>(STORAGE_KEYS.budgetItems, ['budgetItems'], (items) => [...items, item]);
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
    const note: PrivateNote = { id: `note-${Date.now()}`, text, createdAt: new Date().toISOString() };
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
    await AsyncStorage.setItem(STORAGE_KEYS.monthlyBudget, amount.toString());
    queryClient.setQueryData(['monthlyBudget'], amount);
  }, [queryClient]);

  const updateHomeProfile = useCallback(async (profile: HomeProfile) => {
    await AsyncStorage.setItem(STORAGE_KEYS.homeProfile, JSON.stringify(profile));
    queryClient.setQueryData(['homeProfile'], profile);
  }, [queryClient]);

  const addHouseholdMember = useCallback(async (member: HouseholdMember) => {
    const current = queryClient.getQueryData<HomeProfile>(['homeProfile']) ?? DEFAULT_PROFILE;
    const updated = { ...current, householdMembers: [...(current.householdMembers ?? []), member] };
    await AsyncStorage.setItem(STORAGE_KEYS.homeProfile, JSON.stringify(updated));
    queryClient.setQueryData(['homeProfile'], updated);
    console.log('[HomeContext] Added household member:', member.name);
  }, [queryClient]);

  const removeHouseholdMember = useCallback(async (memberId: string) => {
    const current = queryClient.getQueryData<HomeProfile>(['homeProfile']) ?? DEFAULT_PROFILE;
    const updated = { ...current, householdMembers: (current.householdMembers ?? []).filter((m) => m.id !== memberId) };
    await AsyncStorage.setItem(STORAGE_KEYS.homeProfile, JSON.stringify(updated));
    queryClient.setQueryData(['homeProfile'], updated);
    console.log('[HomeContext] Removed household member:', memberId);
  }, [queryClient]);

  const updateHouseholdMember = useCallback(async (member: HouseholdMember) => {
    const current = queryClient.getQueryData<HomeProfile>(['homeProfile']) ?? DEFAULT_PROFILE;
    const updated = { ...current, householdMembers: (current.householdMembers ?? []).map((m) => m.id === member.id ? member : m) };
    await AsyncStorage.setItem(STORAGE_KEYS.homeProfile, JSON.stringify(updated));
    queryClient.setQueryData(['homeProfile'], updated);
  }, [queryClient]);

  const updateRecommendedGroups = useCallback(async (groups: RecommendedGroup[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.recommendedItems, JSON.stringify(groups));
    queryClient.setQueryData(['recommendedGroups'], groups);
  }, [queryClient]);

  const addRecommendedItem = useCallback((groupKey: string, item: RecommendedItem) => {
    const groups = queryClient.getQueryData<RecommendedGroup[]>(['recommendedGroups']) ?? defaultRecommendedGroups;
    const updated = groups.map((g) =>
      g.key === groupKey ? { ...g, items: [...g.items, item] } : g
    );
    console.log('[HomeContext] Adding recommended item:', item.name, 'to group:', groupKey);
    updateRecommendedGroups(updated);
  }, [queryClient, updateRecommendedGroups]);

  const removeRecommendedItem = useCallback((groupKey: string, itemId: string) => {
    const groups = queryClient.getQueryData<RecommendedGroup[]>(['recommendedGroups']) ?? defaultRecommendedGroups;
    const updated = groups.map((g) =>
      g.key === groupKey ? { ...g, items: g.items.filter((i) => i.id !== itemId) } : g
    );
    console.log('[HomeContext] Removing recommended item:', itemId, 'from group:', groupKey);
    updateRecommendedGroups(updated);
  }, [queryClient, updateRecommendedGroups]);

  const duplicateRecommendedItem = useCallback((groupKey: string, itemId: string) => {
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
    updateRecommendedGroups(updated);
  }, [queryClient, updateRecommendedGroups]);

  const syncRecommendedItem = useCallback((groupKey: string, itemId: string) => {
    const groups = queryClient.getQueryData<RecommendedGroup[]>(['recommendedGroups']) ?? defaultRecommendedGroups;
    const currentAppliances = queryClient.getQueryData<Appliance[]>(['appliances']) ?? [];
    const group = groups.find((g) => g.key === groupKey);
    const item = group?.items.find((i) => i.id === itemId);
    if (!item) return;
    const matchingAppliance = currentAppliances.find(
      (a) => a.name.toLowerCase() === item.name.toLowerCase()
    );
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
    updateRecommendedGroups(updatedGroups);
  }, [queryClient, updateRecommendedGroups]);

  const resetDataMutation = useMutation({
    mutationFn: resetAllData,
    onSuccess: () => {
      const queryKeys = ['appliances', 'tasks', 'budgetItems', 'monthlyBudget', 'homeProfile', 'recommendedGroups', 'trustedPros'];
      queryKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
      console.log('[HomeContext] All queries invalidated after reset');
    },
  });

  const resetData = useCallback(() => {
    resetDataMutation.mutate();
  }, [resetDataMutation]);

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

  return {
    appliances,
    tasks,
    budgetItems,
    monthlyBudget,
    homeProfile,
    customRecommendedGroups,
    isLoading,
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
    addHouseholdMember,
    removeHouseholdMember,
    updateHouseholdMember,
  };
});
