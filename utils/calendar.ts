import { Platform, Alert } from 'react-native';
import { MaintenanceTask } from '@/types';

interface CalendarResult {
  success: boolean;
  eventId?: string;
  error?: string;
}

interface ReminderResult {
  success: boolean;
  reminderId?: string;
  error?: string;
}

const isNativeDevice = Platform.OS === 'ios' || Platform.OS === 'android';

async function getCalendarModule() {
  if (!isNativeDevice) return null;
  try {
    const Calendar = await import('expo-calendar');
    return Calendar;
  } catch (e) {
    console.log('[Calendar] Failed to import expo-calendar:', e);
    return null;
  }
}

export async function requestCalendarPermission(): Promise<boolean> {
  const Calendar = await getCalendarModule();
  if (!Calendar) return false;
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    console.log('[Calendar] Permission status:', status);
    return status === 'granted';
  } catch (e) {
    console.log('[Calendar] Permission request failed:', e);
    return false;
  }
}

export async function requestRemindersPermission(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  const Calendar = await getCalendarModule();
  if (!Calendar) return false;
  try {
    const { status } = await Calendar.requestRemindersPermissionsAsync();
    console.log('[Calendar] Reminders permission status:', status);
    return status === 'granted';
  } catch (e) {
    console.log('[Calendar] Reminders permission request failed:', e);
    return false;
  }
}

async function getDefaultCalendarId(): Promise<string | null> {
  const Calendar = await getCalendarModule();
  if (!Calendar) return null;
  try {
    if (Platform.OS === 'ios') {
      const defaultCal = await Calendar.getDefaultCalendarAsync();
      return defaultCal.id;
    } else {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const writable = calendars.filter((c) => c.allowsModifications);
      const primary = writable.find((c) => c.isPrimary) ?? writable[0];
      return primary?.id ?? null;
    }
  } catch (e) {
    console.log('[Calendar] Failed to get default calendar:', e);
    return null;
  }
}

async function getDefaultReminderCalendarId(): Promise<string | null> {
  if (Platform.OS !== 'ios') return null;
  const Calendar = await getCalendarModule();
  if (!Calendar) return null;
  try {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.REMINDER);
    const writable = calendars.filter((c) => c.allowsModifications);
    return writable[0]?.id ?? null;
  } catch (e) {
    console.log('[Calendar] Failed to get reminder calendar:', e);
    return null;
  }
}

function buildRecurrenceRule(task: MaintenanceTask) {
  if (!task.recurring || !task.recurringInterval) return null;
  const interval = task.recurringInterval;
  if (interval % 365 === 0) {
    return { frequency: 'YEARLY' as const, interval: Math.round(interval / 365) };
  }
  if (interval % 30 === 0) {
    return { frequency: 'MONTHLY' as const, interval: Math.round(interval / 30) };
  }
  if (interval % 7 === 0) {
    return { frequency: 'WEEKLY' as const, interval: Math.round(interval / 7) };
  }
  return { frequency: 'DAILY' as const, interval };
}

