import { ColorScheme } from '@/constants/colors';
import { TaskPriority } from '@/types';

export interface PriorityOption {
  key: TaskPriority;
  label: string;
  color: string;
  desc: string;
}

export function getPriorities(c: ColorScheme): PriorityOption[] {
  return [
    { key: 'low', label: 'Low', color: c.textTertiary, desc: 'When you get to it' },
    { key: 'medium', label: 'Medium', color: c.warning, desc: 'Should be done soon' },
    { key: 'high', label: 'High', color: c.danger, desc: 'Needs attention now' },
  ];
}

export function getPriorityColor(priority: TaskPriority, c: ColorScheme): string {
  switch (priority) {
    case 'high': return c.danger;
    case 'medium': return c.warning;
    default: return c.textTertiary;
  }
}

export function getPriorityBgColor(priority: TaskPriority, c: ColorScheme): string {
  switch (priority) {
    case 'high': return c.dangerLight;
    case 'medium': return c.warningLight;
    default: return c.surfaceAlt;
  }
}
