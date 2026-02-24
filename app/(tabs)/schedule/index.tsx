import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Check,
  Clock,
  RefreshCw,
  CircleCheck,
  Archive,
  ChevronRight,
  ChevronDown,
  Calendar,
  AlertTriangle,
  Layers,
} from 'lucide-react-native';
import { useHome } from '@/contexts/HomeContext';
import Colors from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';
import PressableCard from '@/components/PressableCard';
import FloatingActionButton from '@/components/FloatingActionButton';
import ScreenHeader from '@/components/ScreenHeader';
import { formatRelativeDate, formatShortDate, getWeekEndingSaturday, formatWeekEnding } from '@/utils/dates';
import { lightImpact, mediumImpact, successNotification } from '@/utils/haptics';
import { getPriorityColor, getPriorityBgColor } from '@/constants/priorities';
import { MaintenanceTask, TaskPriority } from '@/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type FilterType = 'all' | 'upcoming' | 'overdue' | 'completed' | 'archived';
type SortMode = 'item' | 'importance' | 'week';

interface TaskGroup {
  key: string;
  title: string;
  icon?: React.ReactNode;
  accentColor?: string;
  data: MaintenanceTask[];
}

function getWeekGroupKey(dateStr: string): { key: string; title: string; sortOrder: number } {
  const date = new Date(dateStr);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (date < startOfToday) {
    return { key: 'overdue', title: 'Overdue', sortOrder: -1 };
  }

  const saturday = getWeekEndingSaturday(dateStr);
  const saturdayKey = `${saturday.getFullYear()}-${String(saturday.getMonth() + 1).padStart(2, '0')}-${String(saturday.getDate()).padStart(2, '0')}`;
  const title = formatWeekEnding(saturday);
  const sortOrder = saturday.getTime();

  return { key: saturdayKey, title, sortOrder };
}

function getWeekAccentColor(key: string): string {
  if (key === 'overdue') return Colors.danger;

  const now = new Date();
  const thisSaturday = getWeekEndingSaturday(now.toISOString());
  const satDate = new Date(key + 'T00:00:00');
  const diffWeeks = Math.round((satDate.getTime() - thisSaturday.getTime()) / (7 * 24 * 60 * 60 * 1000));

  if (diffWeeks <= 0) return Colors.primary;
  if (diffWeeks === 1) return Colors.accent;
  if (diffWeeks === 2) return Colors.warning;
  if (diffWeeks === 3) return Colors.categoryInspection;
  return Colors.textTertiary;
}

function getImportanceAccentColor(priority: TaskPriority): string {
  return getPriorityColor(priority);
}

