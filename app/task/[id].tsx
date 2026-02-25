import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Switch,
  LayoutAnimation,
  Linking as RNLinking,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  Clock,
  Check,
  RefreshCw,
  DollarSign,
  Archive,
  ArchiveRestore,
  Trash2,
  ChevronRight,
  StickyNote,
  Send,
  X,
  AlertTriangle,
  CalendarDays,
  Wrench,
  CircleCheck,
  Pencil,
  Link,
  ExternalLink,
  Plus,
  ShoppingCart,
  Save,
  UserCheck,
  Search,
  Phone,
  Star,
  XCircle,
  CalendarPlus,
  Bell,
  CalendarCheck,
  BellRing,
  ChevronDown,
  Play,
  Youtube,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useHome } from '@/contexts/HomeContext';
import { TaskPriority } from '@/types';
import { PRIORITIES } from '@/constants/priorities';
import formStyles from '@/constants/formStyles';
import { formatLongDate, formatRelativeDate } from '@/utils/dates';
import { lightImpact } from '@/utils/haptics';
import { isCalendarAvailable, isRemindersAvailable } from '@/utils/calendar';
import { ActivityIndicator } from 'react-native';
import LinkPreview from '@/components/LinkPreview';
import ApplianceChipSelector from '@/components/ApplianceChipSelector';
import { useTaskDetail } from '@/hooks/useTaskDetail';
import createStyles from '@/styles/taskDetail';

interface CollapsibleProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  rightElement?: React.ReactNode;
  colors: typeof import('@/constants/colors').LightColors;
}

function CollapsibleSection({ title, icon, children, defaultOpen, rightElement, colors: c, globalDefault }: CollapsibleProps & { globalDefault?: boolean }) {
  const resolvedDefault = defaultOpen !== undefined ? defaultOpen : (globalDefault ?? true);
  const [isOpen, setIsOpen] = useState<boolean>(resolvedDefault);
  const rotateAnim = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen((prev) => !prev);
    Animated.timing(rotateAnim, {
      toValue: isOpen ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isOpen, rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-90deg', '0deg'],
  });

  return (
    <View style={{
      backgroundColor: c.surface,
      borderRadius: 14,
      marginBottom: 16,
      shadowColor: c.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 6,
      elevation: 1,
      overflow: 'hidden',
    }}>
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          gap: 6,
        }}
        onPress={toggle}
        activeOpacity={0.6}
      >
        {icon}
        <Text style={{ fontSize: 15, fontWeight: '600' as const, color: c.text, lineHeight: 20, flex: 1 }}>{title}</Text>
        {rightElement && isOpen ? rightElement : null}
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <ChevronDown size={16} color={c.textSecondary} />
        </Animated.View>
      </TouchableOpacity>
      {isOpen && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 0 }}>
          {children}
        </View>
      )}
    </View>
  );
}

interface YouTubeVideoCard {
  query: string;
  label: string;
}


