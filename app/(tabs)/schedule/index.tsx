import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Check,
  Clock,
  RefreshCw,
  CircleCheck,
  Archive,
  ChevronRight,
  ChevronDown,
} from 'lucide-react-native';
import { useHome } from '@/contexts/HomeContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ColorScheme } from '@/constants/colors';
import PressableCard from '@/components/PressableCard';
import FloatingActionButton from '@/components/FloatingActionButton';
import ScreenHeader from '@/components/ScreenHeader';
import ExportSection from '@/components/ExportSection';
import { formatRelativeDate, formatShortDate, getWeekEndingSaturday, formatWeekEnding, parseLocalDate } from '@/utils/dates';
import { lightImpact, mediumImpact, successNotification } from '@/utils/haptics';
import { rowsToCSV, buildHtmlReport } from '@/utils/export';
import { getPriorityColor, getPriorityBgColor } from '@/constants/priorities';
import { MaintenanceTask, TaskPriority } from '@/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function buildTaskRows(tasks: MaintenanceTask[], prosMap: Record<string, string>): string[][] {
  const headers = [
    'To-Do Item',
    'Description',
    'Date',
    'Cost',
    'Repeats',
    'Product Link',
    'Trusted Pro',
    'Notes',
  ];
  const rows = tasks.map((t) => [
    t.title || '',
    t.description || '',
    t.dueDate || '',
    t.estimatedCost != null ? t.estimatedCost.toFixed(2) : '',
    t.recurring ? (t.recurringInterval ? `Every ${t.recurringInterval} days` : 'Yes') : 'No',
    t.productLink || '',
    t.trustedProId ? (prosMap[t.trustedProId] || '') : '',
    (t.notes ?? []).join('; '),
  ]);
  return [headers, ...rows];
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
  const date = parseLocalDate(dateStr);
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

function getWeekAccentColor(key: string, tc: ColorScheme): string {
  if (key === 'overdue') return tc.danger;

  const now = new Date();
  const thisSaturday = getWeekEndingSaturday(now.toISOString());
  const satDate = new Date(key + 'T00:00:00');
  const diffWeeks = Math.round((satDate.getTime() - thisSaturday.getTime()) / (7 * 24 * 60 * 60 * 1000));

  if (diffWeeks <= 0) return tc.primary;
  if (diffWeeks === 1) return tc.accent;
  if (diffWeeks === 2) return tc.warning;
  if (diffWeeks === 3) return tc.categoryInspection;
  return tc.textTertiary;
}

function getImportanceAccentColor(priority: TaskPriority): string {
  return getPriorityColor(priority);
}

