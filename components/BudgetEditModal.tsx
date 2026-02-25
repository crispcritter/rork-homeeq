import React, { useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Animated,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { ColorScheme } from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';
import { mediumImpact, lightImpact } from '@/utils/haptics';

const QUICK_AMOUNTS = [500, 1000, 1500, 2000, 3000, 5000];

interface BudgetEditModalProps {
  visible: boolean;
  currentBudget: number;
  onSave: (amount: number) => void;
  onClose: () => void;
}

function BudgetEditModal({ visible, currentBudget, onSave, onClose }: BudgetEditModalProps) {
  const { colors: c } = useTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const [editValue, setEditValue] = React.useState('');
  const modalAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      setEditValue(currentBudget.toString());
      Animated.spring(modalAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }).start();
    }
  }, [visible, currentBudget]);

  const handleClose = useCallback(() => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onClose());
  }, [modalAnim, onClose]);

  const handleSave = useCallback(() => {
    const parsed = parseFloat(editValue.replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed) && parsed >= 0) {
      onSave(parsed);
      console.log('[BudgetEditModal] Monthly budget updated to:', parsed);
      mediumImpact();
    }
    handleClose();
  }, [editValue, onSave, handleClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.modalBackdrop} onPress={handleClose} />
        <Animated.View
          style={[
            styles.modalContent,
            {
              opacity: modalAnim,
              transform: [
                {
                  translateY: modalAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [60, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Monthly Budget</Text>
            <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
              <X size={20} color={c.textTertiary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalInputRow}>
            <Text style={styles.modalCurrency}>$</Text>
            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              keyboardType="numeric"
              autoFocus
              selectTextOnFocus
              placeholder="0"
              placeholderTextColor={c.textTertiary}
              testID="budget-edit-input"
            />
          </View>

          <View style={styles.quickAmounts}>
            {QUICK_AMOUNTS.map((amt) => (
              <TouchableOpacity
                key={amt}
                style={[
                  styles.quickAmountChip,
                  editValue === amt.toString() && styles.quickAmountChipActive,
                ]}
                onPress={() => {
                  setEditValue(amt.toString());
                  lightImpact();
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.quickAmountText,
                    editValue === amt.toString() && styles.quickAmountTextActive,
                  ]}
                >
                  ${amt.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.modalSaveBtn}
            onPress={handleSave}
            activeOpacity={0.8}
            testID="budget-save-btn"
          >
            <Check size={18} color={c.white} />
            <Text style={styles.modalSaveBtnText}>Save Budget</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (c: ColorScheme) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: c.overlay,
  },
  modalContent: {
    backgroundColor: c.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: c.text,
    letterSpacing: -0.3,
  },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surfaceAlt,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
  },
  modalCurrency: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: c.textSecondary,
    marginRight: 4,
  },
  modalInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700' as const,
    color: c.text,
    padding: 0,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  quickAmountChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: c.surfaceAlt,
  },
  quickAmountChipActive: {
    backgroundColor: c.primaryLight,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: c.textSecondary,
  },
  quickAmountTextActive: {
    color: c.primary,
  },
  modalSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: c.primary,
    borderRadius: 16,
    paddingVertical: 16,
  },
  modalSaveBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: c.white,
  },
});

export default React.memo(BudgetEditModal);
