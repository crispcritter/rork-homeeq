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
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { TaskPriority } from '@/types';
import { PRIORITIES } from '@/constants/priorities';
import formStyles from '@/constants/formStyles';
import { formatLongDate, formatRelativeDate } from '@/utils/dates';
import { lightImpact } from '@/utils/haptics';
import { Linking } from 'react-native';
import LinkPreview from '@/components/LinkPreview';
import ApplianceChipSelector from '@/components/ApplianceChipSelector';
import { useTaskDetail } from '@/hooks/useTaskDetail';
import styles from '@/styles/taskDetail';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
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
    Linking.openURL(task.productLink).catch((err) => {
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
    Linking.openURL(amazonSearchUrl).catch((err) => {
      console.error('[TaskDetail] Failed to open Amazon:', err);
      Alert.alert('Error', 'Could not open Amazon. Please try again.');
    });
  }, [amazonSearchUrl]);

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
    low: { color: Colors.textTertiary, bg: Colors.surfaceAlt, label: 'Low Priority' },
    medium: { color: Colors.warning, bg: Colors.warningLight, label: 'Medium Priority' },
    high: { color: Colors.danger, bg: Colors.dangerLight, label: 'High Priority' },
  };

  const statusConfig = {
    upcoming: { color: Colors.primary, bg: Colors.primaryLight, label: 'Upcoming', icon: Clock },
    overdue: { color: Colors.danger, bg: Colors.dangerLight, label: 'Overdue', icon: AlertTriangle },
    completed: { color: Colors.success, bg: Colors.successLight, label: 'Completed', icon: CircleCheck },
    archived: { color: Colors.textTertiary, bg: Colors.surfaceAlt, label: 'Archived', icon: Archive },
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
                <X size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            ),
            headerRight: () => (
              <TouchableOpacity onPress={onSaveEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.headerBtn}>
                <Save size={20} color={Colors.primary} />
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
                    placeholderTextColor={Colors.textTertiary}
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
                    placeholderTextColor={Colors.textTertiary}
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
                    placeholderTextColor={Colors.textTertiary}
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
                      editPriority === p.key && { color: Colors.white },
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
                    placeholderTextColor={Colors.textTertiary}
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
                  trackColor={{ false: Colors.border, true: Colors.primary + '60' }}
                  thumbColor={editRecurring ? Colors.primary : Colors.textTertiary}
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
                        placeholderTextColor={Colors.textTertiary}
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
            <Check size={18} color={Colors.white} />
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
              <X size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              {!isArchived && (
                <TouchableOpacity onPress={startEditing} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.headerBtn}>
                  <Pencil size={18} color={Colors.primary} />
                </TouchableOpacity>
              )}
              {!isArchived && (
                <TouchableOpacity onPress={() => handleArchive(() => router.back())} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.headerBtn}>
                  <Archive size={20} color={Colors.textSecondary} />
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
              <CalendarDays size={16} color={Colors.primary} />
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
                  isOverdue && { color: Colors.danger },
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
            <View style={[styles.infoIconWrap, { backgroundColor: Colors.warningLight }]}>
              <DollarSign size={16} color={Colors.warning} />
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
              <View style={[styles.infoIconWrap, { backgroundColor: Colors.primaryLight }]}>
                <RefreshCw size={16} color={Colors.primary} />
              </View>
              <Text style={styles.infoLabel}>Repeats</Text>
              <Text style={styles.infoValue}>
                Every {task.recurringInterval ?? 30} days
              </Text>
            </View>
          )}
        </View>

        <View style={styles.linkSection}>
          <View style={styles.linkSectionHeader}>
            <View style={styles.linkTitleRow}>
              <Link size={16} color={Colors.textSecondary} />
              <Text style={styles.linkSectionTitle}>Product Link</Text>
            </View>
            {!showLinkInput && (
              <TouchableOpacity style={styles.addLinkBtn} onPress={toggleLinkInput} activeOpacity={0.7}>
                {task.productLink ? <Pencil size={14} color={Colors.primary} /> : <Plus size={16} color={Colors.primary} />}
              </TouchableOpacity>
            )}
            {showLinkInput && (
              <TouchableOpacity style={styles.addLinkBtn} onPress={toggleLinkInput} activeOpacity={0.7}>
                <X size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {showLinkInput && (
            <Animated.View style={[styles.linkInputWrap, { maxHeight: linkInputAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 100] }) }]}>
              <View style={styles.linkInputCard}>
                <TextInput
                  style={styles.linkInput}
                  placeholder="https://www.example.com/product"
                  placeholderTextColor={Colors.textTertiary}
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
                  <Check size={16} color={(linkValue.trim() || isEditingLink) ? Colors.white : Colors.textTertiary} />
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
            <ExternalLink size={12} color={Colors.textTertiary} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        {appliance && (
          <TouchableOpacity style={styles.applianceCard} onPress={handleNavigateToAppliance} activeOpacity={0.7}>
            <View style={[styles.applianceIconWrap, { backgroundColor: Colors.accentLight }]}>
              <Wrench size={18} color={Colors.accent} />
            </View>
            <View style={styles.applianceInfo}>
              <Text style={styles.applianceLabel}>Related Item</Text>
              <Text style={styles.applianceName}>{appliance.name}</Text>
              <Text style={styles.applianceMeta}>
                {appliance.brand} {appliance.model ? `· ${appliance.model}` : ''}
              </Text>
            </View>
            <ChevronRight size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
        )}

        <View style={styles.proSection}>
          <View style={styles.proSectionHeader}>
            <View style={styles.proTitleRow}>
              <UserCheck size={16} color={Colors.textSecondary} />
              <Text style={styles.proSectionTitle}>Trusted Pro</Text>
            </View>
            {linkedPro && (
              <TouchableOpacity style={styles.proRemoveBtn} onPress={handleRemovePro} activeOpacity={0.7} hitSlop={8}>
                <XCircle size={16} color={Colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          {linkedPro ? (
            <TouchableOpacity style={styles.proCard} onPress={handleNavigateToPro} activeOpacity={0.7} testID="task-linked-pro">
              <View style={styles.proAvatarWrap}>
                <UserCheck size={20} color={Colors.primary} />
              </View>
              <View style={styles.proCardInfo}>
                <Text style={styles.proCardName}>{linkedPro.name}</Text>
                <Text style={styles.proCardSpecialty}>{linkedPro.specialty}</Text>
                {linkedPro.phone ? (
                  <View style={styles.proCardPhoneRow}>
                    <Phone size={11} color={Colors.textTertiary} />
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
              <ChevronRight size={16} color={Colors.textTertiary} />
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
                          <UserCheck size={16} color={Colors.primary} />
                        </View>
                        <View style={styles.proPickerInfo}>
                          <Text style={styles.proPickerName}>{pro.name}</Text>
                          <Text style={styles.proPickerSpecialty}>{pro.specialty}</Text>
                        </View>
                        <Plus size={16} color={Colors.primary} />
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
                    <Search size={15} color={Colors.white} />
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
                    <UserCheck size={15} color={Colors.primary} />
                    <Text style={styles.proSelectBtnText}>Assign a Pro</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.findProBtn} onPress={handleFindAPro} activeOpacity={0.7} testID="task-find-pro-btn">
                  <Search size={15} color={Colors.white} />
                  <Text style={styles.findProBtnText}>Find a Pro</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.notesSection}>
          <View style={styles.notesSectionHeader}>
            <View style={styles.notesTitleRow}>
              <StickyNote size={16} color={Colors.textSecondary} />
              <Text style={styles.notesSectionTitle}>Notes ({task.notes?.length ?? 0})</Text>
            </View>
            <TouchableOpacity style={styles.addNoteBtn} onPress={toggleNoteInput} activeOpacity={0.7}>
              {showNoteInput ? <X size={16} color={Colors.textSecondary} /> : <Pencil size={14} color={Colors.primary} />}
            </TouchableOpacity>
          </View>

          {showNoteInput && (
            <Animated.View style={[styles.noteInputWrap, { maxHeight: noteInputHeight }]}>
              <View style={styles.noteInputCard}>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Add a note..."
                  placeholderTextColor={Colors.textTertiary}
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
                  <Send size={16} color={newNote.trim() ? Colors.white : Colors.textTertiary} />
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
                  <X size={12} color={Colors.textTertiary} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.actionsSection}>
          {!isCompleted && !isArchived && (
            <TouchableOpacity style={styles.completeBtn} onPress={handleComplete} activeOpacity={0.85} testID="task-complete-btn">
              <Check size={18} color={Colors.white} />
              <Text style={styles.completeBtnText}>Mark as Done</Text>
            </TouchableOpacity>
          )}

          {isArchived && (
            <TouchableOpacity style={styles.restoreBtn} onPress={handleUnarchive} activeOpacity={0.85} testID="task-unarchive-btn">
              <ArchiveRestore size={18} color={Colors.white} />
              <Text style={styles.restoreBtnText}>Restore Task</Text>
            </TouchableOpacity>
          )}

          {!isArchived && (isCompleted || task.status === 'upcoming') && (
            <TouchableOpacity style={styles.archiveBtn} onPress={() => handleArchive(() => router.back())} activeOpacity={0.85} testID="task-archive-btn">
              <Archive size={16} color={Colors.textSecondary} />
              <Text style={styles.archiveBtnText}>Archive</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(() => router.back())} activeOpacity={0.85} testID="task-delete-btn">
            <Trash2 size={16} color={Colors.danger} />
            <Text style={styles.deleteBtnText}>Delete Task</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
