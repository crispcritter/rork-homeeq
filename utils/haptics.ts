import * as Haptics from 'expo-haptics';

export function lightImpact(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function mediumImpact(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export function heavyImpact(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

export function successNotification(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function warningNotification(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

export function errorNotification(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}
