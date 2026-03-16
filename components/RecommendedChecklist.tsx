import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Modal,
  TextInput,

} from 'react-native';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  ClipboardList,
  Plus,
  Flame,
  Droplets,
  Zap,
  Wind,
  Trees,
  Home,
  CookingPot,
  WashingMachine,
  Trash2,
  Copy,
  RefreshCw,
  MoreHorizontal,
  X,
  Package,
  Warehouse,
  Waves,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { ColorScheme } from '@/constants/colors';
import { RecommendedGroup, RecommendedItem, GROUP_META } from '@/mocks/recommendedItems';
import { Appliance, ApplianceCategory } from '@/types';
import { lightImpact, mediumImpact } from '@/utils/haptics';

interface RecommendedChecklistProps {
  appliances: Appliance[];
  recommendedGroups: RecommendedGroup[];
  onAddItem: (item: RecommendedItem) => void;
  onRemoveRecommendedItem: (groupKey: string, itemId: string) => void;
  onDuplicateRecommendedItem: (groupKey: string, itemId: string) => void;
  onSyncRecommendedItem: (groupKey: string, itemId: string) => void;
  onAddCustomRecommendedItem: (groupKey: string, item: RecommendedItem) => void;
}

const GROUP_ICONS: Record<string, React.ElementType> = {
  kitchen: CookingPot,
  laundry: WashingMachine,
  hvac: Wind,
  plumbing: Droplets,
  electrical: Zap,
  outdoor: Trees,
  garage: Warehouse,
  pool: Waves,
  roofing: Home,
  other: Package,
};

const _CATEGORY_OPTIONS: { key: ApplianceCategory; label: string }[] = [
  { key: 'kitchen', label: 'Kitchen' },
  { key: 'laundry', label: 'Laundry' },
  { key: 'hvac', label: 'Heating & Cooling' },
  { key: 'plumbing', label: 'Plumbing' },
  { key: 'electrical', label: 'Electrical' },
  { key: 'outdoor', label: 'Outdoor' },
  { key: 'garage', label: 'Garage' },
  { key: 'pool', label: 'Pool' },
  { key: 'roofing', label: 'Roof & Exterior' },
  { key: 'other', label: 'Other' },
];

