import Colors from '@/constants/colors';
import { TaskPriority } from '@/types';

export interface PriorityOption {
  key: TaskPriority;
  label: string;
  color: string;
  desc: string;
}

export const PRIORITIES: PriorityOption[] = [
  { key: 'low', label: 'Low', color: Colors.textTertiary, desc: 'When you get to it' },
  { key: 'medium', label: 'Medium', color: Colors.warning, desc: 'Should be done soon' },
  { key: 'high', label: 'High', color: Colors.danger, desc: 'Needs attention now' },
];

export function getPriorityColor(priority: TaskPriority): string {
  switch (priority) {
    case 'high': return Colors.danger;
    case 'medium': return Colors.warning;
    default: return Colors.textTertiary;
  }
}

export function getPriorityBgColor(priority: TaskPriority): string {
  switch (priority) {
    case 'high': return Colors.dangerLight;
    case 'medium': return Colors.warningLight;
    default: return Colors.surfaceAlt;
  }
}