export async function addTaskToCalendar(task: MaintenanceTask): Promise<CalendarResult> {
  if (!isNativeDevice) {
    return { success: false, error: 'Calendar is not available on web' };
  }

  const Calendar = await getCalendarModule();
  if (!Calendar) {
    return { success: false, error: 'Calendar module not available' };
  }

  const granted = await requestCalendarPermission();
  if (!granted) {
    return { success: false, error: 'Calendar permission denied' };
  }

  const calendarId = await getDefaultCalendarId();
  if (!calendarId) {
    return { success: false, error: 'No writable calendar found' };
  }

  try {
    const dueDate = new Date(task.dueDate + 'T09:00:00');
    const endDate = new Date(task.dueDate + 'T10:00:00');

    const notes = [
      task.description,
      task.estimatedCost ? `Estimated cost: $${task.estimatedCost.toFixed(2)}` : '',
      task.priority ? `Priority: ${task.priority}` : '',
    ].filter(Boolean).join('\n');

    const recurrenceRule = buildRecurrenceRule(task);

    const eventData: Record<string, unknown> = {
      title: `🏠 ${task.title}`,
      startDate: dueDate,
      endDate: endDate,
      notes,
      alarms: [{ relativeOffset: -1440 }, { relativeOffset: -60 }],
      allDay: false,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    if (recurrenceRule) {
      const CalendarModule = Calendar;
      const freq = recurrenceRule.frequency === 'DAILY'
        ? CalendarModule.Frequency.DAILY
        : recurrenceRule.frequency === 'WEEKLY'
        ? CalendarModule.Frequency.WEEKLY
        : recurrenceRule.frequency === 'MONTHLY'
        ? CalendarModule.Frequency.MONTHLY
        : CalendarModule.Frequency.YEARLY;

      eventData.recurrenceRule = {
        frequency: freq,
        interval: recurrenceRule.interval,
      };
    }

    const eventId = await Calendar.createEventAsync(calendarId, eventData as any);
    console.log('[Calendar] Event created:', eventId, 'for task:', task.title);
    return { success: true, eventId };
  } catch (e: any) {
    console.error('[Calendar] Failed to create event:', e);
    return { success: false, error: e.message ?? 'Failed to create calendar event' };
  }
}

export async function addTaskToReminders(task: MaintenanceTask): Promise<ReminderResult> {
  if (Platform.OS !== 'ios') {
    return { success: false, error: 'Reminders are only available on iOS' };
  }

  const Calendar = await getCalendarModule();
  if (!Calendar) {
    return { success: false, error: 'Calendar module not available' };
  }

  const granted = await requestRemindersPermission();
  if (!granted) {
    return { success: false, error: 'Reminders permission denied' };
  }

  const calendarId = await getDefaultReminderCalendarId();

  try {
    const dueDate = new Date(task.dueDate + 'T09:00:00');

    const notes = [
      task.description,
      task.estimatedCost ? `Estimated cost: $${task.estimatedCost.toFixed(2)}` : '',
      task.priority ? `Priority: ${task.priority}` : '',
    ].filter(Boolean).join('\n');

    const recurrenceRule = buildRecurrenceRule(task);

    const reminderData: Record<string, unknown> = {
      title: task.title,
      dueDate,
      notes,
      alarms: [{ relativeOffset: -1440 }],
      completed: task.status === 'completed',
    };

    if (recurrenceRule && Calendar.Frequency) {
      const freq = recurrenceRule.frequency === 'DAILY'
        ? Calendar.Frequency.DAILY
        : recurrenceRule.frequency === 'WEEKLY'
        ? Calendar.Frequency.WEEKLY
        : recurrenceRule.frequency === 'MONTHLY'
        ? Calendar.Frequency.MONTHLY
        : Calendar.Frequency.YEARLY;

      reminderData.recurrenceRule = {
        frequency: freq,
        interval: recurrenceRule.interval,
      };
    }

    const reminderId = await Calendar.createReminderAsync(calendarId, reminderData as any);
    console.log('[Calendar] Reminder created:', reminderId, 'for task:', task.title);
    return { success: true, reminderId };
  } catch (e: any) {
    console.error('[Calendar] Failed to create reminder:', e);
    return { success: false, error: e.message ?? 'Failed to create reminder' };
  }
}

export async function removeCalendarEvent(eventId: string): Promise<boolean> {
  const Calendar = await getCalendarModule();
  if (!Calendar) return false;
  try {
    await Calendar.deleteEventAsync(eventId);
    console.log('[Calendar] Event deleted:', eventId);
    return true;
  } catch (e) {
    console.error('[Calendar] Failed to delete event:', e);
    return false;
  }
}

export async function removeReminder(reminderId: string): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  const Calendar = await getCalendarModule();
  if (!Calendar) return false;
  try {
    await Calendar.deleteReminderAsync(reminderId);
    console.log('[Calendar] Reminder deleted:', reminderId);
    return true;
  } catch (e) {
    console.error('[Calendar] Failed to delete reminder:', e);
    return false;
  }
}

export async function updateReminderCompletion(reminderId: string, completed: boolean): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  const Calendar = await getCalendarModule();
  if (!Calendar) return false;
  try {
    await Calendar.updateReminderAsync(reminderId, {
      completed,
      completionDate: completed ? new Date() : undefined,
    } as any);
    console.log('[Calendar] Reminder completion updated:', reminderId, completed);
    return true;
  } catch (e) {
    console.error('[Calendar] Failed to update reminder:', e);
    return false;
  }
}

export function isCalendarAvailable(): boolean {
  return isNativeDevice;
}

export function isRemindersAvailable(): boolean {
  return Platform.OS === 'ios';
}
