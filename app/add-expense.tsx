import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  ImageIcon,
  X,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Receipt,
  Phone,
  Mail,
  MapPin,
  Globe,
  FileText,
  CreditCard,
  Hash,
  StickyNote,
} from 'lucide-react-native';
import { useHome } from '@/contexts/HomeContext';
import Colors from '@/constants/colors';
import { BudgetCategory, ExpenseProvider, TrustedPro } from '@/types';
import formStyles from '@/constants/formStyles';
import ApplianceChipSelector from '@/components/ApplianceChipSelector';
import { successNotification, lightImpact } from '@/utils/haptics';

const CATEGORIES: { key: BudgetCategory; label: string; color: string }[] = [
  { key: 'maintenance', label: 'Maintenance', color: Colors.categoryMaintenance },
  { key: 'repair', label: 'Repair', color: Colors.categoryRepair },
  { key: 'upgrade', label: 'Upgrade', color: Colors.categoryUpgrade },
  { key: 'emergency', label: 'Emergency', color: Colors.categoryEmergency },
  { key: 'inspection', label: 'Inspection', color: Colors.categoryInspection },
];

const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'Check', 'Venmo', 'Zelle', 'PayPal', 'Other'];

export default function AddExpenseScreen() {
  const router = useRouter();
  const { addBudgetItem, appliances, trustedPros, addTrustedPro } = useHome();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<BudgetCategory>('maintenance');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedApplianceId, setSelectedApplianceId] = useState<string>('');
  const [receiptImages, setReceiptImages] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [expenseNotes, setExpenseNotes] = useState('');
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);

  const [providerExpanded, setProviderExpanded] = useState(false);
  const [providerName, setProviderName] = useState('');
  const [providerPhone, setProviderPhone] = useState('');
  const [providerEmail, setProviderEmail] = useState('');
  const [providerWebsite, setProviderWebsite] = useState('');
  const [providerAddress, setProviderAddress] = useState('');
  const [providerSpecialty, setProviderSpecialty] = useState('');
  const [providerNotes, setProviderNotes] = useState('');
  const [selectedTrustedProId, setSelectedTrustedProId] = useState<string>('');

  const takePhoto = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera access is required to take receipt photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
      });
      if (!result.canceled && result.assets[0]) {
        lightImpact();
        setReceiptImages((prev) => [...prev, result.assets[0].uri]);
        console.log('[AddExpense] Photo captured:', result.assets[0].uri);
      }
    } catch (e) {
      console.error('[AddExpense] Camera error:', e);
      Alert.alert('Error', 'Could not open camera.');
    }
  }, []);

  const pickImage = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Photo library access is required to attach receipts.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 5,
      });
      if (!result.canceled && result.assets.length > 0) {
        lightImpact();
        const uris = result.assets.map((a) => a.uri);
        setReceiptImages((prev) => [...prev, ...uris]);
        console.log('[AddExpense] Images picked:', uris.length);
      }
    } catch (e) {
      console.error('[AddExpense] Image picker error:', e);
      Alert.alert('Error', 'Could not open photo library.');
    }
  }, []);

  const removeImage = useCallback((index: number) => {
    lightImpact();
    setReceiptImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const selectTrustedPro = useCallback((pro: TrustedPro) => {
    lightImpact();
    setSelectedTrustedProId(pro.id);
    setProviderName(pro.name);
    setProviderPhone(pro.phone ?? '');
    setProviderEmail(pro.email ?? '');
    setProviderWebsite(pro.website ?? '');
    setProviderAddress(pro.address ?? '');
    setProviderSpecialty(pro.specialty ?? '');
    setProviderNotes(pro.notes ?? '');
    setProviderExpanded(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!description.trim()) {
      Alert.alert('Just a moment', 'Please describe this expense');
      return;
    }
    if (!amount.trim() || isNaN(parseFloat(amount))) {
      Alert.alert('Just a moment', 'Please enter a valid amount');
      return;
    }

    successNotification();

    const expenseId = Date.now().toString();

    let provider: ExpenseProvider | undefined;
    if (providerName.trim()) {
      provider = {
        name: providerName.trim(),
        phone: providerPhone.trim() || undefined,
        email: providerEmail.trim() || undefined,
        website: providerWebsite.trim() || undefined,
        address: providerAddress.trim() || undefined,
        specialty: providerSpecialty.trim() || undefined,
        notes: providerNotes.trim() || undefined,
      };

      if (selectedTrustedProId) {
        const existingPro = trustedPros.find((p) => p.id === selectedTrustedProId);
        if (existingPro) {
          console.log('[AddExpense] Linking expense to existing Trusted Pro:', existingPro.name);
        }
      } else {
        const newPro: TrustedPro = {
          id: `pro-${Date.now()}`,
          name: providerName.trim(),
          specialty: providerSpecialty.trim() || category,
          phone: providerPhone.trim() || undefined,
          email: providerEmail.trim() || undefined,
          website: providerWebsite.trim() || undefined,
          address: providerAddress.trim() || undefined,
          notes: providerNotes.trim() || undefined,
          expenseIds: [expenseId],
          createdAt: new Date().toISOString(),
        };
        addTrustedPro(newPro);
        console.log('[AddExpense] Created new Trusted Pro:', newPro.name);
      }
    }

    addBudgetItem({
      id: expenseId,
      description: description.trim(),
      amount: parseFloat(amount),
      category,
      date,
      applianceId: selectedApplianceId || undefined,
      receiptImages: receiptImages.length > 0 ? receiptImages : undefined,
      provider,
      paymentMethod: paymentMethod || undefined,
      invoiceNumber: invoiceNumber.trim() || undefined,
      notes: expenseNotes.trim() || undefined,
    });

    router.back();
  }, [
    description, amount, category, date, selectedApplianceId,
    receiptImages, providerName, providerPhone, providerEmail,
    providerWebsite, providerAddress, providerSpecialty, providerNotes,
    paymentMethod, invoiceNumber, expenseNotes, selectedTrustedProId,
    trustedPros, addBudgetItem, addTrustedPro, router,
  ]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={formStyles.content}>
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>How much?</Text>
          <View style={styles.amountInputRow}>
            <Text style={styles.amountSign}>$</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor={Colors.textTertiary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              testID="expense-amount"
            />
          </View>
        </View>

        <View style={formStyles.section}>
          <Text style={formStyles.sectionLabel}>Details</Text>
          <View style={formStyles.card}>
            <View style={formStyles.inputRow}>
              <View style={formStyles.inputContent}>
                <Text style={formStyles.inputLabel}>What was it for?</Text>
                <TextInput
                  style={formStyles.textInput}
                  placeholder="e.g. AC filter replacement"
                  placeholderTextColor={Colors.textTertiary}
                  value={description}
                  onChangeText={setDescription}
                  testID="expense-description"
                />
              </View>
            </View>
            <View style={formStyles.divider} />
            <View style={formStyles.inputRow}>
              <View style={formStyles.inputContent}>
                <Text style={formStyles.inputLabel}>Date</Text>
                <TextInput
                  style={formStyles.textInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.textTertiary}
                  value={date}
                  onChangeText={setDate}
                  testID="expense-date"
                />
              </View>
            </View>
            <View style={formStyles.divider} />
            <View style={formStyles.inputRow}>
              <View style={formStyles.inputContent}>
                <Text style={formStyles.inputLabel}>Invoice / Reference #</Text>
                <TextInput
                  style={formStyles.textInput}
                  placeholder="Optional"
                  placeholderTextColor={Colors.textTertiary}
                  value={invoiceNumber}
                  onChangeText={setInvoiceNumber}
                />
              </View>
              <Hash size={16} color={Colors.textTertiary} />
            </View>
            <View style={formStyles.divider} />
            <TouchableOpacity
              style={formStyles.inputRow}
              onPress={() => setShowPaymentPicker(!showPaymentPicker)}
              activeOpacity={0.7}
            >
              <View style={formStyles.inputContent}>
                <Text style={formStyles.inputLabel}>Payment method</Text>
                <Text style={[formStyles.textInput, !paymentMethod && { color: Colors.textTertiary }]}>
                  {paymentMethod || 'Select'}
                </Text>
              </View>
              <CreditCard size={16} color={Colors.textTertiary} />
            </TouchableOpacity>
            {showPaymentPicker && (
              <View style={styles.paymentGrid}>
                {PAYMENT_METHODS.map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.paymentChip,
                      paymentMethod === method && styles.paymentChipActive,
                    ]}
                    onPress={() => {
                      lightImpact();
                      setPaymentMethod(method);
                      setShowPaymentPicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.paymentChipText,
                        paymentMethod === method && styles.paymentChipTextActive,
                      ]}
                    >
                      {method}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={formStyles.divider} />
            <View style={formStyles.inputRow}>
              <View style={formStyles.inputContent}>
                <Text style={formStyles.inputLabel}>Notes</Text>
                <TextInput
                  style={[formStyles.textInput, { minHeight: 40 }]}
                  placeholder="Any additional details"
                  placeholderTextColor={Colors.textTertiary}
                  value={expenseNotes}
                  onChangeText={setExpenseNotes}
                  multiline
                />
              </View>
              <StickyNote size={16} color={Colors.textTertiary} />
            </View>
          </View>
        </View>

        <View style={formStyles.section}>
          <Text style={formStyles.sectionLabel}>Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryChip,
                  category === cat.key && { backgroundColor: cat.color, borderColor: cat.color },
                ]}
                onPress={() => setCategory(cat.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    category === cat.key && { color: Colors.white },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={formStyles.section}>
          <Text style={formStyles.sectionLabel}>Receipt</Text>
          <View style={styles.receiptSection}>
            <View style={styles.receiptActions}>
              <TouchableOpacity style={styles.receiptBtn} onPress={takePhoto} activeOpacity={0.7}>
                <View style={[styles.receiptBtnIcon, { backgroundColor: Colors.primaryLight }]}>
                  <Camera size={20} color={Colors.primary} />
                </View>
                <Text style={styles.receiptBtnText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.receiptBtn} onPress={pickImage} activeOpacity={0.7}>
                <View style={[styles.receiptBtnIcon, { backgroundColor: Colors.accentLight }]}>
                  <ImageIcon size={20} color={Colors.accent} />
                </View>
                <Text style={styles.receiptBtnText}>From Library</Text>
              </TouchableOpacity>
            </View>

            {receiptImages.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.receiptImagesRow}
              >
                {receiptImages.map((uri, idx) => (
                  <View key={`receipt-${idx}`} style={styles.receiptImageWrap}>
                    <Image source={{ uri }} style={styles.receiptImage} />
                    <TouchableOpacity
                      style={styles.receiptRemoveBtn}
                      onPress={() => removeImage(idx)}
                      activeOpacity={0.7}
                    >
                      <X size={12} color={Colors.white} />
                    </TouchableOpacity>
                    <View style={styles.receiptBadge}>
                      <Receipt size={10} color={Colors.white} />
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>

        <View style={formStyles.section}>
          <TouchableOpacity
            style={styles.providerHeader}
            onPress={() => {
              lightImpact();
              setProviderExpanded(!providerExpanded);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.providerHeaderLeft}>
              <View style={[styles.providerHeaderIcon, { backgroundColor: '#E8F0FE' }]}>
                <UserCheck size={18} color="#4A7FBF" />
              </View>
              <View>
                <Text style={formStyles.sectionLabel}>Service Provider</Text>
                <Text style={styles.providerSubtext}>
                  {providerName ? providerName : 'Add to build your Trusted Pro list'}
                </Text>
              </View>
            </View>
            {providerExpanded ? (
              <ChevronUp size={20} color={Colors.textTertiary} />
            ) : (
              <ChevronDown size={20} color={Colors.textTertiary} />
            )}
          </TouchableOpacity>

          {providerExpanded && (
            <View>
              {trustedPros.length > 0 && !selectedTrustedProId && (
                <View style={styles.trustedProPicker}>
                  <Text style={styles.trustedProPickerLabel}>Select a Trusted Pro</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.trustedProChips}
                  >
                    {trustedPros.map((pro) => (
                      <TouchableOpacity
                        key={pro.id}
                        style={styles.trustedProChip}
                        onPress={() => selectTrustedPro(pro)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.trustedProAvatar}>
                          <Text style={styles.trustedProAvatarText}>
                            {pro.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.trustedProChipName} numberOfLines={1}>
                          {pro.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {selectedTrustedProId && (
                <TouchableOpacity
                  style={styles.clearProBtn}
                  onPress={() => {
                    setSelectedTrustedProId('');
                    setProviderName('');
                    setProviderPhone('');
                    setProviderEmail('');
                    setProviderWebsite('');
                    setProviderAddress('');
                    setProviderSpecialty('');
                    setProviderNotes('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.clearProBtnText}>Clear selection — enter new provider</Text>
                </TouchableOpacity>
              )}

              <View style={formStyles.card}>
                <View style={formStyles.inputRow}>
                  <View style={formStyles.inputContent}>
                    <Text style={formStyles.inputLabel}>Provider name *</Text>
                    <TextInput
                      style={formStyles.textInput}
                      placeholder="e.g. ProAir HVAC Services"
                      placeholderTextColor={Colors.textTertiary}
                      value={providerName}
                      onChangeText={setProviderName}
                    />
                  </View>
                  <UserCheck size={16} color={Colors.textTertiary} />
                </View>
                <View style={formStyles.divider} />
                <View style={formStyles.inputRow}>
                  <View style={formStyles.inputContent}>
                    <Text style={formStyles.inputLabel}>Specialty</Text>
                    <TextInput
                      style={formStyles.textInput}
                      placeholder="e.g. Plumbing, HVAC, Electrical"
                      placeholderTextColor={Colors.textTertiary}
                      value={providerSpecialty}
                      onChangeText={setProviderSpecialty}
                    />
                  </View>
                  <FileText size={16} color={Colors.textTertiary} />
                </View>
                <View style={formStyles.divider} />
                <View style={formStyles.inputRow}>
                  <View style={formStyles.inputContent}>
                    <Text style={formStyles.inputLabel}>Phone</Text>
                    <TextInput
                      style={formStyles.textInput}
                      placeholder="(555) 123-4567"
                      placeholderTextColor={Colors.textTertiary}
                      value={providerPhone}
                      onChangeText={setProviderPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                  <Phone size={16} color={Colors.textTertiary} />
                </View>
                <View style={formStyles.divider} />
                <View style={formStyles.inputRow}>
                  <View style={formStyles.inputContent}>
                    <Text style={formStyles.inputLabel}>Email</Text>
                    <TextInput
                      style={formStyles.textInput}
                      placeholder="contact@provider.com"
                      placeholderTextColor={Colors.textTertiary}
                      value={providerEmail}
                      onChangeText={setProviderEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  <Mail size={16} color={Colors.textTertiary} />
                </View>
                <View style={formStyles.divider} />
                <View style={formStyles.inputRow}>
                  <View style={formStyles.inputContent}>
                    <Text style={formStyles.inputLabel}>Website</Text>
                    <TextInput
                      style={formStyles.textInput}
                      placeholder="www.provider.com"
                      placeholderTextColor={Colors.textTertiary}
                      value={providerWebsite}
                      onChangeText={setProviderWebsite}
                      autoCapitalize="none"
                    />
                  </View>
                  <Globe size={16} color={Colors.textTertiary} />
                </View>
                <View style={formStyles.divider} />
                <View style={formStyles.inputRow}>
                  <View style={formStyles.inputContent}>
                    <Text style={formStyles.inputLabel}>Address</Text>
                    <TextInput
                      style={formStyles.textInput}
                      placeholder="123 Main St, City, State"
                      placeholderTextColor={Colors.textTertiary}
                      value={providerAddress}
                      onChangeText={setProviderAddress}
                    />
                  </View>
                  <MapPin size={16} color={Colors.textTertiary} />
                </View>
                <View style={formStyles.divider} />
                <View style={formStyles.inputRow}>
                  <View style={formStyles.inputContent}>
                    <Text style={formStyles.inputLabel}>Notes</Text>
                    <TextInput
                      style={[formStyles.textInput, { minHeight: 40 }]}
                      placeholder="Any notes about this provider"
                      placeholderTextColor={Colors.textTertiary}
                      value={providerNotes}
                      onChangeText={setProviderNotes}
                      multiline
                    />
                  </View>
                  <StickyNote size={16} color={Colors.textTertiary} />
                </View>
              </View>
            </View>
          )}
        </View>

        {appliances.length > 0 && (
          <View style={formStyles.section}>
            <Text style={formStyles.sectionLabel}>Related item</Text>
            <ApplianceChipSelector
              appliances={appliances}
              selectedId={selectedApplianceId}
              onSelect={setSelectedApplianceId}
            />
          </View>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85} testID="save-expense">
          <Text style={styles.saveBtnText}>Log Expense</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  amountSection: {
    alignItems: 'center',
    paddingVertical: 28,
    marginBottom: 20,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginBottom: 10,
    lineHeight: 19,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountSign: {
    fontSize: 28,
    fontWeight: '300' as const,
    color: Colors.textTertiary,
    marginRight: 4,
  },
  amountInput: {
    fontSize: 38,
    fontWeight: '800' as const,
    color: Colors.text,
    minWidth: 120,
    textAlign: 'center',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  paymentChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  paymentChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  paymentChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  paymentChipTextActive: {
    color: Colors.white,
  },
  receiptSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 1,
  },
  receiptActions: {
    flexDirection: 'row',
    gap: 12,
  },
  receiptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  receiptBtnIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 17,
  },
  receiptImagesRow: {
    paddingTop: 14,
    gap: 10,
  },
  receiptImageWrap: {
    width: 90,
    height: 110,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceAlt,
  },
  receiptImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  receiptRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 1,
  },
  providerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  providerHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerSubtext: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 1,
    lineHeight: 16,
  },
  trustedProPicker: {
    marginBottom: 12,
  },
  trustedProPickerLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  trustedProChips: {
    gap: 10,
  },
  trustedProChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  trustedProAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4A7FBF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trustedProAvatarText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  trustedProChipName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    maxWidth: 120,
  },
  clearProBtn: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.dangerLight,
    borderRadius: 8,
  },
  clearProBtnText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.danger,
  },
  saveBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
    lineHeight: 22,
  },
});
