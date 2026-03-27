import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Modal,
  StyleSheet,
  Animated,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { ColorScheme } from '@/constants/colors';

interface DatePickerFieldProps {
  label: string;
  value: string;
  onChange: (dateString: string) => void;
  placeholder?: string;
  colors: ColorScheme;
  testID?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

function parseDateString(str: string): Date | null {
  if (!str || str.length < 10) return null;
  const parts = str.split('-');
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  const date = new Date(y, m, d);
  if (date.getFullYear() !== y || date.getMonth() !== m || date.getDate() !== d) return null;
  return date;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(date: Date): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export default function DatePickerField({
  label,
  value,
  onChange,
  placeholder = 'Select a date',
  colors: c,
  testID,
  minimumDate,
  maximumDate,
}: DatePickerFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const currentDate = parseDateString(value) ?? new Date();

  const displayText = value && parseDateString(value)
    ? formatDisplayDate(parseDateString(value)!)
    : '';

  const openPicker = useCallback(() => {
    if (Platform.OS === 'android') {
      setShowAndroidPicker(true);
    } else {
      setShowPicker(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [fadeAnim]);

  const closePicker = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowPicker(false));
  }, [fadeAnim]);

  const handleChange = useCallback((_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowAndroidPicker(false);
      if (_event.type === 'set' && selectedDate) {
        onChange(formatDate(selectedDate));
      }
      return;
    }
    if (selectedDate) {
      onChange(formatDate(selectedDate));
    }
  }, [onChange]);

  const handleConfirm = useCallback(() => {
    if (!value) {
      const fallback = parseDateString(value) ?? new Date();
      onChange(formatDate(fallback));
    }
    closePicker();
  }, [value, onChange, closePicker]);

  if (Platform.OS === 'web') {
    return (
      <View>
        <Text style={[localStyles.label, { color: c.textSecondary }]}>{label}</Text>
        <TouchableOpacity
          style={[localStyles.fieldRow, { borderColor: 'transparent' }]}
          activeOpacity={0.7}
          testID={testID}
          onPress={() => {
            const input = document.createElement('input');
            input.type = 'date';
            input.value = value || '';
            input.style.position = 'fixed';
            input.style.opacity = '0';
            input.style.top = '0';
            input.style.left = '0';
            document.body.appendChild(input);
            input.addEventListener('change', () => {
              if (input.value) {
                onChange(input.value);
              }
              document.body.removeChild(input);
            });
            input.addEventListener('blur', () => {
              setTimeout(() => {
                if (document.body.contains(input)) {
                  document.body.removeChild(input);
                }
              }, 300);
            });
            input.focus();
            input.click();
          }}
        >
          <Text style={[
            localStyles.valueText,
            { color: displayText ? c.text : c.textTertiary },
          ]}>
            {displayText || placeholder}
          </Text>
          <Calendar size={16} color={c.textTertiary} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      <Text style={[localStyles.label, { color: c.textSecondary }]}>{label}</Text>
      <TouchableOpacity
        style={[localStyles.fieldRow, { borderColor: 'transparent' }]}
        onPress={openPicker}
        activeOpacity={0.7}
        testID={testID}
      >
        <Text style={[
          localStyles.valueText,
          { color: displayText ? c.text : c.textTertiary },
        ]}>
          {displayText || placeholder}
        </Text>
        <Calendar size={16} color={c.textTertiary} />
      </TouchableOpacity>

      {showAndroidPicker && (
        <DateTimePicker
          value={currentDate}
          mode="date"
          display="default"
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}

      {showPicker && Platform.OS === 'ios' && (
        <Modal transparent animationType="none" visible={showPicker}>
          <Animated.View style={[localStyles.modalOverlay, { opacity: fadeAnim }]}>
            <TouchableOpacity style={localStyles.overlayBg} onPress={closePicker} activeOpacity={1} />
            <Animated.View
              style={[
                localStyles.pickerSheet,
                {
                  backgroundColor: c.surface,
                  transform: [{
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [300, 0],
                    }),
                  }],
                },
              ]}
            >
              <View style={[localStyles.sheetHandle, { backgroundColor: c.border }]} />
              <View style={localStyles.sheetHeader}>
                <TouchableOpacity onPress={closePicker}>
                  <Text style={[localStyles.sheetCancel, { color: c.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <Text style={[localStyles.sheetTitle, { color: c.text }]}>{label}</Text>
                <TouchableOpacity onPress={handleConfirm}>
                  <Text style={[localStyles.sheetDone, { color: c.primary }]}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={currentDate}
                mode="date"
                display="spinner"
                onChange={handleChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                style={localStyles.picker}
              />
            </Animated.View>
          </Animated.View>
        </Modal>
      )}
    </View>
  );
}

const localStyles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    lineHeight: 16,
  },
  fieldRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  valueText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end' as const,
  },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pickerSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center' as const,
    marginTop: 8,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sheetCancel: {
    fontSize: 16,
    fontWeight: '400',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sheetDone: {
    fontSize: 16,
    fontWeight: '600',
  },
  picker: {
    height: 216,
  },
});
