import { useMemo, useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useHome } from '@/contexts/HomeContext';
import { TaskPriority, TrustedPro } from '@/types';
import { successNotification, mediumImpact, lightImpact } from '@/utils/haptics';

export function useTaskDetail(taskId: string | undefined) {
  const {
    tasks,
    appliances,
    completeTask,
    archiveTask,
    unarchiveTask,
    deleteTask,
    addTaskNote,
    removeTaskNote,
    updateTaskProductLink,
    updateTaskTrustedPro,
    updateTask,
    trustedPros,
  } = useHome();

  const task = useMemo(() => tasks.find((t) => t.id === taskId), [tasks, taskId]);
  const appliance = useMemo(
    () => (task?.applianceId ? appliances.find((a) => a.id === task.applianceId) : null),
    [task, appliances]
  );
  const linkedPro = useMemo(
    () => (task?.trustedProId ? trustedPros.find((p) => p.id === task.trustedProId) : null),
    [task, trustedPros]
  );

  const handleComplete = useCallback(() => {
    if (!task) return;
    const isRecurring = task.recurring && task.recurringInterval;
    const message = isRecurring
      ? `Complete "${task.title}"?\n\nSince this is a recurring task, a new one will be created due in ${task.recurringInterval} days.`
      : `Complete "${task.title}"?`;

    Alert.alert('Mark as Done', message, [
      { text: 'Not yet', style: 'cancel' },
      {
        text: 'Done!',
        onPress: () => {
          successNotification();
          completeTask(task.id);
          if (isRecurring) {
            setTimeout(() => {
              Alert.alert(
                'Next Task Created',
                `A new "${task.title}" task has been scheduled for ${task.recurringInterval} days from now.`,
                [{ text: 'OK' }]
              );
            }, 500);
          }
        },
      },
    ]);
  }, [task, completeTask]);

  const handleArchive = useCallback((onSuccess?: () => void) => {
    if (!task) return;
    Alert.alert('Archive Task', `Move "${task.title}" to archive?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        onPress: () => {
          mediumImpact();
          archiveTask(task.id);
          onSuccess?.();
        },
      },
    ]);
  }, [task, archiveTask]);

  const handleUnarchive = useCallback(() => {
    if (!task) return;
    mediumImpact();
    unarchiveTask(task.id);
  }, [task, unarchiveTask]);

  const handleDelete = useCallback((onSuccess?: () => void) => {
    if (!task) return;
    Alert.alert('Delete Task', `Permanently delete "${task.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          mediumImpact();
          deleteTask(task.id);
          onSuccess?.();
        },
      },
    ]);
  }, [task, deleteTask]);

  const handleAddNote = useCallback((note: string) => {
    if (!note.trim() || !task) return;
    lightImpact();
    addTaskNote({ taskId: task.id, note: note.trim() });
  }, [task, addTaskNote]);

  const handleRemoveNote = useCallback((index: number) => {
    if (!task) return;
    Alert.alert('Remove Note', 'Delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          lightImpact();
          removeTaskNote({ taskId: task.id, noteIndex: index });
        },
      },
    ]);
  }, [task, removeTaskNote]);

  const handleSaveLink = useCallback((link: string | undefined) => {
    if (!task) return;
    lightImpact();
    if (link) {
      let url = link;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      console.log('[useTaskDetail] Saving product link:', url);
      updateTaskProductLink({ taskId: task.id, productLink: url });
    } else {
      console.log('[useTaskDetail] Removing product link');
      updateTaskProductLink({ taskId: task.id, productLink: undefined });
    }
  }, [task, updateTaskProductLink]);

  const handleRemoveLink = useCallback(() => {
    if (!task) return;
    Alert.alert('Remove Link', 'Remove the product link?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          lightImpact();
          updateTaskProductLink({ taskId: task.id, productLink: undefined });
        },
      },
    ]);
  }, [task, updateTaskProductLink]);

  const handleAssignPro = useCallback((pro: TrustedPro) => {
    if (!task) return;
    console.log('[useTaskDetail] Assigning trusted pro:', pro.name, 'to task:', task.id);
    lightImpact();
    updateTaskTrustedPro({ taskId: task.id, trustedProId: pro.id });
  }, [task, updateTaskTrustedPro]);

  const handleRemovePro = useCallback(() => {
    if (!task) return;
    Alert.alert('Remove Pro', 'Unlink this trusted pro from the task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          lightImpact();
          updateTaskTrustedPro({ taskId: task.id, trustedProId: undefined });
          console.log('[useTaskDetail] Removed trusted pro from task:', task.id);
        },
      },
    ]);
  }, [task, updateTaskTrustedPro]);

  const handleSaveEdit = useCallback((edits: {
    title: string;
    description: string;
    dueDate: string;
    priority: TaskPriority;
    estimatedCost: string;
    recurring: boolean;
    recurringInterval: string;
    applianceId: string;
  }) => {
    if (!task) return false;
    if (!edits.title.trim()) {
      Alert.alert('Missing Info', 'Please enter a task name.');
      return false;
    }
    if (!edits.dueDate.trim()) {
      Alert.alert('Missing Info', 'Please enter a due date.');
      return false;
    }

    const costVal = edits.estimatedCost.trim() ? parseFloat(edits.estimatedCost) : undefined;

    const updatedTask = {
      ...task,
      title: edits.title.trim(),
      description: edits.description.trim(),
      dueDate: edits.dueDate.trim(),
      priority: edits.priority,
      estimatedCost: costVal,
      recurring: edits.recurring,
      recurringInterval: edits.recurring ? parseInt(edits.recurringInterval, 10) || 30 : undefined,
      applianceId: edits.applianceId || undefined,
    };

    console.log('[useTaskDetail] Saving edited task:', updatedTask.id);
    successNotification();
    updateTask(updatedTask);
    return true;
  }, [task, updateTask]);

  return {
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
  };
}