export default function ScheduleScreen() {
  const router = useRouter();
  const { colors: c } = useTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const { tasks, appliances, completeTask, trustedPros } = useHome();
  const params = useLocalSearchParams<{ filter?: string }>();
  const [filter, setFilter] = useState<FilterType>(() => {
    const validFilters: FilterType[] = ['all', 'upcoming', 'overdue', 'completed', 'archived'];
    if (params.filter && validFilters.includes(params.filter as FilterType)) {
      return params.filter as FilterType;
    }
    return 'all';
  });
  const [sortMode, setSortMode] = useState<SortMode>('item');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [completedCollapsed, setCompletedCollapsed] = useState<boolean>(true);
  const prosMap = useMemo(() => {
    const map: Record<string, string> = {};
    trustedPros.forEach((p) => { map[p.id] = p.name; });
    return map;
  }, [trustedPros]);

  const allExportTasks = useMemo(() => tasks.filter((t) => t.status !== 'archived'), [tasks]);

  const getExportCSV = useCallback(() => {
    return rowsToCSV(buildTaskRows(allExportTasks, prosMap));
  }, [allExportTasks, prosMap]);

  const getExportHTML = useCallback(() => {
    const rows = buildTaskRows(allExportTasks, prosMap);
    const totalCost = allExportTasks.reduce((sum, t) => sum + (t.estimatedCost ?? 0), 0);
    return buildHtmlReport({
      title: 'HomeEQ To-Do Report',
      headers: rows[0],
      dataRows: rows.slice(1),
      summaryItems: [
        { label: 'Total Tasks', value: `${allExportTasks.length}` },
        { label: 'Est. Cost', value: `${totalCost.toLocaleString()}` },
      ],
      footerLabel: 'HomeEQ &mdash; Home Maintenance Tracker',
    });
  }, [allExportTasks, prosMap]);

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
          accentColor: getWeekAccentColor(key, c),
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
        accentColor: key === '__general__' ? c.textSecondary : c.primary,
        data: value.tasks.sort((a, b) => a.title.localeCompare(b.title)),
      }));
  }, [filteredTasks, sortMode, appliances, c]);

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
              <Archive size={12} color={c.textTertiary} />
            </View>
          ) : !isCompleted ? (
            <TouchableOpacity
              style={[styles.checkCircle, isOverdue && styles.checkCircleOverdue]}
              onPress={() => handleComplete(task.id, task.title)}
              activeOpacity={0.6}
            >
              <Check size={14} color={isOverdue ? c.danger : c.textTertiary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.checkCircleDone}>
              <Check size={14} color={c.white} />
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
              <Clock size={11} color={isOverdue ? c.danger : c.textSecondary} />
              <Text style={[styles.taskDateText, isOverdue && { color: c.danger }]}>
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
                <RefreshCw size={9} color={c.primary} />
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
          <ChevronRight size={14} color={c.textTertiary} style={{ marginTop: 6 }} />
        </View>
      </PressableCard>
    );
  }, [appliances, handleComplete, handleTaskPress, styles, c]);

  const renderGroupHeader = useCallback((group: TaskGroup) => {
    const isCollapsed = collapsedGroups[group.key] ?? false;
    const accentColor = group.accentColor ?? c.primary;

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
  }, [collapsedGroups, toggleGroup, styles, c]);

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        {filter === 'archived' ? (
          <Archive size={40} color={c.textTertiary} />
        ) : (
          <CircleCheck size={40} color={c.primary} />
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
    <View style={styles.container}>
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
                    <CircleCheck size={16} color={c.success} />
                  </View>
                  <Text style={styles.completedHeaderTitle}>Completed</Text>
                  <View style={styles.completedCountBadge}>
                    <Text style={styles.completedCountText}>{completedTasksList.length}</Text>
                  </View>
                </View>
                <View style={styles.completedChevronWrap}>
                  <ChevronDown
                    size={16}
                    color={c.success}
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

          <ExportSection
            getCSV={getExportCSV}
            getHTML={getExportHTML}
            filePrefix="HomeEQ_ToDo"
            entityName="tasks"
            entityCount={allExportTasks.length}
            emailSubject={`HomeEQ To-Do Report - ${new Date().toLocaleDateString()}`}
            emailBodyHtml={`<p>Please find attached the HomeEQ to-do report with ${allExportTasks.length} task${allExportTasks.length !== 1 ? 's' : ''}.</p>`}
            subtitle="Download your to-do data"
            testIDPrefix="todo-export"
          />

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

const createStyles = (c: ColorScheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
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
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  filterChipActive: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: c.textSecondary,
    lineHeight: 17,
  },
  filterTextActive: {
    color: c.white,
  },
  filterBadge: {
    backgroundColor: c.surfaceAlt,
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
    color: c.textSecondary,
    lineHeight: 15,
  },
  filterBadgeTextActive: {
    color: c.white,
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
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  sortPillActive: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  sortPillText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: c.textSecondary,
    lineHeight: 17,
  },
  sortPillTextActive: {
    color: c.white,
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
    backgroundColor: c.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    shadowColor: c.cardShadow,
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
    color: c.text,
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
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: c.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 1,
  },
  taskCardOverdue: {
    borderLeftWidth: 3,
    borderLeftColor: c.danger,
  },
  taskCardCompleted: {
    backgroundColor: c.successLight,
  },
  taskCardArchived: {
    backgroundColor: c.surfaceAlt,
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
    borderColor: c.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleOverdue: {
    borderColor: c.danger,
  },
  checkCircleDone: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: c.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleArchived: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: c.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskBody: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: c.text,
    marginBottom: 3,
    lineHeight: 20,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: c.textSecondary,
  },
  taskTitleArchived: {
    color: c.textTertiary,
  },
  taskDesc: {
    fontSize: 12,
    color: c.textTertiary,
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
    color: c.textSecondary,
    lineHeight: 16,
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: c.textTertiary,
  },
  taskApplianceName: {
    fontSize: 11,
    color: c.textTertiary,
    lineHeight: 15,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: c.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recurringText: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: c.primary,
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
    backgroundColor: c.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: c.text,
    lineHeight: 26,
  },
  emptySubtitle: {
    fontSize: 15,
    color: c.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 20,
  },
  completedSection: {
    marginTop: 8,
  },
  completedDivider: {
    height: 1,
    backgroundColor: c.border,
    marginBottom: 14,
    marginHorizontal: 4,
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.successLight,
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
    backgroundColor: c.success + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedHeaderTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: c.success,
    lineHeight: 20,
  },
  completedCountBadge: {
    backgroundColor: c.success + '18',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  completedCountText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: c.success,
    lineHeight: 16,
  },
  completedChevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: c.success + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedContent: {
    paddingLeft: 4,
  },
  exportSection: {
    marginTop: 16,
    marginBottom: 8,
  },
  exportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: c.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 1,
  },
  exportHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  exportHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportHeaderTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: c.text,
    lineHeight: 21,
  },
  exportHeaderSubtitle: {
    fontSize: 12,
    color: c.textTertiary,
    lineHeight: 16,
    marginTop: 1,
  },
  exportGrid: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  exportGridItem: {
    width: '48%' as any,
    backgroundColor: c.surface,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: c.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  exportGridIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  exportGridTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: c.text,
    lineHeight: 18,
    textAlign: 'center' as const,
  },
  exportGridDesc: {
    fontSize: 11,
    color: c.textTertiary,
    lineHeight: 15,
    marginTop: 2,
    textAlign: 'center' as const,
  },
});