function ItemActionsMenu({
  visible,
  onClose,
  onRemove,
  onDuplicate,
  onSync,
  canSync,
  itemName,
}: {
  visible: boolean;
  onClose: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onSync: () => void;
  canSync: boolean;
  itemName: string;
}) {
  const { colors: c } = useTheme();
  const ms = useMemo(() => createMenuStyles(c), [c]);

  if (!visible) return null;

  return (
    <View style={ms.backdrop}>
      <TouchableOpacity style={ms.backdropTouch} onPress={onClose} activeOpacity={1} />
      <View style={ms.container}>
        <View style={ms.handle} />
        <Text style={ms.title} numberOfLines={1}>{itemName}</Text>

        {canSync && (
          <TouchableOpacity
            style={ms.option}
            onPress={() => { onSync(); onClose(); }}
            activeOpacity={0.7}
          >
            <View style={[ms.optionIcon, { backgroundColor: c.primaryLight }]}>
              <RefreshCw size={16} color={c.primary} />
            </View>
            <View style={ms.optionTextWrap}>
              <Text style={ms.optionLabel}>Sync with My Items</Text>
              <Text style={ms.optionDesc}>Update from your tracked appliance</Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={ms.option}
          onPress={() => { onDuplicate(); onClose(); }}
          activeOpacity={0.7}
        >
          <View style={[ms.optionIcon, { backgroundColor: c.warningLight }]}>
            <Copy size={16} color={c.warning} />
          </View>
          <View style={ms.optionTextWrap}>
            <Text style={ms.optionLabel}>Duplicate</Text>
            <Text style={ms.optionDesc}>Create a copy of this item</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={ms.option}
          onPress={() => {
            Alert.alert(
              'Remove Item',
              `Remove "${itemName}" from the recommended list?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => { onRemove(); onClose(); } },
              ]
            );
          }}
          activeOpacity={0.7}
        >
          <View style={[ms.optionIcon, { backgroundColor: c.dangerLight }]}>
            <Trash2 size={16} color={c.danger} />
          </View>
          <View style={ms.optionTextWrap}>
            <Text style={[ms.optionLabel, { color: c.danger }]}>Remove</Text>
            <Text style={ms.optionDesc}>Remove from recommended list</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={ms.cancelBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={ms.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AddItemModal({
  visible,
  groupKey,
  onClose,
  onAdd,
}: {
  visible: boolean;
  groupKey: string;
  onClose: () => void;
  onAdd: (groupKey: string, item: RecommendedItem) => void;
}) {
  const { colors: c } = useTheme();
  const ams = useMemo(() => createAddModalStyles(c), [c]);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const meta = GROUP_META[groupKey];

  const handleAdd = useCallback(() => {
    if (!name.trim()) return;
    const newItem: RecommendedItem = {
      id: `rec-custom-${Date.now()}`,
      name: name.trim(),
      category: groupKey as ApplianceCategory,
      location: location.trim() || meta?.label || '',
      isCustom: true,
    };
    onAdd(groupKey, newItem);
    setName('');
    setLocation('');
    onClose();
  }, [name, location, groupKey, meta, onAdd, onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={ams.overlay}>
        <View style={ams.card}>
          <View style={ams.header}>
            <Text style={ams.headerTitle}>Add Item to {meta?.label || 'List'}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <X size={20} color={c.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={ams.field}>
            <Text style={ams.label}>Item Name</Text>
            <TextInput
              style={ams.input}
              placeholder="e.g. Ice Maker"
              placeholderTextColor={c.textTertiary}
              value={name}
              onChangeText={setName}
              autoFocus
              testID="add-rec-item-name"
            />
          </View>

          <View style={ams.field}>
            <Text style={ams.label}>Location</Text>
            <TextInput
              style={ams.input}
              placeholder="e.g. Kitchen"
              placeholderTextColor={c.textTertiary}
              value={location}
              onChangeText={setLocation}
              testID="add-rec-item-location"
            />
          </View>

          <View style={ams.actions}>
            <TouchableOpacity style={ams.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={ams.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[ams.addBtn, !name.trim() && ams.addBtnDisabled]}
              onPress={handleAdd}
              activeOpacity={0.7}
              disabled={!name.trim()}
              testID="add-rec-item-submit"
            >
              <Plus size={16} color={c.white} />
              <Text style={ams.addBtnText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function GroupSection({
  group,
  matchedNames,
  matchedApplianceMap,
  onAddItem,
  onRemoveItem,
  onDuplicateItem,
  onSyncItem,
  onAddCustomItem,
}: {
  group: RecommendedGroup;
  matchedNames: Set<string>;
  matchedApplianceMap: Map<string, Appliance>;
  onAddItem: (item: RecommendedItem) => void;
  onRemoveItem: (groupKey: string, itemId: string) => void;
  onDuplicateItem: (groupKey: string, itemId: string) => void;
  onSyncItem: (groupKey: string, itemId: string) => void;
  onAddCustomItem: (groupKey: string, item: RecommendedItem) => void;
}) {
  const { colors: c } = useTheme();
  const gs = useMemo(() => createGroupStyles(c), [c]);
  const [expanded, setExpanded] = useState(false);
  const [activeMenuItemId, setActiveMenuItemId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const animHeight = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const checkedCount = group.items.filter((i) => matchedNames.has(i.name.toLowerCase())).length;
  const totalCount = group.items.length;
  const allDone = checkedCount === totalCount && totalCount > 0;

  const toggleExpand = useCallback(() => {
    lightImpact();
    const toValue = expanded ? 0 : 1;
    setExpanded(!expanded);
    Animated.parallel([
      Animated.timing(animHeight, {
        toValue,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(rotateAnim, {
        toValue,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [expanded, animHeight, rotateAnim]);

  const IconComponent = GROUP_ICONS[group.key] || Flame;
  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const maxHeight = animHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, (totalCount + 1) * 56 + 60],
  });

  const activeMenuItem = group.items.find((i) => i.id === activeMenuItemId);

  return (
    <View style={gs.container}>
      <TouchableOpacity
        style={gs.header}
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <View style={[gs.iconWrap, { backgroundColor: group.color + '18' }]}>
          <IconComponent size={16} color={group.color} />
        </View>
        <View style={gs.headerTextWrap}>
          <Text style={gs.headerTitle}>{group.label}</Text>
          <Text style={[gs.headerCount, allDone && { color: c.success }]}>
            {checkedCount}/{totalCount} added
          </Text>
        </View>
        {allDone && (
          <View style={gs.doneBadge}>
            <CheckCircle2 size={12} color={c.white} />
          </View>
        )}
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <ChevronDown size={18} color={c.textTertiary} />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View style={[gs.itemsWrap, { maxHeight, overflow: 'hidden' }]}>
        <View style={gs.itemsList}>
          {group.items.map((item) => {
            const isAdded = matchedNames.has(item.name.toLowerCase());
            const matchedAppliance = matchedApplianceMap.get(item.name.toLowerCase());
            const hasDetailDiff = isAdded && matchedAppliance && (
              matchedAppliance.location !== item.location ||
              matchedAppliance.category !== item.category
            );

            return (
              <View key={item.id} style={gs.itemRow}>
                {isAdded ? (
                  <CheckCircle2 size={18} color={c.success} />
                ) : (
                  <Circle size={18} color={c.border} />
                )}
                <View style={gs.itemNameWrap}>
                  <Text
                    style={[
                      gs.itemName,
                      isAdded && gs.itemNameDone,
                    ]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  {item.isCustom && (
                    <View style={gs.customBadge}>
                      <Text style={gs.customBadgeText}>Custom</Text>
                    </View>
                  )}
                  {hasDetailDiff && (
                    <View style={gs.syncBadge}>
                      <RefreshCw size={9} color={c.warning} />
                    </View>
                  )}
                </View>
                {!isAdded && (
                  <TouchableOpacity
                    style={gs.addBtn}
                    onPress={() => {
                      lightImpact();
                      onAddItem(item);
                    }}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Plus size={13} color={c.primary} />
                    <Text style={gs.addBtnText}>Add</Text>
                  </TouchableOpacity>
                )}
                {isAdded && (
                  <Text style={gs.addedLabel}>Added</Text>
                )}
                <TouchableOpacity
                  style={gs.moreBtn}
                  onPress={() => {
                    lightImpact();
                    setActiveMenuItemId(item.id);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                  activeOpacity={0.6}
                >
                  <MoreHorizontal size={16} color={c.textTertiary} />
                </TouchableOpacity>
              </View>
            );
          })}

          <TouchableOpacity
            style={gs.addItemRow}
            onPress={() => {
              lightImpact();
              setShowAddModal(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[gs.addItemIcon, { backgroundColor: group.color + '12' }]}>
              <Plus size={14} color={group.color} />
            </View>
            <Text style={gs.addItemText}>Add custom item</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {activeMenuItem && (
        <ItemActionsMenu
          visible={!!activeMenuItemId}
          onClose={() => setActiveMenuItemId(null)}
          onRemove={() => {
            mediumImpact();
            onRemoveItem(group.key, activeMenuItem.id);
          }}
          onDuplicate={() => {
            lightImpact();
            onDuplicateItem(group.key, activeMenuItem.id);
          }}
          onSync={() => {
            lightImpact();
            onSyncItem(group.key, activeMenuItem.id);
          }}
          canSync={matchedNames.has(activeMenuItem.name.toLowerCase())}
          itemName={activeMenuItem.name}
        />
      )}

      <AddItemModal
        visible={showAddModal}
        groupKey={group.key}
        onClose={() => setShowAddModal(false)}
        onAdd={onAddCustomItem}
      />
    </View>
  );
}

export default function RecommendedChecklist({
  appliances,
  recommendedGroups,
  onAddItem,
  onRemoveRecommendedItem,
  onDuplicateRecommendedItem,
  onSyncRecommendedItem,
  onAddCustomRecommendedItem,
}: RecommendedChecklistProps) {
  const { colors: c } = useTheme();
  const s = useMemo(() => createStyles(c), [c]);
  const [collapsed, setCollapsed] = useState(true);
  const sectionAnim = useRef(new Animated.Value(0)).current;
  const chevronAnim = useRef(new Animated.Value(0)).current;

  const matchedNames = useMemo(() => {
    const names = new Set<string>();
    appliances.forEach((a) => names.add(a.name.toLowerCase()));
    return names;
  }, [appliances]);

  const matchedApplianceMap = useMemo(() => {
    const map = new Map<string, Appliance>();
    appliances.forEach((a) => map.set(a.name.toLowerCase(), a));
    return map;
  }, [appliances]);

  const totalItems = useMemo(
    () => recommendedGroups.reduce((sum, g) => sum + g.items.length, 0),
    [recommendedGroups]
  );
  const totalAdded = useMemo(
    () =>
      recommendedGroups.reduce(
        (sum, g) => sum + g.items.filter((i) => matchedNames.has(i.name.toLowerCase())).length,
        0
      ),
    [matchedNames, recommendedGroups]
  );

  const progressPercent = totalItems > 0 ? totalAdded / totalItems : 0;

  const toggleCollapsed = useCallback(() => {
    lightImpact();
    const toValue = collapsed ? 1 : 0;
    setCollapsed(!collapsed);
    Animated.parallel([
      Animated.timing(sectionAnim, {
        toValue,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(chevronAnim, {
        toValue,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [collapsed, sectionAnim, chevronAnim]);

  const sectionMaxHeight = sectionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 3000],
  });

  const chevronRotation = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <View style={s.wrapper}>
      <TouchableOpacity
        style={s.headerRow}
        onPress={toggleCollapsed}
        activeOpacity={0.7}
        testID="recommended-checklist-toggle"
      >
        <View style={s.headerLeft}>
          <View style={s.headerIconWrap}>
            <ClipboardList size={18} color={c.primary} />
          </View>
          <View>
            <Text style={s.headerTitle}>Recommended Items</Text>
            <Text style={s.headerSubtitle}>
              {totalAdded} of {totalItems} items tracked
            </Text>
          </View>
        </View>
        <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
          <ChevronRight size={20} color={c.textTertiary} />
        </Animated.View>
      </TouchableOpacity>

      <View style={s.progressBarBg}>
        <View style={[s.progressBarFill, { width: `${progressPercent * 100}%` }]} />
      </View>

      <Animated.View style={{ maxHeight: sectionMaxHeight, overflow: 'hidden' }}>
        <View style={s.groupsContainer}>
          {recommendedGroups.map((group) => (
            <GroupSection
              key={group.key}
              group={group}
              matchedNames={matchedNames}
              matchedApplianceMap={matchedApplianceMap}
              onAddItem={onAddItem}
              onRemoveItem={onRemoveRecommendedItem}
              onDuplicateItem={onDuplicateRecommendedItem}
              onSyncItem={onSyncRecommendedItem}
              onAddCustomItem={onAddCustomRecommendedItem}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const createStyles = (c: ColorScheme) => StyleSheet.create({
  wrapper: {
    backgroundColor: c.surface,
    borderRadius: 18,
    marginTop: 20,
    marginBottom: 12,
    shadowColor: c.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: c.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: c.text,
    lineHeight: 22,
  },
  headerSubtitle: {
    fontSize: 12,
    color: c.textSecondary,
    lineHeight: 16,
    marginTop: 1,
  },
  progressBarBg: {
    height: 3,
    backgroundColor: c.surfaceAlt,
    marginHorizontal: 16,
    borderRadius: 2,
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: c.primary,
    borderRadius: 2,
  },
  groupsContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
});

const createGroupStyles = (c: ColorScheme) => StyleSheet.create({
  container: {
    marginBottom: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: c.text,
    lineHeight: 19,
  },
  headerCount: {
    fontSize: 11,
    color: c.textTertiary,
    lineHeight: 15,
    marginTop: 1,
  },
  doneBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: c.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  itemsWrap: {},
  itemsList: {
    paddingLeft: 48,
    paddingBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.borderLight,
  },
  itemNameWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemName: {
    fontSize: 14,
    color: c.text,
    lineHeight: 19,
    flexShrink: 1,
  },
  itemNameDone: {
    color: c.textTertiary,
    textDecorationLine: 'line-through',
  },
  customBadge: {
    backgroundColor: c.warningLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  customBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: c.warning,
    lineHeight: 13,
  },
  syncBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: c.warningLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: c.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: c.primary,
    lineHeight: 16,
  },
  addedLabel: {
    fontSize: 12,
    color: c.textTertiary,
    fontWeight: '500',
    lineHeight: 16,
  },
  moreBtn: {
    paddingLeft: 4,
    paddingVertical: 2,
  },
  addItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    marginTop: 2,
  },
  addItemIcon: {
    width: 26,
    height: 26,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addItemText: {
    fontSize: 13,
    fontWeight: '500',
    color: c.textSecondary,
    lineHeight: 18,
  },
});

const createMenuStyles = (c: ColorScheme) => StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: -500,
    left: -500,
    right: -500,
    bottom: -500,
    zIndex: 999,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backdropTouch: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: c.overlay,
  },
  container: {
    width: '85%',
    maxWidth: 340,
    backgroundColor: c.surface,
    borderRadius: 20,
    paddingTop: 10,
    paddingBottom: 16,
    paddingHorizontal: 6,
    zIndex: 1000,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: c.borderLight,
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: c.text,
    textAlign: 'center',
    marginBottom: 14,
    paddingHorizontal: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTextWrap: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
    lineHeight: 20,
  },
  optionDesc: {
    fontSize: 12,
    color: c.textTertiary,
    lineHeight: 16,
    marginTop: 1,
  },
  cancelBtn: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: c.surfaceAlt,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: c.textSecondary,
  },
});

const createAddModalStyles = (c: ColorScheme) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: c.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: c.surface,
    borderRadius: 20,
    padding: 22,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: c.text,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: c.textSecondary,
    marginBottom: 6,
    lineHeight: 17,
  },
  input: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: c.text,
    backgroundColor: c.surfaceAlt,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: c.surfaceAlt,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: c.textSecondary,
  },
  addBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: c.primary,
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: c.white,
  },
});
