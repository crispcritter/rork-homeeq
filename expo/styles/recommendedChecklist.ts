import { StyleSheet } from 'react-native';
import { ColorScheme } from '@/constants/colors';

export const createStyles = (c: ColorScheme) => StyleSheet.create({
  wrapper: { backgroundColor: c.surface, borderRadius: 18, marginTop: 20, marginBottom: 12, shadowColor: c.cardShadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2, overflow: 'hidden' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: c.primaryLight, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: c.text, lineHeight: 22 },
  headerSubtitle: { fontSize: 12, color: c.textSecondary, lineHeight: 16, marginTop: 1 },
  progressBarBg: { height: 3, backgroundColor: c.surfaceAlt, marginHorizontal: 16, borderRadius: 2, marginBottom: 4 },
  progressBarFill: { height: '100%', backgroundColor: c.primary, borderRadius: 2 },
  groupsContainer: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12 },
});

export const createGroupStyles = (c: ColorScheme) => StyleSheet.create({
  container: { marginBottom: 2 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6, gap: 10 },
  iconWrap: { width: 32, height: 32, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  headerTextWrap: { flex: 1 },
  headerTitle: { fontSize: 14, fontWeight: '600', color: c.text, lineHeight: 19 },
  headerCount: { fontSize: 11, color: c.textTertiary, lineHeight: 15, marginTop: 1 },
  doneBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: c.success, justifyContent: 'center', alignItems: 'center', marginRight: 4 },
  itemsWrap: {},
  itemsList: { paddingLeft: 48, paddingBottom: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.borderLight },
  itemNameWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemName: { fontSize: 14, color: c.text, lineHeight: 19, flexShrink: 1 },
  itemNameDone: { color: c.textTertiary, textDecorationLine: 'line-through' },
  customBadge: { backgroundColor: c.warningLight, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  customBadgeText: { fontSize: 9, fontWeight: '600', color: c.warning, lineHeight: 13 },
  syncBadge: { width: 16, height: 16, borderRadius: 8, backgroundColor: c.warningLight, justifyContent: 'center', alignItems: 'center' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: c.primaryLight, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  addBtnText: { fontSize: 12, fontWeight: '600', color: c.primary, lineHeight: 16 },
  addedLabel: { fontSize: 12, color: c.textTertiary, fontWeight: '500', lineHeight: 16 },
  moreBtn: { paddingLeft: 4, paddingVertical: 2 },
  addItemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, marginTop: 2 },
  addItemIcon: { width: 26, height: 26, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
  addItemText: { fontSize: 13, fontWeight: '500', color: c.textSecondary, lineHeight: 18 },
});

export const createMenuStyles = (c: ColorScheme) => StyleSheet.create({
  backdrop: { position: 'absolute', top: -500, left: -500, right: -500, bottom: -500, zIndex: 999, justifyContent: 'flex-end', alignItems: 'center' },
  backdropTouch: { ...StyleSheet.absoluteFillObject, backgroundColor: c.overlay },
  container: { width: '85%', maxWidth: 340, backgroundColor: c.surface, borderRadius: 20, paddingTop: 10, paddingBottom: 16, paddingHorizontal: 6, zIndex: 1000 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: c.borderLight, alignSelf: 'center', marginBottom: 12 },
  title: { fontSize: 15, fontWeight: '700', color: c.text, textAlign: 'center', marginBottom: 14, paddingHorizontal: 12 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12 },
  optionIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  optionTextWrap: { flex: 1 },
  optionLabel: { fontSize: 15, fontWeight: '600', color: c.text, lineHeight: 20 },
  optionDesc: { fontSize: 12, color: c.textTertiary, lineHeight: 16, marginTop: 1 },
  cancelBtn: { marginTop: 8, paddingVertical: 12, alignItems: 'center', backgroundColor: c.surfaceAlt, borderRadius: 12, marginHorizontal: 8 },
  cancelText: { fontSize: 15, fontWeight: '600', color: c.textSecondary },
});

export const createAddModalStyles = (c: ColorScheme) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: c.overlay, justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 360, backgroundColor: c.surface, borderRadius: 20, padding: 22 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: c.text },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: c.textSecondary, marginBottom: 6, lineHeight: 17 },
  input: { borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: c.text, backgroundColor: c.surfaceAlt },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: c.surfaceAlt, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: c.textSecondary },
  addBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 13, borderRadius: 12, backgroundColor: c.primary },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: { fontSize: 15, fontWeight: '600', color: c.white },
});
