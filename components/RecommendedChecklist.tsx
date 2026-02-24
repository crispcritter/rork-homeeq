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
  ScrollView,
  Platform,
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
import Colors from '@/constants/colors';
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

const CATEGORY_OPTIONS: { key: ApplianceCategory; label: string }[] = [
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
  if (!visible) return null;

  return (
    <View style={menuStyles.backdrop}>
      <TouchableOpacity style={menuStyles.backdropTouch} onPress={onClose} activeOpacity={1} />
      <View style={menuStyles.container}>
        <View style={menuStyles.handle} />
        <Text style={menuStyles.title} numberOfLines={1}>{itemName}</Text>

        {canSync && (
          <TouchableOpacity
            style={menuStyles.option}
            onPress={() => { onSync(); onClose(); }}
            activeOpacity={0.7}
          >
            <View style={[menuStyles.optionIcon, { backgroundColor: Colors.primaryLight }]}>
              <RefreshCw size={16} color={Colors.primary} />
            </View>
            <View style={menuStyles.optionTextWrap}>
              <Text style={menuStyles.optionLabel}>Sync with My Items</Text>
              <Text style={menuStyles.optionDesc}>Update from your tracked appliance</Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={menuStyles.option}
          onPress={() => { onDuplicate(); onClose(); }}
          activeOpacity={0.7}
        >
          <View style={[menuStyles.optionIcon, { backgroundColor: Colors.warningLight }]}>
            <Copy size={16} color={Colors.warning} />
          </View>
          <View style={menuStyles.optionTextWrap}>
            <Text style={menuStyles.optionLabel}>Duplicate</Text>
            <Text style={menuStyles.optionDesc}>Create a copy of this item</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={menuStyles.option}
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
          <View style={[menuStyles.optionIcon, { backgroundColor: Colors.dangerLight }]}>
            <Trash2 size={16} color={Colors.danger} />
          </View>
          <View style={menuStyles.optionTextWrap}>
            <Text style={[menuStyles.optionLabel, { color: Colors.danger }]}>Remove</Text>
            <Text style={menuStyles.optionDesc}>Remove from recommended list</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={menuStyles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={menuStyles.cancelText}>Cancel</Text>
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
      <View style={addModalStyles.overlay}>
        <View style={addModalStyles.card}>
          <View style={addModalStyles.header}>
            <Text style={addModalStyles.headerTitle}>Add Item to {meta?.label || 'List'}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <X size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={addModalStyles.field}>
            <Text style={addModalStyles.label}>Item Name</Text>
            <TextInput
              style={addModalStyles.input}
              placeholder="e.g. Ice Maker"
              placeholderTextColor={Colors.textTertiary}
              value={name}
              onChangeText={setName}
              autoFocus
              testID="add-rec-item-name"
            />
          </View>

          <View style={addModalStyles.field}>
            <Text style={addModalStyles.label}>Location</Text>
            <TextInput
              style={addModalStyles.input}
              placeholder="e.g. Kitchen"
              placeholderTextColor={Colors.textTertiary}
              value={location}
              onChangeText={setLocation}
              testID="add-rec-item-location"
            />
          </View>

          <View style={addModalStyles.actions}>
            <TouchableOpacity style={addModalStyles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={addModalStyles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[addModalStyles.addBtn, !name.trim() && addModalStyles.addBtnDisabled]}
              onPress={handleAdd}
              activeOpacity={0.7}
              disabled={!name.trim()}
              testID="add-rec-item-submit"
            >
              <Plus size={16} color={Colors.white} />
              <Text style={addModalStyles.addBtnText}>Add Item</Text>
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
    <View style={groupStyles.container}>
      <TouchableOpacity
        style={groupStyles.header}
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <View style={[groupStyles.iconWrap, { backgroundColor: group.color + '18' }]}>
          <IconComponent size={16} color={group.color} />
        </View>
        <View style={groupStyles.headerTextWrap}>
          <Text style={groupStyles.headerTitle}>{group.label}</Text>
          <Text style={[groupStyles.headerCount, allDone && { color: Colors.success }]}>
            {checkedCount}/{totalCount} added
          </Text>
        </View>
        {allDone && (
          <View style={groupStyles.doneBadge}>
            <CheckCircle2 size={12} color={Colors.white} />
          </View>
        )}
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <ChevronDown size={18} color={Colors.textTertiary} />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View style={[groupStyles.itemsWrap, { maxHeight, overflow: 'hidden' }]}>
        <View style={groupStyles.itemsList}>
          {group.items.map((item) => {
            const isAdded = matchedNames.has(item.name.toLowerCase());
            const matchedAppliance = matchedApplianceMap.get(item.name.toLowerCase());
            const hasDetailDiff = isAdded && matchedAppliance && (
              matchedAppliance.location !== item.location ||
              matchedAppliance.category !== item.category
            );

            return (
              <View key={item.id} style={groupStyles.itemRow}>
                {isAdded ? (
                  <CheckCircle2 size={18} color={Colors.success} />
                ) : (
                  <Circle size={18} color={Colors.border} />
                )}
                <View style={groupStyles.itemNameWrap}>
                  <Text
                    style={[
                      groupStyles.itemName,
                      isAdded && groupStyles.itemNameDone,
                    ]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  {item.isCustom && (
                    <View style={groupStyles.customBadge}>
                      <Text style={groupStyles.customBadgeText}>Custom</Text>
                    </View>
                  )}
                  {hasDetailDiff && (
                    <View style={groupStyles.syncBadge}>
                      <RefreshCw size={9} color={Colors.warning} />
                    </View>
                  )}
                </View>
                {!isAdded && (
                  <TouchableOpacity
                    style={groupStyles.addBtn}
                    onPress={() => {
                      lightImpact();
                      onAddItem(item);
                    }}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Plus size={13} color={Colors.primary} />
                    <Text style={groupStyles.addBtnText}>Add</Text>
                  </TouchableOpacity>
                )}
                {isAdded && (
                  <Text style={groupStyles.addedLabel}>Added</Text>
                )}
                <TouchableOpacity
                  style={groupStyles.moreBtn}
                  onPress={() => {
                    lightImpact();
                    setActiveMenuItemId(item.id);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                  activeOpacity={0.6}
                >
                  <MoreHorizontal size={16} color={Colors.textTertiary} />
                </TouchableOpacity>
              </View>
            );
          })}

          <TouchableOpacity
            style={groupStyles.addItemRow}
            onPress={() => {
              lightImpact();
              setShowAddModal(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[groupStyles.addItemIcon, { backgroundColor: group.color + '12' }]}>
              <Plus size={14} color={group.color} />
            </View>
            <Text style={groupStyles.addItemText}>Add custom item</Text>
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
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.headerRow}
        onPress={toggleCollapsed}
        activeOpacity={0.7}
        testID="recommended-checklist-toggle"
      >
        <View style={styles.headerLeft}>
          <View style={styles.headerIconWrap}>
            <ClipboardList size={18} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Recommended Items</Text>
            <Text style={styles.headerSubtitle}>
              {totalAdded} of {totalItems} items tracked
            </Text>
          </View>
        </View>
        <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
          <ChevronRight size={20} color={Colors.textTertiary} />
        </Animated.View>
      </TouchableOpacity>

      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progressPercent * 100}%` }]} />
      </View>

      <Animated.View style={{ maxHeight: sectionMaxHeight, overflow: 'hidden' }}>
        <View style={styles.groupsContainer}>
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

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    marginTop: 20,
    marginBottom: 12,
    shadowColor: Colors.cardShadow,
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
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    lineHeight: 22,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginTop: 1,
  },
  progressBarBg: {
    height: 3,
    backgroundColor: Colors.surfaceAlt,
    marginHorizontal: 16,
    borderRadius: 2,
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  groupsContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
});

const groupStyles = StyleSheet.create({
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
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 19,
  },
  headerCount: {
    fontSize: 11,
    color: Colors.textTertiary,
    lineHeight: 15,
    marginTop: 1,
  },
  doneBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.success,
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
    borderBottomColor: Colors.borderLight,
  },
  itemNameWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemName: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 19,
    flexShrink: 1,
  },
  itemNameDone: {
    color: Colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  customBadge: {
    backgroundColor: Colors.warningLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  customBadgeText: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: Colors.warning,
    lineHeight: 13,
  },
  syncBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.warningLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
    lineHeight: 16,
  },
  addedLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: '500' as const,
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
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});

const menuStyles = StyleSheet.create({
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
    backgroundColor: Colors.overlay,
  },
  container: {
    width: '85%',
    maxWidth: 340,
    backgroundColor: Colors.surface,
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
    backgroundColor: Colors.borderLight,
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
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
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 20,
  },
  optionDesc: {
    fontSize: 12,
    color: Colors.textTertiary,
    lineHeight: 16,
    marginTop: 1,
  },
  cancelBtn: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
});

const addModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
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
    fontWeight: '700' as const,
    color: Colors.text,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 6,
    lineHeight: 17,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.surfaceAlt,
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
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  addBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
});
