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
  ChevronUp,
  Calendar,
  AlertTriangle,
  Layers,
  Download,
  Mail,
  FileDown,
  Share2,
  Printer,
} from 'lucide-react-native';
import { File, Paths } from 'expo-file-system';
import { shareAsync, isAvailableAsync } from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import * as Print from 'expo-print';
import { useHome } from '@/contexts/HomeContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ColorScheme } from '@/constants/colors';
import PressableCard from '@/components/PressableCard';
import FloatingActionButton from '@/components/FloatingActionButton';
import ScreenHeader from '@/components/ScreenHeader';
import { formatRelativeDate, formatShortDate, getWeekEndingSaturday, formatWeekEnding } from '@/utils/dates';
import { lightImpact, mediumImpact, successNotification } from '@/utils/haptics';
import { formatShortDate as fmtDate } from '@/utils/dates';
import { getPriorityColor, getPriorityBgColor } from '@/constants/priorities';
import { MaintenanceTask, TaskPriority } from '@/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function escapeCSVField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
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

function generateTaskCSV(tasks: MaintenanceTask[], prosMap: Record<string, string>): string {
  const allRows = buildTaskRows(tasks, prosMap);
  return allRows.map((row) => row.map(escapeCSVField).join(',')).join('\r\n');
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
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortMode, setSortMode] = useState<SortMode>('item');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [completedCollapsed, setCompletedCollapsed] = useState<boolean>(true);
  const [exportExpanded, setExportExpanded] = useState<boolean>(false);
  const exportAnim = useRef(new Animated.Value(0)).current;

  const prosMap = useMemo(() => {
    const map: Record<string, string> = {};
    trustedPros.forEach((p) => { map[p.id] = p.name; });
    return map;
  }, [trustedPros]);

  const toggleExport = useCallback(() => {
    lightImpact();
    const toValue = exportExpanded ? 0 : 1;
    setExportExpanded(!exportExpanded);
    Animated.timing(exportAnim, {
      toValue,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [exportExpanded, exportAnim]);

  const allExportTasks = useMemo(() => tasks.filter((t) => t.status !== 'archived'), [tasks]);

  const buildHtmlTable = useCallback((items: MaintenanceTask[]): string => {
    const rows = buildTaskRows(items, prosMap);
    const headers = rows[0];
    const dataRows = rows.slice(1);
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const totalCost = items.reduce((sum, t) => sum + (t.estimatedCost ?? 0), 0);

    return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  body { font-family: -apple-system, Helvetica Neue, Arial, sans-serif; padding: 24px; color: #1a1a2e; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .subtitle { color: #6b7280; font-size: 13px; margin-bottom: 20px; }
  .summary { display: flex; gap: 24px; margin-bottom: 20px; }
  .summary-item { background: #f3f4f6; border-radius: 8px; padding: 12px 16px; }
  .summary-label { font-size: 11px; color: #6b7280; text-transform: uppercase; }
  .summary-value { font-size: 18px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #1a1a2e; color: #fff; padding: 8px 10px; text-align: left; font-weight: 600; }
  td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
  tr:nth-child(even) td { background: #f9fafb; }
  .footer { margin-top: 16px; font-size: 10px; color: #9ca3af; text-align: center; }
</style>
</head>
<body>
  <h1>HomeEQ To-Do Report</h1>
  <p class="subtitle">Generated ${dateStr} &bull; ${dataRows.length} task${dataRows.length !== 1 ? 's' : ''}</p>
  <div class="summary">
    <div class="summary-item"><div class="summary-label">Total Tasks</div><div class="summary-value">${dataRows.length}</div></div>
    <div class="summary-item"><div class="summary-label">Est. Cost</div><div class="summary-value">${totalCost.toLocaleString()}</div></div>
  </div>
  <table>
    <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${dataRows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
  </table>
  <p class="footer">HomeEQ &mdash; Home Maintenance Tracker</p>
</body>
</html>`;
  }, [prosMap]);

  const handleEmail = useCallback(async () => {
    mediumImpact();
    if (allExportTasks.length === 0) {
      Alert.alert('No Data', 'There are no tasks to email yet.');
      return;
    }
    try {
      const csvContent = generateTaskCSV(allExportTasks, prosMap);
      const fileName = `HomeEQ_ToDo_${new Date().toISOString().split('T')[0]}.csv`;

      if (Platform.OS === 'web') {
        const mailtoBody = encodeURIComponent(`HomeEQ To-Do Report\n\nPlease find the task data below:\n\n${csvContent}`);
        const mailtoSubject = encodeURIComponent(`HomeEQ To-Do Report - ${new Date().toLocaleDateString()}`);
        window.open(`mailto:?subject=${mailtoSubject}&body=${mailtoBody}`, '_blank');
        successNotification();
        return;
      }

      const file = new File(Paths.cache, fileName);
      file.write(csvContent);
      console.log('[Email] CSV file written to:', file.uri);

      const isAvailable = await MailComposer.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Mail Unavailable', 'No email account is configured on this device. Please set up an email account in Settings.');
        return;
      }

      await MailComposer.composeAsync({
        subject: `HomeEQ To-Do Report - ${new Date().toLocaleDateString()}`,
        body: `<p>Please find attached the HomeEQ to-do report with ${allExportTasks.length} task${allExportTasks.length !== 1 ? 's' : ''}.</p>`,
        isHtml: true,
        attachments: [file.uri],
      });
      successNotification();
      console.log('[Email] Mail composer opened successfully');
    } catch (e: any) {
      console.error('[Email] Error:', e?.message || e);
      Alert.alert('Email Error', 'Something went wrong while preparing the email. Please try again.');
    }
  }, [allExportTasks, prosMap]);

  const handlePDF = useCallback(async () => {
    mediumImpact();
    if (allExportTasks.length === 0) {
      Alert.alert('No Data', 'There are no tasks to export yet.');
      return;
    }
    try {
      const html = buildHtmlTable(allExportTasks);

      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.print();
        }
        successNotification();
        return;
      }

      const { uri } = await Print.printToFileAsync({ html });
      console.log('[PDF] File saved to:', uri);

      const canShare = await isAvailableAsync();
      if (canShare) {
        await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        successNotification();
        console.log('[PDF] Shared successfully');
      } else {
        Alert.alert('PDF Ready', 'PDF has been saved but sharing is not available on this device.');
      }
    } catch (e: any) {
      console.error('[PDF] Error:', e?.message || e);
      Alert.alert('PDF Error', 'Something went wrong while creating the PDF. Please try again.');
    }
  }, [allExportTasks, buildHtmlTable]);

  const handleCSV = useCallback(async () => {
    mediumImpact();
    if (allExportTasks.length === 0) {
      Alert.alert('No Data', 'There are no tasks to export yet.');
      return;
    }
    try {
      const csvContent = generateTaskCSV(allExportTasks, prosMap);
      const fileName = `HomeEQ_ToDo_${new Date().toISOString().split('T')[0]}.csv`;

      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        successNotification();
        console.log('[CSV] Web download triggered');
        return;
      }

      const file = new File(Paths.cache, fileName);
      file.write(csvContent);
      console.log('[CSV] File written to:', file.uri);

      const canShare = await isAvailableAsync();
      if (canShare) {
        await shareAsync(file.uri, { UTI: 'public.comma-separated-values-text', mimeType: 'text/csv' });
        successNotification();
        console.log('[CSV] Shared successfully');
      } else {
        Alert.alert('CSV Ready', 'CSV has been saved but sharing is not available on this device.');
      }
    } catch (e: any) {
      console.error('[CSV] Error:', e?.message || e);
      Alert.alert('CSV Error', 'Something went wrong while creating the CSV. Please try again.');
    }
  }, [allExportTasks, prosMap]);

  const handlePrint = useCallback(async () => {
    mediumImpact();
    if (allExportTasks.length === 0) {
      Alert.alert('No Data', 'There are no tasks to print yet.');
      return;
    }
    try {
      const html = buildHtmlTable(allExportTasks);

      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.print();
        }
        return;
      }

      await Print.printAsync({ html });
      successNotification();
      console.log('[Print] Print dialog opened successfully');
    } catch (e: any) {
      console.error('[Print] Error:', e?.message || e);
      Alert.alert('Print Error', 'Something went wrong while printing. Please try again.');
    }
  }, [allExportTasks, buildHtmlTable]);

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

          <View style={styles.exportSection}>
            <TouchableOpacity
              style={styles.exportHeader}
              onPress={toggleExport}
              activeOpacity={0.7}
              testID="todo-export-toggle"
            >
              <View style={styles.exportHeaderLeft}>
                <View style={[styles.exportHeaderIcon, { backgroundColor: c.primaryLight }]}>
                  <Download size={18} color={c.primary} />
                </View>
                <View>
                  <Text style={styles.exportHeaderTitle}>Export</Text>
                  <Text style={styles.exportHeaderSubtitle}>Download your to-do data</Text>
                </View>
              </View>
              {exportExpanded ? (
                <ChevronUp size={20} color={c.textTertiary} />
              ) : (
                <ChevronDown size={20} color={c.textTertiary} />
              )}
            </TouchableOpacity>

            {exportExpanded && (
              <View style={styles.exportGrid}>
                <TouchableOpacity
                  style={styles.exportGridItem}
                  onPress={handleEmail}
                  activeOpacity={0.7}
                  testID="todo-export-email"
                >
                  <View style={[styles.exportGridIcon, { backgroundColor: '#EEF2FF' }]}>
                    <Mail size={22} color="#4F46E5" />
                  </View>
                  <Text style={styles.exportGridTitle}>Email</Text>
                  <Text style={styles.exportGridDesc}>Send as attachment</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.exportGridItem}
                  onPress={handlePDF}
                  activeOpacity={0.7}
                  testID="todo-export-pdf"
                >
                  <View style={[styles.exportGridIcon, { backgroundColor: '#FEF2F2' }]}>
                    <FileDown size={22} color="#DC2626" />
                  </View>
                  <Text style={styles.exportGridTitle}>PDF</Text>
                  <Text style={styles.exportGridDesc}>Save or share</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.exportGridItem}
                  onPress={handleCSV}
                  activeOpacity={0.7}
                  testID="todo-export-csv"
                >
                  <View style={[styles.exportGridIcon, { backgroundColor: '#FFF7ED' }]}>
                    <Share2 size={22} color="#EA580C" />
                  </View>
                  <Text style={styles.exportGridTitle}>CSV</Text>
                  <Text style={styles.exportGridDesc}>Spreadsheet data</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.exportGridItem}
                  onPress={handlePrint}
                  activeOpacity={0.7}
                  testID="todo-export-print"
                >
                  <View style={[styles.exportGridIcon, { backgroundColor: '#F0FDF4' }]}>
                    <Printer size={22} color="#16A34A" />
                  </View>
                  <Text style={styles.exportGridTitle}>Print</Text>
                  <Text style={styles.exportGridDesc}>AirPrint</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

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
