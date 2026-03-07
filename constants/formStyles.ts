import { StyleSheet } from 'react-native';
import { ColorScheme } from '@/constants/colors';

const createFormStyles = (c: ColorScheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: c.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
    lineHeight: 17,
  },
  card: {
    backgroundColor: c.surface,
    borderRadius: 16,
    overflow: 'hidden' as const,
    shadowColor: c.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 1,
  },
  inputRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: c.textSecondary,
    marginBottom: 4,
    lineHeight: 16,
  },
  textInput: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: c.text,
    padding: 0,
    margin: 0,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: c.borderLight,
    marginLeft: 16,
  },
  switchRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  switchContent: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
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
    gap: 10,
  },
  priorityChip: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  priorityLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
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
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center' as const,
    marginTop: 4,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: c.white,
    lineHeight: 22,
  },
});

export default createFormStyles;
