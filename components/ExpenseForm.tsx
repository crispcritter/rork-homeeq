import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
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
import { BudgetCategory, BudgetItemType, ExpenseProvider, TrustedPro, BudgetItem, toISODateString, toISOTimestamp, asISODateString } from '@/types';
import createFormStyles from '@/constants/formStyles';
import createExpenseStyles from '@/styles/expense';
import { EXPENSE_CATEGORY_OPTIONS, PAYMENT_METHODS } from '@/constants/expenseOptions';
import ApplianceChipSelector from '@/components/ApplianceChipSelector';
import DatePickerField from '@/components/DatePickerField';
import { successNotification, lightImpact } from '@/utils/haptics';

interface ExpenseFormProps {
  mode: 'add' | 'edit';
  existingExpense?: BudgetItem;
}

export default function ExpenseForm({ mode, existingExpense }: ExpenseFormProps) {
  const router = useRouter();
  const { colors: c } = useTheme();
  const styles = useMemo(() => createExpenseStyles(c), [c]);
  const formStyles = useMemo(() => createFormStyles(c), [c]);
  const {
    addBudgetItem,
    updateBudgetItem,
    appliances,
    trustedPros,
    addTrustedPro,
    updateTrustedPro,
  } = useHome();

  const isEdit = mode === 'edit';
  const logPrefix = isEdit ? '[EditExpense]' : '[AddExpense]';
  const testIdPrefix = isEdit ? 'edit-expense' : 'expense';

  const [itemType, setItemType] = useState<BudgetItemType>(existingExpense?.type ?? 'expense');
  const [description, setDescription] = useState(existingExpense?.description ?? '');
  const [amount, setAmount] = useState(existingExpense?.amount?.toString() ?? '');
  const [category, setCategory] = useState<BudgetCategory>(existingExpense?.category ?? 'maintenance');
  const [date, setDate] = useState<string>(existingExpense?.date ?? toISODateString(new Date()));
  const [selectedApplianceId, setSelectedApplianceId] = useState<string>(existingExpense?.applianceId ?? '');
  const [receiptImages, setReceiptImages] = useState<string[]>(existingExpense?.receiptImages ?? []);
  const [paymentMethod, setPaymentMethod] = useState(existingExpense?.paymentMethod ?? '');
  const [invoiceNumber, setInvoiceNumber] = useState(existingExpense?.invoiceNumber ?? '');
  const [expenseNotes, setExpenseNotes] = useState(existingExpense?.notes ?? '');
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);
  const [taxDeductible, setTaxDeductible] = useState<boolean>(existingExpense?.taxDeductible ?? false);

  const [providerExpanded, setProviderExpanded] = useState(isEdit ? !!existingExpense?.provider : false);
  const [providerName, setProviderName] = useState(existingExpense?.provider?.name ?? '');
  const [providerPhone, setProviderPhone] = useState(existingExpense?.provider?.phone ?? '');
  const [providerEmail, setProviderEmail] = useState(existingExpense?.provider?.email ?? '');
  const [providerWebsite, setProviderWebsite] = useState(existingExpense?.provider?.website ?? '');
  const [providerAddress, setProviderAddress] = useState(existingExpense?.provider?.address ?? '');
  const [providerSpecialty, setProviderSpecialty] = useState(existingExpense?.provider?.specialty ?? '');
  const [providerNotes, setProviderNotes] = useState(existingExpense?.provider?.notes ?? '');
  const [selectedTrustedProId, setSelectedTrustedProId] = useState<string>(() => {
    if (!existingExpense?.provider) return '';
    const match = trustedPros.find((p) => p.name === existingExpense.provider?.name);
    return match?.id ?? '';
  });

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
        console.log(`${logPrefix} Photo captured:`, result.assets[0].uri);
      }
    } catch (e) {
      console.error(`${logPrefix} Camera error:`, e);
      Alert.alert('Error', 'Could not open camera.');
    }
  }, [logPrefix]);

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
        console.log(`${logPrefix} Images picked:`, uris.length);
      }
    } catch (e) {
      console.error(`${logPrefix} Image picker error:`, e);
      Alert.alert('Error', 'Could not open photo library.');
    }
  }, [logPrefix]);

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

  const clearProviderSelection = useCallback(() => {
    setSelectedTrustedProId('');
    setProviderName('');
    setProviderPhone('');
    setProviderEmail('');
    setProviderWebsite('');
    setProviderAddress('');
    setProviderSpecialty('');
    setProviderNotes('');
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

    const expenseId = existingExpense?.id ?? Date.now().toString();

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

      if (!isEdit && selectedTrustedProId) {
        const existingPro = trustedPros.find((p) => p.id === selectedTrustedProId);
        if (existingPro) {
          const updatedPro = {
            ...existingPro,
            expenseIds: [...(existingPro.expenseIds ?? []), expenseId],
            phone: providerPhone.trim() || existingPro.phone,
            email: providerEmail.trim() || existingPro.email,
            website: providerWebsite.trim() || existingPro.website,
            address: providerAddress.trim() || existingPro.address,
            specialty: providerSpecialty.trim() || existingPro.specialty,
            notes: providerNotes.trim() || existingPro.notes,
          };
          updateTrustedPro(updatedPro);
          console.log(`${logPrefix} Linked expense to existing Trusted Pro:`, existingPro.name);
        }
      } else if (!isEdit && !selectedTrustedProId) {
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
          createdAt: toISOTimestamp(new Date()),
        };
        addTrustedPro(newPro);
        console.log(`${logPrefix} Created new Trusted Pro:`, newPro.name);
      }
    }

    const expenseData: BudgetItem = {
      id: expenseId,
      type: itemType,
      description: description.trim(),
      amount: parseFloat(amount),
      category,
      date: asISODateString(date),
      applianceId: selectedApplianceId || undefined,
      receiptImages: receiptImages.length > 0 ? receiptImages : undefined,
      provider,
      paymentMethod: paymentMethod || undefined,
      invoiceNumber: invoiceNumber.trim() || undefined,
      notes: expenseNotes.trim() || undefined,
      taxDeductible: taxDeductible || undefined,
    };

    if (isEdit) {
      updateBudgetItem(expenseData);
      console.log(`${logPrefix} Expense updated:`, expenseId);
    } else {
      addBudgetItem(expenseData);
    }

    router.back();
  }, [
    description, amount, itemType, category, date, selectedApplianceId,
    receiptImages, providerName, providerPhone, providerEmail,
    providerWebsite, providerAddress, providerSpecialty, providerNotes,
    paymentMethod, invoiceNumber, expenseNotes, taxDeductible, selectedTrustedProId,
    trustedPros, existingExpense, isEdit, logPrefix,
    addBudgetItem, updateBudgetItem, addTrustedPro, updateTrustedPro, router,
  ]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={formStyles.content}>
        <View style={styles.typeToggleRow}>
          <TouchableOpacity
            style={[styles.typeToggleBtn, itemType === 'expense' && styles.typeToggleBtnActive]}
            onPress={() => { lightImpact(); setItemType('expense'); }}
            activeOpacity={0.7}
            testID={`${testIdPrefix}-type-expense`}
          >
            <Text style={[styles.typeToggleText, itemType === 'expense' && styles.typeToggleTextActive]}>Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeToggleBtn, itemType === 'credit' && styles.typeToggleBtnCredit]}
            onPress={() => { lightImpact(); setItemType('credit'); }}
            activeOpacity={0.7}
            testID={`${testIdPrefix}-type-credit`}
          >
            <Text style={[styles.typeToggleText, itemType === 'credit' && styles.typeToggleTextCredit]}>Credit / Refund</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>{itemType === 'credit' ? 'Credit amount' : 'How much?'}</Text>
          <View style={styles.amountInputRow}>
            <Text style={styles.amountSign}>$</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor={c.textTertiary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              testID={`${testIdPrefix}-amount`}
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
                  placeholderTextColor={c.textTertiary}
                  value={description}
                  onChangeText={setDescription}
                  testID={`${testIdPrefix}-description`}
                />
              </View>
            </View>
            <View style={formStyles.divider} />
            <View style={formStyles.inputRow}>
              <View style={formStyles.inputContent}>
                <DatePickerField
                  label="Date"
                  value={date}
                  onChange={setDate}
                  placeholder="Select date"
                  colors={c}
                  testID={`${testIdPrefix}-date`}
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
                  placeholderTextColor={c.textTertiary}
                  value={invoiceNumber}
                  onChangeText={setInvoiceNumber}
                />
              </View>
              <Hash size={16} color={c.textTertiary} />
            </View>
            <View style={formStyles.divider} />
            <TouchableOpacity
              style={formStyles.inputRow}
              onPress={() => setShowPaymentPicker(!showPaymentPicker)}
              activeOpacity={0.7}
            >
              <View style={formStyles.inputContent}>
                <Text style={formStyles.inputLabel}>Payment method</Text>
                <Text style={[formStyles.textInput, !paymentMethod && { color: c.textTertiary }]}>
                  {paymentMethod || 'Select'}
                </Text>
              </View>
              <CreditCard size={16} color={c.textTertiary} />
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
                <Text style={formStyles.inputLabel}>Tax Deductible</Text>
              </View>
              <Switch
                value={taxDeductible}
                onValueChange={(val) => {
                  lightImpact();
                  setTaxDeductible(val);
                }}
                trackColor={{ false: c.surfaceAlt, true: c.primaryLight }}
                thumbColor={taxDeductible ? c.primary : c.textTertiary}
                testID={`${testIdPrefix}-tax-deductible`}
              />
            </View>
            <View style={formStyles.divider} />
            <View style={formStyles.inputRow}>
              <View style={formStyles.inputContent}>
                <Text style={formStyles.inputLabel}>Notes</Text>
                <TextInput
                  style={[formStyles.textInput, { minHeight: 40 }]}
                  placeholder="Any additional details"
                  placeholderTextColor={c.textTertiary}
                  value={expenseNotes}
                  onChangeText={setExpenseNotes}
                  multiline
                />
              </View>
              <StickyNote size={16} color={c.textTertiary} />
            </View>
          </View>
        </View>

        <View style={formStyles.section}>
          <Text style={formStyles.sectionLabel}>Category</Text>
          <View style={styles.categoryGrid}>
            {EXPENSE_CATEGORY_OPTIONS.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryChip,
                  category === cat.key && { backgroundColor: c[('category' + cat.key.charAt(0).toUpperCase() + cat.key.slice(1)) as keyof typeof c], borderColor: c[('category' + cat.key.charAt(0).toUpperCase() + cat.key.slice(1)) as keyof typeof c] },
                ]}
                onPress={() => setCategory(cat.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    category === cat.key && { color: c.white },
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
                <View style={[styles.receiptBtnIcon, { backgroundColor: c.primaryLight }]}>
                  <Camera size={20} color={c.primary} />
                </View>
                <Text style={styles.receiptBtnText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.receiptBtn} onPress={pickImage} activeOpacity={0.7}>
                <View style={[styles.receiptBtnIcon, { backgroundColor: c.accentLight }]}>
                  <ImageIcon size={20} color={c.accent} />
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
                      <X size={12} color={c.white} />
                    </TouchableOpacity>
                    <View style={styles.receiptBadge}>
                      <Receipt size={10} color={c.white} />
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
              <ChevronUp size={20} color={c.textTertiary} />
            ) : (
              <ChevronDown size={20} color={c.textTertiary} />
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
                  onPress={clearProviderSelection}
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
                      placeholderTextColor={c.textTertiary}
                      value={providerName}
                      onChangeText={setProviderName}
                    />
                  </View>
                  <UserCheck size={16} color={c.textTertiary} />
                </View>
                <View style={formStyles.divider} />
                <View style={formStyles.inputRow}>
                  <View style={formStyles.inputContent}>
                    <Text style={formStyles.inputLabel}>Specialty</Text>
                    <TextInput
                      style={formStyles.textInput}
                      placeholder="e.g. Plumbing, HVAC, Electrical"
                      placeholderTextColor={c.textTertiary}
                      value={providerSpecialty}
                      onChangeText={setProviderSpecialty}
                    />
                  </View>
                  <FileText size={16} color={c.textTertiary} />
                </View>
                <View style={formStyles.divider} />
                <View style={formStyles.inputRow}>
                  <View style={formStyles.inputContent}>
                    <Text style={formStyles.inputLabel}>Phone</Text>
                    <TextInput
                      style={formStyles.textInput}
                      placeholder="(555) 123-4567"
                      placeholderTextColor={c.textTertiary}
                      value={providerPhone}
                      onChangeText={setProviderPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                  <Phone size={16} color={c.textTertiary} />
                </View>
                <View style={formStyles.divider} />
                <View style={formStyles.inputRow}>
                  <View style={formStyles.inputContent}>
                    <Text style={formStyles.inputLabel}>Email</Text>
                    <TextInput
                      style={formStyles.textInput}
                      placeholder="contact@provider.com"
                      placeholderTextColor={c.textTertiary}
                      value={providerEmail}
                      onChangeText={setProviderEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  <Mail size={16} color={c.textTertiary} />
                </View>
                <View style={formStyles.divider} />
                <View style={formStyles.inputRow}>
                  <View style={formStyles.inputContent}>
                    <Text style={formStyles.inputLabel}>Website</Text>
                    <TextInput
                      style={formStyles.textInput}
                      placeholder="www.provider.com"
                      placeholderTextColor={c.textTertiary}
                      value={providerWebsite}
                      onChangeText={setProviderWebsite}
                      autoCapitalize="none"
                    />
                  </View>
                  <Globe size={16} color={c.textTertiary} />
                </View>
                <View style={formStyles.divider} />
                <View style={formStyles.inputRow}>
                  <View style={formStyles.inputContent}>
                    <Text style={formStyles.inputLabel}>Address</Text>
                    <TextInput
                      style={formStyles.textInput}
                      placeholder="123 Main St, City, State"
                      placeholderTextColor={c.textTertiary}
                      value={providerAddress}
                      onChangeText={setProviderAddress}
                    />
                  </View>
                  <MapPin size={16} color={c.textTertiary} />
                </View>
                <View style={formStyles.divider} />
                <View style={formStyles.inputRow}>
                  <View style={formStyles.inputContent}>
                    <Text style={formStyles.inputLabel}>Notes</Text>
                    <TextInput
                      style={[formStyles.textInput, { minHeight: 40 }]}
                      placeholder="Any notes about this provider"
                      placeholderTextColor={c.textTertiary}
                      value={providerNotes}
                      onChangeText={setProviderNotes}
                      multiline
                    />
                  </View>
                  <StickyNote size={16} color={c.textTertiary} />
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

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.85}
          testID={isEdit ? 'save-edit-expense' : 'save-expense'}
        >
          <Text style={styles.saveBtnText}>{isEdit ? 'Save Changes' : 'Log Expense'}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
