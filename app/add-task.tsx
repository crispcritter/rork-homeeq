import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useHome } from '@/contexts/HomeContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { TaskPriority, RecurringUnit, asISODateString } from '@/types';
import { PRIORITIES } from '@/constants/priorities';
import createFormStyles from '@/constants/formStyles';
import ApplianceChipSelector from '@/components/ApplianceChipSelector';
import DatePickerField from '@/components/DatePickerField';
import { successNotification } from '@/utils/haptics';

export default function AddTaskScreen() {
  const router = useRouter();
  const { colors: c } = useTheme();
  const { addTask, appliances, activeTasks } = useHome();
  const { canAddTask } = useSubscription();
  const formStyles = useMemo(() => createFormStyles(c), [c]);

  useEffect(() => {
    if (!canAddTask(activeTasks.length)) {
      console.log('[AddTask] Free tier limit reached, redirecting to paywall');
      router.replace('/paywall');
    }
  }, [canAddTask, activeTasks.length, router]);

  if (!canAddTask(activeTasks.length)) {
    return null;
  }

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const { applianceId: preselectedApplianceId } = useLocalSearchParams<{ applianceId?: string }>();
  const [selectedApplianceId, setSelectedApplianceId] = useState<string>(preselectedApplianceId ?? '');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState('30');
  const [recurringUnit, setRecurringUnit] = useState<RecurringUnit>('days');

  const handleSave = useCallback(() => {
    if (!title.trim()) {
      Alert.alert('Just a moment', 'Please enter a task name');
      return;
    }
    if (!dueDate.trim()) {
      Alert.alert('Just a moment', 'Please enter a due date');
      return;
    }


    successNotification();

    const newTask = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      dueDate: asISODateString(dueDate.trim()),
      priority,
      status: 'upcoming' as const,
      applianceId: selectedApplianceId || undefined,
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
      recurring,
      recurringInterval: recurring ? parseInt(recurringInterval, 10) : undefined,
      recurringUnit: recurring ? recurringUnit : undefined,
    };

    addTask(newTask);
    router.back();
  }, [title, description, dueDate, priority, selectedApplianceId, estimatedCost, recurring, recurringInterval, recurringUnit, addTask, router]);

  return (
    <KeyboardAvoidingView
      style={formStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={formStyles.content}>
        <View style={formStyles.section}>
          <Text style={formStyles.sectionLabel}>Task</Text>
          <View style={formStyles.card}>
            <View style={formStyles.inputRow}>
              <View style={formStyles.inputContent}>
                <Text style={formStyles.inputLabel}>What needs to be done?</Text>
                <TextInput
                  style={formStyles.textInput}
                  placeholder="e.g. Replace AC filter, clean gutters"
                  placeholderTextColor={c.textTertiary}
                  value={title}
                  onChangeText={setTitle}
                  testID="task-title"
                />
              </View>
            </View>
            <View style={formStyles.divider} />
            <View style={formStyles.inputRow}>
              <View style={formStyles.inputContent}>
                <Text style={formStyles.inputLabel}>Details (optional)</Text>
                <TextInput
                  style={[formStyles.textInput, { minHeight: 60 }]}
                  placeholder="Any helpful notes or instructions..."
                  placeholderTextColor={c.textTertiary}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  textAlignVertical="top"
                  testID="task-description"
                />
              </View>
            </View>
            <View style={formStyles.divider} />
            <View style={formStyles.inputRow}>
              <View style={formStyles.inputContent}>
                <DatePickerField
                  label="When is it due?"
                  value={dueDate}
                  onChange={setDueDate}
                  placeholder="Select due date"
                  colors={c}
                  testID="task-due-date"
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
                  priority === p.key && { backgroundColor: p.color, borderColor: p.color },
                ]}
                onPress={() => setPriority(p.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    formStyles.priorityLabel,
                    priority === p.key && { color: c.white },
                  ]}
                >
                  {p.label}
                </Text>
                <Text
                  style={[
                    formStyles.priorityDesc,
                    priority === p.key && { color: 'rgba(255,255,255,0.75)' },
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
            <Text style={formStyles.sectionLabel}>Related item</Text>
            <ApplianceChipSelector
              appliances={appliances}
              selectedId={selectedApplianceId}
              onSelect={setSelectedApplianceId}
            />
          </View>
        )}

        <View style={formStyles.section}>
          <Text style={formStyles.sectionLabel}>Cost & Repeat</Text>
          <View style={formStyles.card}>
            <View style={formStyles.inputRow}>
              <View style={formStyles.inputContent}>
                <Text style={formStyles.inputLabel}>Estimated cost</Text>
                <TextInput
                  style={formStyles.textInput}
                  placeholder="$0.00 (optional)"
                  placeholderTextColor={c.textTertiary}
                  value={estimatedCost}
                  onChangeText={setEstimatedCost}
                  keyboardType="numeric"
                  testID="task-cost"
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
                value={recurring}
                onValueChange={setRecurring}
                trackColor={{ false: c.border, true: c.primary + '60' }}
                thumbColor={recurring ? c.primary : c.textTertiary}
              />
            </View>
            {recurring && (
              <>
                <View style={formStyles.divider} />
                <View style={formStyles.inputRow}>
                  <View style={formStyles.inputContent}>
                    <Text style={formStyles.inputLabel}>Repeat every</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <TextInput
                        style={[formStyles.textInput, { flex: 1 }]}
                        placeholder="30"
                        placeholderTextColor={c.textTertiary}
                        value={recurringInterval}
                        onChangeText={setRecurringInterval}
                        keyboardType="numeric"
                        testID="task-interval"
                      />
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {(['days', 'weeks', 'months', 'years'] as RecurringUnit[]).map((u) => (
                          <TouchableOpacity
                            key={u}
                            onPress={() => setRecurringUnit(u)}
                            style={{
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              borderRadius: 8,
                              backgroundColor: recurringUnit === u ? c.primary : c.surfaceAlt,
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={{ fontSize: 13, fontWeight: '500', color: recurringUnit === u ? c.white : c.textSecondary }}>
                              {u.charAt(0).toUpperCase() + u.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        <TouchableOpacity style={formStyles.saveBtn} onPress={handleSave} activeOpacity={0.85} testID="save-task">
          <Text style={formStyles.saveBtnText}>Add Task</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