export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors: c } = useTheme();
  const { sectionsDefaultOpen } = useHome();
  const styles = useMemo(() => createStyles(c), [c]);
  const {
    task,
    appliance,
    linkedPro,
    appliances,
    trustedPros,
    handleComplete,
    handleArchive,
    handleUnarchive,
    handleDelete,
    handleAddNote,
    handleRemoveNote,
    handleSaveLink,
    handleRemoveLink,
    handleAssignPro,
    handleRemovePro,
    handleSaveEdit,
    handleAddToCalendar,
    handleRemoveFromCalendar,
    handleAddToReminders,
    handleRemoveFromReminders,
    calendarLoading,
    reminderLoading,
  } = useTaskDetail(id);

  const [showProPicker, setShowProPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPriority, setEditPriority] = useState<TaskPriority>('medium');
  const [editEstimatedCost, setEditEstimatedCost] = useState('');
  const [editRecurring, setEditRecurring] = useState(false);
  const [editRecurringInterval, setEditRecurringInterval] = useState('30');
  const [editApplianceId, setEditApplianceId] = useState('');

  const [newNote, setNewNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkValue, setLinkValue] = useState('');
  const [isEditingLink, setIsEditingLink] = useState(false);
  const noteInputAnim = useRef(new Animated.Value(0)).current;
  const linkInputAnim = useRef(new Animated.Value(0)).current;

  const startEditing = useCallback(() => {
    if (!task) return;
    setEditTitle(task.title);
    setEditDescription(task.description ?? '');
    setEditDueDate(task.dueDate);
    setEditPriority(task.priority);
    setEditEstimatedCost(task.estimatedCost != null ? task.estimatedCost.toString() : '');
    setEditRecurring(task.recurring);
    setEditRecurringInterval(task.recurringInterval?.toString() ?? '30');
    setEditApplianceId(task.applianceId ?? '');
    setIsEditing(true);
    lightImpact();
  }, [task]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  const onSaveEdit = useCallback(() => {
    const success = handleSaveEdit({
      title: editTitle,
      description: editDescription,
      dueDate: editDueDate,
      priority: editPriority,
      estimatedCost: editEstimatedCost,
      recurring: editRecurring,
      recurringInterval: editRecurringInterval,
      applianceId: editApplianceId,
    });
    if (success) setIsEditing(false);
  }, [handleSaveEdit, editTitle, editDescription, editDueDate, editPriority, editEstimatedCost, editRecurring, editRecurringInterval, editApplianceId]);

  const toggleLinkInput = useCallback(() => {
    if (showLinkInput) {
      Animated.timing(linkInputAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        setShowLinkInput(false);
        setIsEditingLink(false);
      });
    } else {
      setLinkValue(task?.productLink ?? '');
      setIsEditingLink(!!task?.productLink);
      setShowLinkInput(true);
      Animated.timing(linkInputAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }
  }, [showLinkInput, linkInputAnim, task?.productLink]);

  const onSaveLink = useCallback(() => {
    const trimmed = linkValue.trim();
    handleSaveLink(trimmed || undefined);
    setLinkValue('');
    Animated.timing(linkInputAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      setShowLinkInput(false);
      setIsEditingLink(false);
    });
  }, [linkValue, handleSaveLink, linkInputAnim]);

  const handleOpenLink = useCallback(() => {
    if (!task?.productLink) return;
    console.log('[TaskDetail] Opening product link:', task.productLink);
    RNLinking.openURL(task.productLink).catch((err) => {
      console.error('[TaskDetail] Failed to open link:', err);
      Alert.alert('Error', 'Could not open this link. Please check the URL.');
    });
  }, [task?.productLink]);

  const amazonSearchUrl = useMemo(() => {
    if (!task) return '';
    const parts: string[] = [];
    if (appliance?.name) parts.push(appliance.name);
    if (appliance?.brand) parts.push(appliance.brand);
    parts.push(task.title);
    const query = parts.join(' ').replace(/\s+/g, ' ').trim();
    return `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;
  }, [task, appliance]);

  const handleSearchAmazon = useCallback(() => {
    console.log('[TaskDetail] Opening Amazon search:', amazonSearchUrl);
    lightImpact();
    RNLinking.openURL(amazonSearchUrl).catch((err) => {
      console.error('[TaskDetail] Failed to open Amazon:', err);
      Alert.alert('Error', 'Could not open Amazon. Please try again.');
    });
  }, [amazonSearchUrl]);

  const youtubeVideos = useMemo<YouTubeVideoCard[]>(() => {
    if (!task) return [];
    const items: YouTubeVideoCard[] = [];
    const appName = appliance?.name ?? '';
    const appBrand = appliance?.brand ?? '';
    const appModel = appliance?.model ?? '';

    const primary = ['How to', task.title, appBrand, appName].filter(Boolean).join(' ');
    items.push({ query: primary, label: `How to ${task.title}` });

    if (appBrand && appModel) {
      const specific = [appBrand, appModel, task.title, 'tutorial'].filter(Boolean).join(' ');
      items.push({ query: specific, label: `${appBrand} ${appModel} guide` });
    }

    const diy = ['DIY', task.title, appName, 'step by step'].filter(Boolean).join(' ');
    items.push({ query: diy, label: `DIY ${task.title} walkthrough` });

    return items;
  }, [task, appliance]);

  const handleOpenYouTube = useCallback((query: string) => {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    console.log('[TaskDetail] Opening YouTube search:', url);
    lightImpact();
    RNLinking.openURL(url).catch((err) => {
      console.error('[TaskDetail] Failed to open YouTube:', err);
      Alert.alert('Error', 'Could not open YouTube. Please try again.');
    });
  }, []);

  const toggleNoteInput = useCallback(() => {
    if (showNoteInput) {
      Animated.timing(noteInputAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => setShowNoteInput(false));
    } else {
      setShowNoteInput(true);
      Animated.timing(noteInputAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }
  }, [showNoteInput, noteInputAnim]);

  const onAddNote = useCallback(() => {
    if (!newNote.trim()) return;
    handleAddNote(newNote);
    setNewNote('');
  }, [newNote, handleAddNote]);

  const handleNavigateToAppliance = useCallback(() => {
    if (appliance) {
      router.push(`/appliance/${appliance.id}` as any);
    }
  }, [appliance, router]);

  const onAssignPro = useCallback((pro: typeof trustedPros[number]) => {
    handleAssignPro(pro);
    setShowProPicker(false);
  }, [handleAssignPro]);

  const handleNavigateToPro = useCallback(() => {
    if (linkedPro) {
      router.push(`/provider/${linkedPro.id}` as any);
    }
  }, [linkedPro, router]);

  const handleFindAPro = useCallback(() => {
    router.push('/trusted-pros' as any);
  }, [router]);

  if (!task) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Task' }} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Task not found</Text>
        </View>
      </View>
    );
  }

  const isCompleted = task.status === 'completed';
  const isArchived = task.status === 'archived';
  const isOverdue = task.status === 'overdue';

  const priorityConfig = {
    low: { color: c.textTertiary, bg: c.surfaceAlt, label: 'Low Priority' },
    medium: { color: c.warning, bg: c.warningLight, label: 'Medium Priority' },
    high: { color: c.danger, bg: c.dangerLight, label: 'High Priority' },
  };

  const statusConfig = {
    upcoming: { color: c.primary, bg: c.primaryLight, label: 'Upcoming', icon: Clock },
    overdue: { color: c.danger, bg: c.dangerLight, label: 'Overdue', icon: AlertTriangle },
    completed: { color: c.success, bg: c.successLight, label: 'Completed', icon: CircleCheck },
    archived: { color: c.textTertiary, bg: c.surfaceAlt, label: 'Archived', icon: Archive },
  };

  const prio = priorityConfig[task.priority];
  const stat = statusConfig[task.status];
  const StatusIcon = stat.icon;

  const noteInputHeight = noteInputAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120],
  });

  if (isEditing) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Stack.Screen
          options={{
            title: 'Edit Task',
            headerLeft: () => (
              <TouchableOpacity onPress={cancelEditing} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.headerBtn}>
                <X size={22} color={c.textSecondary} />
              </TouchableOpacity>
            ),
            headerRight: () => (
              <TouchableOpacity onPress={onSaveEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.headerBtn}>
                <Save size={20} color={c.primary} />
              </TouchableOpacity>
            ),
          }}
        />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.editContent}>
          <View style={formStyles.section}>
            <Text style={formStyles.sectionLabel}>Task</Text>
            <View style={formStyles.card}>
              <View style={formStyles.inputRow}>
                <View style={formStyles.inputContent}>
                  <Text style={formStyles.inputLabel}>Title</Text>
                  <TextInput
                    style={formStyles.textInput}
                    placeholder="Task name"
                    placeholderTextColor={c.textTertiary}
                    value={editTitle}
                    onChangeText={setEditTitle}
                    testID="edit-task-title"
                  />
                </View>
              </View>
              <View style={formStyles.divider} />
              <View style={formStyles.inputRow}>
                <View style={formStyles.inputContent}>
                  <Text style={formStyles.inputLabel}>Description (optional)</Text>
                  <TextInput
                    style={[formStyles.textInput, { minHeight: 60 }]}
                    placeholder="Any helpful notes or instructions..."
                    placeholderTextColor={c.textTertiary}
                    value={editDescription}
                    onChangeText={setEditDescription}
                    multiline
                    textAlignVertical="top"
                    testID="edit-task-description"
                  />
                </View>
              </View>
              <View style={formStyles.divider} />
              <View style={formStyles.inputRow}>
                <View style={formStyles.inputContent}>
                  <Text style={formStyles.inputLabel}>Due Date</Text>
                  <TextInput
                    style={formStyles.textInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={c.textTertiary}
                    value={editDueDate}
                    onChangeText={setEditDueDate}
                    testID="edit-task-due-date"
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={formStyles.section}>
            <Text style={formStyles.sectionLabel}>Priority</Text>
            <View style={formStyles.priorityRow}>
              {PRIORITIES.map((p) => (
                <TouchableOpacity
                  key={p.key}
                  style={[
                    formStyles.priorityChip,
                    editPriority === p.key && { backgroundColor: p.color, borderColor: p.color },
                  ]}
                  onPress={() => setEditPriority(p.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      formStyles.priorityLabel,
                      editPriority === p.key && { color: c.white },
                    ]}
                  >
                    {p.label}
                  </Text>
                  <Text
                    style={[
                      formStyles.priorityDesc,
                      editPriority === p.key && { color: 'rgba(255,255,255,0.75)' },
                    ]}
                  >
                    {p.desc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {appliances.length > 0 && (
            <View style={formStyles.section}>
              <Text style={formStyles.sectionLabel}>Related Item</Text>
              <ApplianceChipSelector
                appliances={appliances}
                selectedId={editApplianceId}
                onSelect={setEditApplianceId}
              />
            </View>
          )}

          <View style={formStyles.section}>
            <Text style={formStyles.sectionLabel}>Cost & Repeat</Text>
            <View style={formStyles.card}>
              <View style={formStyles.inputRow}>
                <View style={formStyles.inputContent}>
                  <Text style={formStyles.inputLabel}>Cost (optional)</Text>
                  <TextInput
                    style={formStyles.textInput}
                    placeholder="$0.00"
                    placeholderTextColor={c.textTertiary}
                    value={editEstimatedCost}
                    onChangeText={setEditEstimatedCost}
                    keyboardType="numeric"
                    testID="edit-task-cost"
                  />
                </View>
              </View>
              <View style={formStyles.divider} />
              <View style={formStyles.switchRow}>
                <View style={formStyles.switchContent}>
                  <Text style={formStyles.switchLabel}>Repeat this task?</Text>
                  <Text style={formStyles.switchSubtitle}>Automatically create it again when done</Text>
                </View>
                <Switch
                  value={editRecurring}
                  onValueChange={setEditRecurring}
                  trackColor={{ false: c.border, true: c.primary + '60' }}
                  thumbColor={editRecurring ? c.primary : c.textTertiary}
                />
              </View>
              {editRecurring && (
                <>
                  <View style={formStyles.divider} />
                  <View style={formStyles.inputRow}>
                    <View style={formStyles.inputContent}>
                      <Text style={formStyles.inputLabel}>Repeat every (days)</Text>
                      <TextInput
                        style={formStyles.textInput}
                        placeholder="30"
                        placeholderTextColor={c.textTertiary}
                        value={editRecurringInterval}
                        onChangeText={setEditRecurringInterval}
                        keyboardType="numeric"
                        testID="edit-task-interval"
                      />
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.editSaveBtn}
            onPress={onSaveEdit}
            activeOpacity={0.85}
            testID="save-edit-task"
          >
            <Check size={18} color={c.white} />
            <Text style={styles.editSaveBtnText}>Save Changes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editCancelBtn}
            onPress={cancelEditing}
            activeOpacity={0.85}
          >
            <Text style={styles.editCancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          title: '',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.headerBtn}>
              <X size={22} color={c.textSecondary} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              {!isArchived && (
                <TouchableOpacity onPress={startEditing} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.headerBtn}>
                  <Pencil size={18} color={c.primary} />
                </TouchableOpacity>
              )}
              {!isArchived && (
                <TouchableOpacity onPress={() => handleArchive(() => router.back())} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.headerBtn}>
                  <Archive size={20} color={c.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          ),
        }}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: stat.bg }]}>
              <StatusIcon size={13} color={stat.color} />
              <Text style={[styles.statusText, { color: stat.color }]}>{stat.label}</Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: prio.bg }]}>
              <Text style={[styles.priorityText, { color: prio.color }]}>{prio.label}</Text>
            </View>
          </View>

          <Text style={[styles.title, isCompleted && styles.titleCompleted]}>
            {task.title}
          </Text>

          {task.description ? (
            <Text style={styles.description}>{task.description}</Text>
          ) : null}
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <View style={styles.infoIconWrap}>
              <CalendarDays size={16} color={c.primary} />
            </View>
            <Text style={styles.infoLabel}>
              {isCompleted ? 'Completed' : 'Due Date'}
            </Text>
            <Text style={styles.infoValue}>
              {isCompleted && task.completedDate
                ? formatLongDate(task.completedDate)
                : formatLongDate(task.dueDate)}
            </Text>
            {!isCompleted && !isArchived && (
              <Text
                style={[
                  styles.infoSub,
                  isOverdue && { color: c.danger },
                ]}
              >
                {formatRelativeDate(task.dueDate)}
              </Text>
            )}
            {isArchived && task.archivedDate && (
              <Text style={styles.infoSub}>
                Archived {formatLongDate(task.archivedDate)}
              </Text>
            )}
          </View>

          <View style={styles.infoCard}>
            <View style={[styles.infoIconWrap, { backgroundColor: c.warningLight }]}>
              <DollarSign size={16} color={c.warning} />
            </View>
            <Text style={styles.infoLabel}>Cost</Text>
            <Text style={styles.infoValue}>
              {task.estimatedCost != null && task.estimatedCost > 0
                ? `$${task.estimatedCost.toFixed(2)}`
                : '—'}
            </Text>
          </View>

          {task.recurring && (
            <View style={styles.infoCard}>
              <View style={[styles.infoIconWrap, { backgroundColor: c.primaryLight }]}>
                <RefreshCw size={16} color={c.primary} />
              </View>
              <Text style={styles.infoLabel}>Repeats</Text>
              <Text style={styles.infoValue}>
                Every {task.recurringInterval ?? 30} days
              </Text>
            </View>
          )}
        </View>

        <CollapsibleSection
          title="Product Link"
          icon={<Link size={16} color={c.textSecondary} />}
          colors={c}
          globalDefault={sectionsDefaultOpen}
          rightElement={
            <TouchableOpacity style={styles.addLinkBtn} onPress={toggleLinkInput} activeOpacity={0.7}>
              {showLinkInput ? <X size={16} color={c.textSecondary} /> : task.productLink ? <Pencil size={14} color={c.primary} /> : <Plus size={16} color={c.primary} />}
            </TouchableOpacity>
          }
        >
          <View testID="link-section-content">
          {showLinkInput && (
            <Animated.View style={[styles.linkInputWrap, { maxHeight: linkInputAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 100] }) }]}>
              <View style={styles.linkInputCard}>
                <TextInput
                  style={styles.linkInput}
                  placeholder="https://www.example.com/product"
                  placeholderTextColor={c.textTertiary}
                  value={linkValue}
                  onChangeText={setLinkValue}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  returnKeyType="done"
                  onSubmitEditing={onSaveLink}
                  testID="task-link-input"
                />
                <TouchableOpacity
                  style={[styles.saveLinkBtn, !linkValue.trim() && !isEditingLink && styles.saveLinkBtnDisabled]}
                  onPress={onSaveLink}
                  activeOpacity={0.7}
                >
                  <Check size={16} color={(linkValue.trim() || isEditingLink) ? c.white : c.textTertiary} />
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {!showLinkInput && task.productLink ? (
            <LinkPreview url={task.productLink} onRemove={handleRemoveLink} />
          ) : !showLinkInput ? (
            <TouchableOpacity style={styles.emptyLinkPrompt} onPress={toggleLinkInput} activeOpacity={0.7}>
              <Text style={styles.emptyLinkText}>Add a product link for this task</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.amazonSearchBtn}
            onPress={handleSearchAmazon}
            activeOpacity={0.7}
            testID="task-amazon-search-btn"
          >
            <ShoppingCart size={15} color="#FF9900" />
            <Text style={styles.amazonSearchText}>Search on Amazon</Text>
            <ExternalLink size={12} color={c.textTertiary} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          </View>
        </CollapsibleSection>

        <CollapsibleSection
          title="How-To Videos"
          icon={<Youtube size={16} color="#FF0000" />}
          colors={c}
          defaultOpen={false}
          globalDefault={sectionsDefaultOpen}
        >
          <View style={styles.youtubeList}>
            {youtubeVideos.map((video, idx) => (
              <TouchableOpacity
                key={`yt-${idx}`}
                style={styles.youtubeCard}
                onPress={() => handleOpenYouTube(video.query)}
                activeOpacity={0.7}
                testID={`youtube-card-${idx}`}
              >
                <View style={styles.youtubeThumbnail}>
                  <Image
                    source={{ uri: `https://img.youtube.com/vi/default/hqdefault.jpg` }}
                    style={styles.youtubeThumbnailBg}
                    resizeMode="cover"
                  />
                  <View style={styles.youtubePlayOverlay}>
                    <View style={styles.youtubePlayBtn}>
                      <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
                    </View>
                  </View>
                  <View style={styles.youtubeRedBar} />
                </View>
                <View style={styles.youtubeCardInfo}>
                  <Text style={styles.youtubeCardTitle} numberOfLines={2}>{video.label}</Text>
                  <Text style={styles.youtubeCardSub} numberOfLines={1}>{video.query}</Text>
                  <View style={styles.youtubeSearchRow}>
                    <Search size={11} color={c.textTertiary} />
                    <Text style={styles.youtubeSearchHint}>Tap to search YouTube</Text>
                  </View>
                </View>
                <ExternalLink size={14} color={c.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.youtubeFullSearchBtn}
            onPress={() => handleOpenYouTube(youtubeVideos[0]?.query ?? task.title)}
            activeOpacity={0.7}
          >
            <Youtube size={16} color="#FF0000" />
            <Text style={styles.youtubeFullSearchText}>Search all on YouTube</Text>
            <ExternalLink size={12} color={c.textTertiary} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </CollapsibleSection>

        {appliance && (
          <TouchableOpacity style={styles.applianceCard} onPress={handleNavigateToAppliance} activeOpacity={0.7}>
            <View style={[styles.applianceIconWrap, { backgroundColor: c.accentLight }]}>
              <Wrench size={18} color={c.accent} />
            </View>
            <View style={styles.applianceInfo}>
              <Text style={styles.applianceLabel}>Related Item</Text>
              <Text style={styles.applianceName}>{appliance.name}</Text>
              <Text style={styles.applianceMeta}>
                {appliance.brand} {appliance.model ? `· ${appliance.model}` : ''}
              </Text>
            </View>
            <ChevronRight size={18} color={c.textTertiary} />
          </TouchableOpacity>
        )}

        <CollapsibleSection
          title="Trusted Pro"
          icon={<UserCheck size={16} color={c.textSecondary} />}
          colors={c}
          globalDefault={sectionsDefaultOpen}
          rightElement={
            linkedPro ? (
              <TouchableOpacity style={styles.proRemoveBtn} onPress={handleRemovePro} activeOpacity={0.7} hitSlop={8}>
                <XCircle size={16} color={c.textTertiary} />
              </TouchableOpacity>
            ) : undefined
          }
        >
          {linkedPro ? (
            <TouchableOpacity style={styles.proCard} onPress={handleNavigateToPro} activeOpacity={0.7} testID="task-linked-pro">
              <View style={styles.proAvatarWrap}>
                <UserCheck size={20} color={c.primary} />
              </View>
              <View style={styles.proCardInfo}>
                <Text style={styles.proCardName}>{linkedPro.name}</Text>
                <Text style={styles.proCardSpecialty}>{linkedPro.specialty}</Text>
                {linkedPro.phone ? (
                  <View style={styles.proCardPhoneRow}>
                    <Phone size={11} color={c.textTertiary} />
                    <Text style={styles.proCardPhone}>{linkedPro.phone}</Text>
                  </View>
                ) : null}
              </View>
              {linkedPro.ratings && linkedPro.ratings.length > 0 && (
                <View style={styles.proRatingBadge}>
                  <Star size={11} color="#F5A623" />
                  <Text style={styles.proRatingText}>{linkedPro.ratings[0].rating.toFixed(1)}</Text>
                </View>
              )}
              <ChevronRight size={16} color={c.textTertiary} />
            </TouchableOpacity>
          ) : showProPicker ? (
            <View style={styles.proPickerWrap}>
              {trustedPros.length > 0 ? (
                <>
                  <Text style={styles.proPickerLabel}>Select from your Trusted Pros</Text>
                  <ScrollView horizontal={false} nestedScrollEnabled style={styles.proPickerList} showsVerticalScrollIndicator={false}>
                    {trustedPros.map((pro) => (
                      <TouchableOpacity key={pro.id} style={styles.proPickerItem} onPress={() => onAssignPro(pro)} activeOpacity={0.7}>
                        <View style={styles.proPickerAvatar}>
                          <UserCheck size={16} color={c.primary} />
                        </View>
                        <View style={styles.proPickerInfo}>
                          <Text style={styles.proPickerName}>{pro.name}</Text>
                          <Text style={styles.proPickerSpecialty}>{pro.specialty}</Text>
                        </View>
                        <Plus size={16} color={c.primary} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity style={styles.proPickerCancelBtn} onPress={() => setShowProPicker(false)} activeOpacity={0.7}>
                    <Text style={styles.proPickerCancelText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.proPickerEmpty}>
                  <Text style={styles.proPickerEmptyText}>No trusted pros saved yet</Text>
                  <TouchableOpacity style={styles.findProBtn} onPress={handleFindAPro} activeOpacity={0.7} testID="task-find-pro-btn">
                    <Search size={15} color={c.white} />
                    <Text style={styles.findProBtnText}>Find a Pro</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.proEmptyState}>
              <Text style={styles.proEmptyText}>No pro assigned to this task</Text>
              <View style={styles.proEmptyActions}>
                {trustedPros.length > 0 && (
                  <TouchableOpacity style={styles.proSelectBtn} onPress={() => setShowProPicker(true)} activeOpacity={0.7} testID="task-select-pro-btn">
                    <UserCheck size={15} color={c.primary} />
                    <Text style={styles.proSelectBtnText}>Assign a Pro</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.findProBtn} onPress={handleFindAPro} activeOpacity={0.7} testID="task-find-pro-btn">
                  <Search size={15} color={c.white} />
                  <Text style={styles.findProBtnText}>Find a Pro</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </CollapsibleSection>

        {!isArchived && (
          <CollapsibleSection
            title="Calendar & Reminders"
            icon={<CalendarPlus size={16} color={c.textSecondary} />}
            colors={c}
            globalDefault={sectionsDefaultOpen}
          >

            {isCalendarAvailable() ? (
              <View style={styles.calendarRow}>
                {task.calendarEventId ? (
                  <View style={styles.calendarSyncedBtn}>
                    <CalendarCheck size={18} color="#2563EB" />
                    <View style={styles.calendarSyncedContent}>
                      <Text style={styles.calendarSyncedLabel}>In Calendar</Text>
                      <Text style={styles.calendarSyncedSub}>With 1-day & 1-hour alerts</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.calendarRemoveBtn}
                      onPress={handleRemoveFromCalendar}
                      hitSlop={8}
                    >
                      <XCircle size={16} color="#93B8F0" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.calendarAddBtn, calendarLoading && styles.calendarAddBtnDisabled]}
                    onPress={handleAddToCalendar}
                    activeOpacity={0.7}
                    disabled={calendarLoading}
                    testID="task-add-calendar-btn"
                  >
                    {calendarLoading ? (
                      <ActivityIndicator size="small" color={c.textSecondary} />
                    ) : (
                      <CalendarPlus size={17} color={c.text} />
                    )}
                    <Text style={styles.calendarAddBtnText}>Add to Calendar</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}

            {isRemindersAvailable() ? (
              <View style={[styles.calendarRow, styles.calendarRowLast]}>
                {task.reminderEventId ? (
                  <View style={styles.reminderSyncedBtn}>
                    <BellRing size={18} color="#D97706" />
                    <View style={styles.calendarSyncedContent}>
                      <Text style={styles.reminderSyncedLabel}>In Reminders</Text>
                      <Text style={styles.reminderSyncedSub}>Synced with Apple Reminders</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.calendarRemoveBtn}
                      onPress={handleRemoveFromReminders}
                      hitSlop={8}
                    >
                      <XCircle size={16} color="#E5C78E" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.calendarAddBtn, reminderLoading && styles.calendarAddBtnDisabled]}
                    onPress={handleAddToReminders}
                    activeOpacity={0.7}
                    disabled={reminderLoading}
                    testID="task-add-reminder-btn"
                  >
                    {reminderLoading ? (
                      <ActivityIndicator size="small" color={c.textSecondary} />
                    ) : (
                      <Bell size={17} color={c.text} />
                    )}
                    <Text style={styles.calendarAddBtnText}>Add to Reminders</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}

            {!isCalendarAvailable() && (
              <Text style={styles.calendarWebNote}>
                Calendar integration is available on mobile devices
              </Text>
            )}
          </CollapsibleSection>
        )}

        <CollapsibleSection
          title={`Notes (${task.notes?.length ?? 0})`}
          icon={<StickyNote size={16} color={c.textSecondary} />}
          colors={c}
          globalDefault={sectionsDefaultOpen}
          rightElement={
            <TouchableOpacity style={styles.addNoteBtn} onPress={toggleNoteInput} activeOpacity={0.7}>
              {showNoteInput ? <X size={16} color={c.textSecondary} /> : <Pencil size={14} color={c.primary} />}
            </TouchableOpacity>
          }
        >

          {showNoteInput && (
            <Animated.View style={[styles.noteInputWrap, { maxHeight: noteInputHeight }]}>
              <View style={styles.noteInputCard}>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Add a note..."
                  placeholderTextColor={c.textTertiary}
                  value={newNote}
                  onChangeText={setNewNote}
                  multiline
                  textAlignVertical="top"
                  testID="task-note-input"
                />
                <TouchableOpacity
                  style={[styles.sendNoteBtn, !newNote.trim() && styles.sendNoteBtnDisabled]}
                  onPress={onAddNote}
                  disabled={!newNote.trim()}
                  activeOpacity={0.7}
                >
                  <Send size={16} color={newNote.trim() ? c.white : c.textTertiary} />
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {(task.notes ?? []).length === 0 && !showNoteInput ? (
            <View style={styles.emptyNotes}>
              <Text style={styles.emptyNotesText}>No notes yet</Text>
            </View>
          ) : (
            (task.notes ?? []).map((note, idx) => (
              <View key={`note-${idx}`} style={styles.noteItem}>
                <View style={styles.noteDot} />
                <Text style={styles.noteText}>{note}</Text>
                <TouchableOpacity style={styles.noteDeleteBtn} onPress={() => handleRemoveNote(idx)} hitSlop={8}>
                  <X size={12} color={c.textTertiary} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </CollapsibleSection>

        <View style={styles.actionsSection}>
          {!isCompleted && !isArchived && (
            <TouchableOpacity style={styles.completeBtn} onPress={handleComplete} activeOpacity={0.85} testID="task-complete-btn">
              <Check size={18} color={c.white} />
              <Text style={styles.completeBtnText}>Mark as Done</Text>
            </TouchableOpacity>
          )}

          {isArchived && (
            <TouchableOpacity style={styles.restoreBtn} onPress={handleUnarchive} activeOpacity={0.85} testID="task-unarchive-btn">
              <ArchiveRestore size={18} color={c.white} />
              <Text style={styles.restoreBtnText}>Restore Task</Text>
            </TouchableOpacity>
          )}

          {!isArchived && (isCompleted || task.status === 'upcoming') && (
            <TouchableOpacity style={styles.archiveBtn} onPress={() => handleArchive(() => router.back())} activeOpacity={0.85} testID="task-archive-btn">
              <Archive size={16} color={c.textSecondary} />
              <Text style={styles.archiveBtnText}>Archive</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(() => router.back())} activeOpacity={0.85} testID="task-delete-btn">
            <Trash2 size={16} color={c.danger} />
            <Text style={styles.deleteBtnText}>Delete Task</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