export default function ScheduleScreen() {
  const router = useRouter();
  const { colors: c } = useTheme();
  const { tasks, appliances, completeTask } = useHome();
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortMode, setSortMode] = useState<SortMode>('item');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [completedCollapsed, setCompletedCollapsed] = useState<boolean>(true);

  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    if (filter === 'all') {
      result = result.filter((t) => t.status !== 'archived' && t.status !== 'completed');
    } else if (filter === 'completed') {
      result = result.filter((t) => t.status === 'completed');
    } else {
      result = result.filter((t) => t.status === filter);
    }
    return result;
  }, [tasks, filter]);

  const completedTasksList = useMemo(() => {
    if (filter !== 'all') return [];
    return tasks
      .filter((t) => t.status === 'completed')
      .sort((a, b) => (b.completedDate ?? '').localeCompare(a.completedDate ?? ''));
  }, [tasks, filter]);

  const groupedTasks = useMemo((): TaskGroup[] => {
    if (sortMode === 'importance') {
      const priorityOrder: TaskPriority[] = ['high', 'medium', 'low'];
      const groups: TaskGroup[] = priorityOrder
        .map((priority) => {
          const items = filteredTasks
            .filter((t) => t.priority === priority)
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
          return {
            key: priority,
            title: priority.charAt(0).toUpperCase() + priority.slice(1),
            accentColor: getImportanceAccentColor(priority),
            data: items,
          };
        })
        .filter((g) => g.data.length > 0);
      return groups;
    }

    if (sortMode === 'week') {
      const weekMap = new Map<string, { title: string; sortOrder: number; tasks: MaintenanceTask[] }>();
      filteredTasks.forEach((task) => {
        const { key, title, sortOrder } = getWeekGroupKey(task.dueDate);
        if (!weekMap.has(key)) {
          weekMap.set(key, { title, sortOrder, tasks: [] });
        }
        weekMap.get(key)!.tasks.push(task);
      });

      return Array.from(weekMap.entries())
        .sort(([, a], [, b]) => a.sortOrder - b.sortOrder)
        .map(([key, value]) => ({
          key,
          title: value.title,
          accentColor: getWeekAccentColor(key),
          data: value.tasks.sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
        }));
    }

    const applianceMap = new Map<string, { name: string; tasks: MaintenanceTask[] }>();
    filteredTasks.forEach((task) => {
      const appliance = task.applianceId ? appliances.find((a) => a.id === task.applianceId) : null;
      const key = appliance ? appliance.id : '__general__';
      const name = appliance ? appliance.name : 'General';
      if (!applianceMap.has(key)) {
        applianceMap.set(key, { name, tasks: [] });
      }
      applianceMap.get(key)!.tasks.push(task);
    });

    return Array.from(applianceMap.entries())
      .sort(([, a], [, b]) => a.name.localeCompare(b.name))
      .map(([key, value]) => ({
        key,
        title: value.name,
        accentColor: key === '__general__' ? Colors.textSecondary : Colors.primary,
        data: value.tasks.sort((a, b) => a.title.localeCompare(b.title)),
      }));
  }, [filteredTasks, sortMode, appliances]);

  const toggleGroup = useCallback((key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    lightImpact();
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  useEffect(() => {
    setCollapsedGroups({});
  }, [sortMode, filter]);

  const filterCounts = useMemo(() => ({
    all: tasks.filter((t) => t.status !== 'archived').length,
    upcoming: tasks.filter((t) => t.status === 'upcoming').length,
    overdue: tasks.filter((t) => t.status === 'overdue').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    archived: tasks.filter((t) => t.status === 'archived').length,
  }), [tasks]);

  const handleComplete = useCallback((taskId: string, taskTitle: string) => {
    Alert.alert(
      'Mark as done?',
      `Complete "${taskTitle}"?`,
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Done!',
          onPress: () => {
            successNotification();
            completeTask(taskId);
          },
        },
      ]
    );
  }, [completeTask]);

  const handleTaskPress = useCallback((taskId: string) => {
    lightImpact();
    router.push(`/task/${taskId}` as any);
  }, [router]);

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'completed', label: 'Done' },
    { key: 'archived', label: 'Archived' },
  ];

  const renderTaskCard = useCallback((task: MaintenanceTask) => {
    const appliance = task.applianceId ? appliances.find((a) => a.id === task.applianceId) : null;
    const isCompleted = task.status === 'completed';
    const isOverdue = task.status === 'overdue';
    const isArchived = task.status === 'archived';

    return (
      <PressableCard
        key={task.id}
        style={[
          styles.taskCard,
          isOverdue && styles.taskCardOverdue,
          isCompleted && styles.taskCardCompleted,
          isArchived && styles.taskCardArchived,
        ]}
        onPress={() => handleTaskPress(task.id)}
      >
        <View style={styles.taskLeft}>
          {isArchived ? (
            <View style={styles.checkCircleArchived}>
              <Archive size={12} color={Colors.textTertiary} />
            </View>
          ) : !isCompleted ? (
            <TouchableOpacity
              style={[styles.checkCircle, isOverdue && styles.checkCircleOverdue]}
              onPress={() => handleComplete(task.id, task.title)}
              activeOpacity={0.6}
            >
              <Check size={14} color={isOverdue ? Colors.danger : Colors.textTertiary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.checkCircleDone}>
              <Check size={14} color={Colors.white} />
            </View>
          )}
        </View>
        <View style={styles.taskBody}>
          <Text style={[styles.taskTitle, isCompleted && styles.taskTitleDone, isArchived && styles.taskTitleArchived]}>
            {task.title}
          </Text>
          {task.description ? (
            <Text style={styles.taskDesc} numberOfLines={1}>{task.description}</Text>
          ) : null}
          <View style={styles.taskFooter}>
            <View style={styles.taskDateRow}>
              <Clock size={11} color={isOverdue ? Colors.danger : Colors.textSecondary} />
              <Text style={[styles.taskDateText, isOverdue && { color: Colors.danger }]}>
                {isCompleted && task.completedDate
                  ? `Done ${formatShortDate(task.completedDate)}`
                  : isArchived && task.archivedDate
                  ? `Archived ${formatShortDate(task.archivedDate)}`
                  : formatRelativeDate(task.dueDate)}
              </Text>
            </View>
            {appliance && (
              <>
                <View style={styles.footerDot} />
                <Text style={styles.taskApplianceName}>{appliance.name}</Text>
              </>
            )}
            {task.recurring && (
              <View style={styles.recurringBadge}>
                <RefreshCw size={9} color={Colors.primary} />
                <Text style={styles.recurringText}>Repeats</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.taskRight}>
          <View
            style={[
              styles.priorityTag,
              { backgroundColor: getPriorityBgColor(task.priority) },
            ]}
          >
            <Text
              style={[
                styles.priorityText,
                { color: getPriorityColor(task.priority) },
              ]}
            >
              {task.priority}
            </Text>
          </View>
          <ChevronRight size={14} color={Colors.textTertiary} style={{ marginTop: 6 }} />
        </View>
      </PressableCard>
    );
  }, [appliances, handleComplete, handleTaskPress]);

  const renderGroupHeader = useCallback((group: TaskGroup) => {
    const isCollapsed = collapsedGroups[group.key] ?? false;
    const accentColor = group.accentColor ?? Colors.primary;

    return (
      <TouchableOpacity
        key={`header-${group.key}`}
        style={styles.groupHeader}
        onPress={() => toggleGroup(group.key)}
        activeOpacity={0.7}
      >
        <View style={[styles.groupAccentBar, { backgroundColor: accentColor }]} />
        <View style={styles.groupHeaderContent}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          <View style={[styles.groupCountBadge, { backgroundColor: accentColor + '18' }]}>
            <Text style={[styles.groupCountText, { color: accentColor }]}>{group.data.length}</Text>
          </View>
        </View>
        <View style={[styles.groupChevronWrap, { backgroundColor: accentColor + '12' }]}>
          <ChevronDown
            size={16}
            color={accentColor}
            style={isCollapsed ? { transform: [{ rotate: '-90deg' }] } : undefined}
          />
        </View>
      </TouchableOpacity>
    );
  }, [collapsedGroups, toggleGroup]);

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        {filter === 'archived' ? (
          <Archive size={40} color={Colors.textTertiary} />
        ) : (
          <CircleCheck size={40} color={Colors.primary} />
        )}
      </View>
      <Text style={styles.emptyTitle}>
        {filter === 'all'
          ? 'No tasks yet'
          : filter === 'completed'
          ? 'Nothing completed yet'
          : filter === 'archived'
          ? 'No archived tasks'
          : `No ${filter} tasks`}
      </Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'all'
          ? 'Add your first maintenance task to get started'
          : filter === 'archived'
          ? 'Completed tasks can be archived from the task detail page'
          : 'Check back later'}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScreenHeader title="To-Do" subtitle="Stay on top of your home care" />

      <View style={styles.toolbarRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
        >
          {filters.map((f) => {
            const count = filterCounts[f.key];
            if (f.key === 'archived' && count === 0) return null;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
                onPress={() => {
                  setFilter(f.key);
                  lightImpact();
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                  {f.label}
                </Text>
                <View style={[styles.filterBadge, filter === f.key && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, filter === f.key && styles.filterBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.sortPillRow}>
        {(['item', 'importance', 'week'] as SortMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[styles.sortPill, sortMode === mode && styles.sortPillActive]}
            onPress={() => {
              setSortMode(mode);
              lightImpact();
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.sortPillText, sortMode === mode && styles.sortPillTextActive]}>
              {mode === 'item' ? 'Item' : mode === 'importance' ? 'Importance' : 'Week'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredTasks.length === 0 ? (
        <ScrollView contentContainerStyle={styles.list}>
          {renderEmpty()}
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {groupedTasks.map((group) => {
            const isCollapsed = collapsedGroups[group.key] ?? false;
            return (
              <View key={group.key} style={styles.groupContainer}>
                {renderGroupHeader(group)}
                {!isCollapsed && (
                  <View style={styles.groupContent}>
                    {group.data.map((task) => renderTaskCard(task))}
                  </View>
                )}
              </View>
            );
          })}

          {filter === 'all' && completedTasksList.length > 0 && (
            <View style={styles.completedSection}>
              <View style={styles.completedDivider} />
              <TouchableOpacity
                style={styles.completedHeader}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  lightImpact();
                  setCompletedCollapsed((prev) => !prev);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.completedHeaderLeft}>
                  <View style={styles.completedIconWrap}>
                    <CircleCheck size={16} color={Colors.success} />
                  </View>
                  <Text style={styles.completedHeaderTitle}>Completed</Text>
                  <View style={styles.completedCountBadge}>
                    <Text style={styles.completedCountText}>{completedTasksList.length}</Text>
                  </View>
                </View>
                <View style={styles.completedChevronWrap}>
                  <ChevronDown
                    size={16}
                    color={Colors.success}
                    style={completedCollapsed ? { transform: [{ rotate: '-90deg' }] } : undefined}
                  />
                </View>
              </TouchableOpacity>
              {!completedCollapsed && (
                <View style={styles.completedContent}>
                  {completedTasksList.map((task) => renderTaskCard(task))}
                </View>
              )}
            </View>
          )}

          <View style={{ height: 90 }} />
        </ScrollView>
      )}

      <FloatingActionButton
        onPress={() => {
          mediumImpact();
          router.push('/add-task' as any);
        }}
        color={c.primary}
        testID="schedule-add-task"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterScroll: {
    flexGrow: 0,
    flex: 1,
  },
  filterRow: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  filterTextActive: {
    color: Colors.white,
  },
  filterBadge: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    lineHeight: 15,
  },
  filterBadgeTextActive: {
    color: Colors.white,
  },
  sortPillRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  sortPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sortPillText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  sortPillTextActive: {
    color: Colors.white,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  groupContainer: {
    marginBottom: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  groupAccentBar: {
    width: 4,
    height: 28,
    borderRadius: 2,
    marginRight: 12,
  },
  groupHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    lineHeight: 20,
  },
  groupCountBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  groupCountText: {
    fontSize: 12,
    fontWeight: '700' as const,
    lineHeight: 16,
  },
  groupChevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupContent: {
    paddingLeft: 4,
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 1,
  },
  taskCardOverdue: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger,
  },
  taskCardCompleted: {
    backgroundColor: Colors.successLight,
  },
  taskCardArchived: {
    backgroundColor: Colors.surfaceAlt,
    opacity: 0.8,
  },
  taskLeft: {
    marginRight: 14,
    paddingTop: 2,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleOverdue: {
    borderColor: Colors.danger,
  },
  checkCircleDone: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleArchived: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskBody: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 3,
    lineHeight: 20,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  taskTitleArchived: {
    color: Colors.textTertiary,
  },
  taskDesc: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginBottom: 8,
    lineHeight: 16,
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  taskDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskDateText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textTertiary,
  },
  taskApplianceName: {
    fontSize: 11,
    color: Colors.textTertiary,
    lineHeight: 15,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recurringText: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: Colors.primary,
    lineHeight: 14,
  },
  taskRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: 8,
  },
  priorityTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'capitalize' as const,
    lineHeight: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    lineHeight: 26,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 20,
  },
  completedSection: {
    marginTop: 8,
  },
  completedDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 14,
    marginHorizontal: 4,
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  completedHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  completedIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.success + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedHeaderTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.success,
    lineHeight: 20,
  },
  completedCountBadge: {
    backgroundColor: Colors.success + '18',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  completedCountText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.success,
    lineHeight: 16,
  },
  completedChevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.success + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedContent: {
    paddingLeft: 4,
  },
});
