import { StyleSheet } from 'react-native';
import { ColorScheme } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/layout';

const createFormStyles = (c: ColorScheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: c.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
    lineHeight: 17,
  },
  card: {
    backgroundColor: c.surface,
    borderRadius: Radius.card,
    overflow: 'hidden' as const,
    shadowColor: c.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: Spacing.sm,
    elevation: 1,
  },
  inputRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  inputContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: c.textSecondary,
    marginBottom: Spacing.xs,
    lineHeight: 16,
  },
  textInput: {
    fontSize: 16,
    fontWeight: '500',
    color: c.text,
    padding: 0,
    margin: 0,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: c.borderLight,
    marginLeft: Spacing.lg,
  },
  switchRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  switchContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
    lineHeight: 20,
  },
  switchSubtitle: {
    fontSize: 12,
    color: c.textTertiary,
    marginTop: 2,
    lineHeight: 16,
  },
  priorityRow: {
    gap: Spacing.md,
  },
  priorityChip: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  priorityLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
    marginBottom: 2,
    lineHeight: 20,
  },
  priorityDesc: {
    fontSize: 12,
    color: c.textTertiary,
    lineHeight: 16,
  },
  saveBtn: {
    backgroundColor: c.primary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.lg,
    alignItems: 'center' as const,
    marginTop: Spacing.xs,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: c.white,
    lineHeight: 22,
  },
});

export default createFormStyles;
