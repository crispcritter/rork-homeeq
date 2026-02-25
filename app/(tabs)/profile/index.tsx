import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActionSheetIOS,
  Alert as RNAlert,
  Animated,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Stack } from 'expo-router';
import {
  MapPin,
  Home,
  BedDouble,
  Bath,
  Ruler,
  Calendar,
  Layers,
  Droplets,
  Flame,
  Car,
  Waves,
  Building,
  StickyNote,
  ChevronDown,
  RotateCcw,
  Camera,
  ExternalLink,
  Link,
  X,
  Search,
  Users,
  UserPlus,
  Mail,
  MessageSquare,
  Trash2,
  Crown,
  User,
} from 'lucide-react-native';
import { Alert, Linking, Modal } from 'react-native';
import { useHome } from '@/contexts/HomeContext';
import Colors from '@/constants/colors';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';
import { ColorScheme } from '@/constants/colors';
import { Settings, Moon, Sun, Smartphone, ChevronsUpDown } from 'lucide-react-native';
import { successNotification } from '@/utils/haptics';
import PickerModal from '@/components/PickerModal';
import LinkPreview from '@/components/LinkPreview';
import {
  HOME_TYPE_OPTIONS,
  FOUNDATION_OPTIONS,
  ROOF_OPTIONS,
  HVAC_OPTIONS,
  WATER_HEATER_OPTIONS,
  GARAGE_OPTIONS,
  getPickerLabel,
} from '@/constants/profileOptions';
import {
  HomeProfile,
  HomeType,
  FoundationType,
  RoofType,
  HeatingCoolingType,
  WaterHeaterType,
  GarageType,
  HouseholdMember,
  HouseholdRole,
  toISOTimestamp,
  asISODateString,
} from '@/types';
import { numericToString, stringToNumeric } from '@/utils/numeric';

const NUMERIC_PROFILE_KEYS = [
  'yearBuilt',
  'squareFootage',
  'lotSize',
  'bedrooms',
  'bathrooms',
  'stories',
  'roofAge',
  'hoaAmount',
] as const;

type NumericProfileKey = typeof NUMERIC_PROFILE_KEYS[number];

type ProfileFormState = Omit<HomeProfile, NumericProfileKey> & {
  [K in NumericProfileKey]: string;
};

function profileToForm(profile: HomeProfile): ProfileFormState {
  return {
    ...profile,
    yearBuilt: numericToString(profile.yearBuilt),
    squareFootage: numericToString(profile.squareFootage),
    lotSize: numericToString(profile.lotSize),
    bedrooms: numericToString(profile.bedrooms),
    bathrooms: numericToString(profile.bathrooms),
    stories: numericToString(profile.stories),
    roofAge: numericToString(profile.roofAge),
    hoaAmount: numericToString(profile.hoaAmount),
  };
}

function formToProfile(form: ProfileFormState): HomeProfile {
  return {
    ...form,
    yearBuilt: stringToNumeric(form.yearBuilt),
    squareFootage: stringToNumeric(form.squareFootage),
    lotSize: stringToNumeric(form.lotSize),
    bedrooms: stringToNumeric(form.bedrooms),
    bathrooms: stringToNumeric(form.bathrooms),
    stories: stringToNumeric(form.stories),
    roofAge: stringToNumeric(form.roofAge),
    hoaAmount: stringToNumeric(form.hoaAmount),
  };
}

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, children, defaultOpen, themeColors, globalDefault }: CollapsibleSectionProps & { themeColors?: ColorScheme; globalDefault?: boolean }) {
  const resolvedDefault = defaultOpen !== undefined ? defaultOpen : (globalDefault ?? true);
  const [isOpen, setIsOpen] = useState<boolean>(resolvedDefault);
  const rotateAnim = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;
  const c = themeColors ?? Colors;

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen((prev) => !prev);
    Animated.timing(rotateAnim, {
      toValue: isOpen ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isOpen, rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={toggle}
        activeOpacity={0.6}
      >
        <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>{title}</Text>
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <ChevronDown size={16} color={c.textSecondary} />
        </Animated.View>
      </TouchableOpacity>
      {isOpen && children}
    </View>
  );
}

const ROLE_OPTIONS: { label: string; value: HouseholdRole }[] = [
  { label: 'Spouse', value: 'spouse' },
  { label: 'Partner', value: 'partner' },
  { label: 'Family Member', value: 'family' },
  { label: 'Roommate', value: 'roommate' },
  { label: 'Other', value: 'other' },
];

const getRoleLabel = (role: HouseholdRole): string => {
  if (role === 'owner') return 'Owner';
  return ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role;
};

export default function ProfileScreen() {
  const { homeProfile, updateHomeProfile, resetData, isResetting, addHouseholdMember, removeHouseholdMember, sectionsDefaultOpen, setSectionsDefaultOpen } = useHome();
  const { colors: c, themeMode, setThemeMode, isDark } = useTheme();
  const [form, setForm] = useState<ProfileFormState>(() => profileToForm(homeProfile));
  const [activePicker, setActivePicker] = useState<string | null>(null);
  const [showZillowModal, setShowZillowModal] = useState<boolean>(false);
  const [zillowInput, setZillowInput] = useState<string>(form.zillowLink ?? '');
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [inviteName, setInviteName] = useState<string>('');
  const [inviteContact, setInviteContact] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<HouseholdRole>('spouse');
  const [inviteMethod, setInviteMethod] = useState<'email' | 'sms'>('email');

  useEffect(() => {
    setForm(profileToForm(homeProfile));
  }, [homeProfile]);

  useEffect(() => {
    setZillowInput(form.zillowLink ?? '');
  }, [form.zillowLink]);

  const updateField = useCallback(<K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      console.log('[Profile] Image picked:', result.assets[0].uri);
      updateField('profileImage', result.assets[0].uri);
    }
  }, [updateField]);

  const takePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      console.log('[Profile] Photo taken:', result.assets[0].uri);
      updateField('profileImage', result.assets[0].uri);
    }
  }, [updateField]);

  const handleProfileImage = useCallback(() => {
    const options = form.profileImage
      ? ['Take Photo', 'Choose from Library', 'Remove Photo', 'Cancel']
      : ['Take Photo', 'Choose from Library', 'Cancel'];
    const cancelIndex = options.length - 1;
    const destructiveIndex = form.profileImage ? 2 : undefined;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: cancelIndex,
          destructiveButtonIndex: destructiveIndex,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) takePhoto();
          else if (buttonIndex === 1) pickImage();
          else if (buttonIndex === 2 && form.profileImage) updateField('profileImage', undefined);
        }
      );
    } else {
      Alert.alert('Profile Photo', 'Choose an option', [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        ...(form.profileImage
          ? [{ text: 'Remove Photo', onPress: () => updateField('profileImage', undefined), style: 'destructive' as const }]
          : []),
        { text: 'Cancel', style: 'cancel' as const },
      ]);
    }
  }, [form.profileImage, takePhoto, pickImage, updateField]);

  const handleSave = useCallback(() => {
    updateHomeProfile(formToProfile(form));
    successNotification();
    Alert.alert('Saved', 'Your home profile has been updated.');
  }, [form, updateHomeProfile]);



  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          title: 'Home Profile',
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} testID="save-profile">
              <Text style={[styles.saveButton, { color: c.primary }]}>Save</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroSection}>
          <TouchableOpacity
            style={styles.profileImageContainer}
            onPress={handleProfileImage}
            activeOpacity={0.8}
            testID="profile-image-button"
          >
            {form.profileImage ? (
              <Image source={{ uri: form.profileImage }} style={[styles.profileImage, { backgroundColor: c.surfaceAlt }]} />
            ) : (
              <View style={[styles.profileImagePlaceholder, { backgroundColor: c.primaryLight }]}>
                <Home size={36} color={c.primary} />
              </View>
            )}
            <View style={[styles.cameraButton, { backgroundColor: c.primary, borderColor: c.background }]}>
              <Camera size={14} color={c.white} />
            </View>
          </TouchableOpacity>
          <Text style={[styles.heroTitle, { color: c.text }]}>
            {form.nickname || 'Name your home'}
          </Text>
          <Text style={[styles.heroSubtitle, { color: c.textSecondary }]}>
            This info helps personalize maintenance reminders and budgeting
          </Text>
        </View>

        <CollapsibleSection title="Basics" themeColors={c} globalDefault={sectionsDefaultOpen}>
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            <View style={styles.inputRow}>
              <View style={styles.inputIcon}>
                <Home size={18} color={c.primary} />
              </View>
              <View style={styles.inputContent}>
                <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Nickname</Text>
                <TextInput
                  style={[styles.textInput, { color: c.text }]}
                  value={form.nickname}
                  onChangeText={(v) => updateField('nickname', v)}
                  placeholder="e.g. Our Cozy Nest"
                  placeholderTextColor={c.textTertiary}
                  testID="nickname-input"
                />
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: c.borderLight }]} />
            <TouchableOpacity
              style={styles.inputRow}
              onPress={() => setActivePicker('homeType')}
              activeOpacity={0.7}
            >
              <View style={[styles.inputIcon, { backgroundColor: c.primaryLight }]}>
                <Building size={18} color={c.primary} />
              </View>
              <View style={styles.inputContent}>
                <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Home type</Text>
                <View style={styles.pickerTrigger}>
                  <Text style={[styles.pickerValue, { color: c.text }]}>
                    {getPickerLabel(HOME_TYPE_OPTIONS, form.homeType)}
                  </Text>
                  <ChevronDown size={16} color={c.textTertiary} />
                </View>
              </View>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: c.borderLight }]} />
            <View style={styles.inputRow}>
              <View style={[styles.inputIcon, { backgroundColor: c.primaryLight }]}>
                <Calendar size={18} color={c.primary} />
              </View>
              <View style={styles.inputContent}>
                <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Year built</Text>
                <TextInput
                  style={[styles.textInput, { color: c.text }]}
                  value={form.yearBuilt}
                  onChangeText={(v) => updateField('yearBuilt', v)}
                  placeholder="e.g. 1998"
                  placeholderTextColor={c.textTertiary}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: c.borderLight }]} />
            <View style={styles.inputRow}>
              <View style={[styles.inputIcon, { backgroundColor: c.primaryLight }]}>
                <Calendar size={18} color={c.primary} />
              </View>
              <View style={styles.inputContent}>
                <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Purchase date</Text>
                <TextInput
                  style={[styles.textInput, { color: c.text }]}
                  value={form.purchaseDate}
                  onChangeText={(v) => updateField('purchaseDate', asISODateString(v))}
                  placeholder="e.g. March 2020"
                  placeholderTextColor={c.textTertiary}
                />
              </View>
            </View>
          </View>
        </CollapsibleSection>

        <CollapsibleSection title="Address" themeColors={c} globalDefault={sectionsDefaultOpen}>
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            <View style={styles.inputRow}>
              <View style={styles.inputIcon}>
                <MapPin size={18} color={c.accent} />
              </View>
              <View style={styles.inputContent}>
                <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Street address</Text>
                <TextInput
                  style={[styles.textInput, { color: c.text }]}
                  value={form.address}
                  onChangeText={(v) => updateField('address', v)}
                  placeholder="123 Main Street"
                  placeholderTextColor={c.textTertiary}
                />
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: c.borderLight }]} />
            <View style={styles.inlineRow}>
              <View style={styles.inlineField}>
                <Text style={[styles.inputLabel, { color: c.textSecondary }]}>City</Text>
                <TextInput
                  style={[styles.textInput, { color: c.text }]}
                  value={form.city}
                  onChangeText={(v) => updateField('city', v)}
                  placeholder="City"
                  placeholderTextColor={c.textTertiary}
                />
              </View>
              <View style={styles.inlineFieldSmall}>
                <Text style={[styles.inputLabel, { color: c.textSecondary }]}>State</Text>
                <TextInput
                  style={[styles.textInput, { color: c.text }]}
                  value={form.state}
                  onChangeText={(v) => updateField('state', v)}
                  placeholder="ST"
                  placeholderTextColor={c.textTertiary}
                  maxLength={2}
                  autoCapitalize="characters"
                />
              </View>
              <View style={styles.inlineFieldSmall}>
                <Text style={[styles.inputLabel, { color: c.textSecondary }]}>ZIP</Text>
                <TextInput
                  style={[styles.textInput, { color: c.text }]}
                  value={form.zipCode}
                  onChangeText={(v) => updateField('zipCode', v)}
                  placeholder="00000"
                  placeholderTextColor={c.textTertiary}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>
            </View>
          </View>

          {form.zillowLink ? (
            <View style={styles.zillowPreviewContainer}>
              <LinkPreview url={form.zillowLink} />
              <View style={styles.zillowPreviewActions}>
                <TouchableOpacity
                  style={styles.zillowEditButton}
                  onPress={() => setShowZillowModal(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.zillowEditText}>Edit Link</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.zillowAddButton}
              onPress={() => setShowZillowModal(true)}
              activeOpacity={0.7}
              testID="add-zillow-link"
            >
              <View style={[styles.zillowAddIconContainer, { backgroundColor: c.primaryLight }]}>
                <Link size={16} color={c.primary} />
              </View>
              <Text style={[styles.zillowAddText, { color: c.text }]}>Zillow Profile</Text>
              <ChevronDown size={16} color={c.textTertiary} style={{ transform: [{ rotate: '-90deg' }] }} />
            </TouchableOpacity>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Size & Layout" themeColors={c} globalDefault={sectionsDefaultOpen}>
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            <View style={styles.gridRow}>
              <View style={styles.gridItem}>
                <View style={styles.gridIcon}>
                  <BedDouble size={16} color={c.primary} />
                </View>
                <Text style={[styles.gridLabel, { color: c.textSecondary }]}>Bedrooms</Text>
                <TextInput
                  style={styles.gridInput}
                  value={form.bedrooms}
                  onChangeText={(v) => updateField('bedrooms', v)}
                  keyboardType="number-pad"
                  placeholder="—"
                  placeholderTextColor={c.textTertiary}
                  maxLength={2}
                />
              </View>
              <View style={styles.gridItem}>
                <View style={[styles.gridIcon, { backgroundColor: c.primaryLight }]}>
                  <Bath size={16} color={c.primary} />
                </View>
                <Text style={[styles.gridLabel, { color: c.textSecondary }]}>Bathrooms</Text>
                <TextInput
                  style={styles.gridInput}
                  value={form.bathrooms}
                  onChangeText={(v) => updateField('bathrooms', v)}
                  keyboardType="decimal-pad"
                  placeholder="—"
                  placeholderTextColor={c.textTertiary}
                  maxLength={3}
                />
              </View>
              <View style={styles.gridItem}>
                <View style={[styles.gridIcon, { backgroundColor: c.primaryLight }]}>
                  <Layers size={16} color={c.primary} />
                </View>
                <Text style={[styles.gridLabel, { color: c.textSecondary }]}>Stories</Text>
                <TextInput
                  style={styles.gridInput}
                  value={form.stories}
                  onChangeText={(v) => updateField('stories', v)}
                  keyboardType="number-pad"
                  placeholder="—"
                  placeholderTextColor={c.textTertiary}
                  maxLength={2}
                />
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: c.borderLight }]} />
            <View style={styles.inputRow}>
              <View style={[styles.inputIcon, { backgroundColor: c.primaryLight }]}>
                <Ruler size={18} color={c.primary} />
              </View>
              <View style={styles.inputContent}>
                <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Square footage</Text>
                <TextInput
                  style={[styles.textInput, { color: c.text }]}
                  value={form.squareFootage}
                  onChangeText={(v) => updateField('squareFootage', v)}
                  placeholder="e.g. 2,400"
                  placeholderTextColor={c.textTertiary}
                  keyboardType="number-pad"
                />
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: c.borderLight }]} />
            <View style={styles.inputRow}>
              <View style={[styles.inputIcon, { backgroundColor: c.primaryLight }]}>
                <Ruler size={18} color={c.primary} />
              </View>
              <View style={styles.inputContent}>
                <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Lot size (acres)</Text>
                <TextInput
                  style={[styles.textInput, { color: c.text }]}
                  value={form.lotSize}
                  onChangeText={(v) => updateField('lotSize', v)}
                  placeholder="e.g. 0.25"
                  placeholderTextColor={c.textTertiary}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>
        </CollapsibleSection>

        <CollapsibleSection title="Systems & Structure" themeColors={c} globalDefault={sectionsDefaultOpen}>
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            <TouchableOpacity
              style={styles.inputRow}
              onPress={() => setActivePicker('foundationType')}
              activeOpacity={0.7}
            >
              <View style={[styles.inputIcon, { backgroundColor: c.accentLight }]}>
                <Layers size={18} color={c.accent} />
              </View>
              <View style={styles.inputContent}>
                <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Foundation</Text>
                <View style={styles.pickerTrigger}>
                  <Text style={[styles.pickerValue, { color: c.text }]}>
                    {getPickerLabel(FOUNDATION_OPTIONS, form.foundationType)}
                  </Text>
                  <ChevronDown size={16} color={c.textTertiary} />
                </View>
              </View>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: c.borderLight }]} />
            <TouchableOpacity
              style={styles.inputRow}
              onPress={() => setActivePicker('roofType')}
              activeOpacity={0.7}
            >
              <View style={[styles.inputIcon, { backgroundColor: c.accentLight }]}>
                <Home size={18} color={c.accent} />
              </View>
              <View style={styles.inputContent}>
                <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Roof type</Text>
                <View style={styles.pickerTrigger}>
                  <Text style={[styles.pickerValue, { color: c.text }]}>
                    {getPickerLabel(ROOF_OPTIONS, form.roofType)}
                  </Text>
                  <ChevronDown size={16} color={c.textTertiary} />
                </View>
              </View>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: c.borderLight }]} />
            <View style={styles.inputRow}>
              <View style={[styles.inputIcon, { backgroundColor: c.accentLight }]}>
                <Home size={18} color={c.accent} />
              </View>
              <View style={styles.inputContent}>
                <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Roof age (years)</Text>
                <TextInput
                  style={[styles.textInput, { color: c.text }]}
                  value={form.roofAge}
                  onChangeText={(v) => updateField('roofAge', v)}
                  placeholder="e.g. 8"
                  placeholderTextColor={c.textTertiary}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: c.borderLight }]} />
            <TouchableOpacity
              style={styles.inputRow}
              onPress={() => setActivePicker('heatingCoolingType')}
              activeOpacity={0.7}
            >
              <View style={[styles.inputIcon, { backgroundColor: c.accentLight }]}>
                <Flame size={18} color={c.accent} />
              </View>
              <View style={styles.inputContent}>
                <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Heating & cooling</Text>
                <View style={styles.pickerTrigger}>
                  <Text style={[styles.pickerValue, { color: c.text }]}>
                    {getPickerLabel(HVAC_OPTIONS, form.heatingCoolingType)}
                  </Text>
                  <ChevronDown size={16} color={c.textTertiary} />
                </View>
              </View>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: c.borderLight }]} />
            <TouchableOpacity
              style={styles.inputRow}
              onPress={() => setActivePicker('waterHeaterType')}
              activeOpacity={0.7}
            >
              <View style={[styles.inputIcon, { backgroundColor: c.accentLight }]}>
                <Droplets size={18} color={c.accent} />
              </View>
              <View style={styles.inputContent}>
                <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Water heater</Text>
                <View style={styles.pickerTrigger}>
                  <Text style={[styles.pickerValue, { color: c.text }]}>
                    {getPickerLabel(WATER_HEATER_OPTIONS, form.waterHeaterType)}
                  </Text>
                  <ChevronDown size={16} color={c.textTertiary} />
                </View>
              </View>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: c.borderLight }]} />
            <TouchableOpacity
              style={styles.inputRow}
              onPress={() => setActivePicker('garageType')}
              activeOpacity={0.7}
            >
              <View style={[styles.inputIcon, { backgroundColor: c.accentLight }]}>
                <Car size={18} color={c.accent} />
              </View>
              <View style={styles.inputContent}>
                <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Garage</Text>
                <View style={styles.pickerTrigger}>
                  <Text style={[styles.pickerValue, { color: c.text }]}>
                    {getPickerLabel(GARAGE_OPTIONS, form.garageType)}
                  </Text>
                  <ChevronDown size={16} color={c.textTertiary} />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </CollapsibleSection>

        <CollapsibleSection title="Extras" themeColors={c} globalDefault={sectionsDefaultOpen}>
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <View style={[styles.inputIcon, { backgroundColor: c.primaryLight }]}>
                  <Waves size={18} color={c.primary} />
                </View>
                <Text style={[styles.switchLabel, { color: c.text }]}>Pool / Spa</Text>
              </View>
              <Switch
                value={form.hasPool}
                onValueChange={(v) => updateField('hasPool', v)}
                trackColor={{ false: c.surfaceAlt, true: c.primaryLight }}
                thumbColor={form.hasPool ? c.primary : c.textTertiary}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: c.borderLight }]} />
            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <View style={[styles.inputIcon, { backgroundColor: c.accentLight }]}>
                  <Building size={18} color={c.accent} />
                </View>
                <Text style={[styles.switchLabel, { color: c.text }]}>HOA</Text>
              </View>
              <Switch
                value={form.hasHoa}
                onValueChange={(v) => updateField('hasHoa', v)}
                trackColor={{ false: c.surfaceAlt, true: c.primaryLight }}
                thumbColor={form.hasHoa ? c.primary : c.textTertiary}
              />
            </View>
            {form.hasHoa && (
              <>
                <View style={[styles.divider, { backgroundColor: c.borderLight }]} />
                <View style={styles.inputRow}>
                  <View style={[styles.inputIcon, { backgroundColor: c.accentLight }]}>
                    <Building size={18} color={c.accent} />
                  </View>
                  <View style={styles.inputContent}>
                    <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Monthly HOA dues</Text>
                    <TextInput
                      style={[styles.textInput, { color: c.text }]}
                      value={form.hoaAmount}
                      onChangeText={(v) => updateField('hoaAmount', v)}
                      placeholder="e.g. 250"
                      placeholderTextColor={c.textTertiary}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
              </>
            )}
          </View>
        </CollapsibleSection>

        <CollapsibleSection title="Household" themeColors={c} globalDefault={sectionsDefaultOpen}>
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            {(form.householdMembers ?? []).length === 0 ? (
              <View style={styles.householdEmpty}>
                <View style={[styles.householdEmptyIcon, { backgroundColor: c.surfaceAlt }]}>
                  <Users size={28} color={c.textTertiary} />
                </View>
                <Text style={[styles.householdEmptyTitle, { color: c.text }]}>No household members yet</Text>
                <Text style={[styles.householdEmptySubtitle, { color: c.textTertiary }]}>Invite your spouse, partner, or family members to collaborate</Text>
              </View>
            ) : (
              (form.householdMembers ?? []).map((member, idx) => (
                <View key={member.id}>
                  {idx > 0 && <View style={[styles.divider, { backgroundColor: c.borderLight }]} />}
                  <View style={styles.householdMemberRow}>
                    <View style={[styles.householdAvatar, { backgroundColor: c.primaryLight }]}>
                      <User size={18} color={c.primary} />
                    </View>
                    <View style={styles.householdMemberInfo}>
                      <Text style={[styles.householdMemberName, { color: c.text }]}>{member.name}</Text>
                      <View style={styles.householdMemberMeta}>
                        <View style={[styles.householdRoleBadge, { backgroundColor: c.primaryLight }]}>
                          <Text style={[styles.householdRoleBadgeText, { color: c.primary }]}>{getRoleLabel(member.role)}</Text>
                        </View>
                        {member.status === 'pending' && (
                          <View style={[styles.householdPendingBadge, { backgroundColor: c.warningLight }]}>
                            <Text style={[styles.householdPendingText, { color: c.warning }]}>Pending</Text>
                          </View>
                        )}
                      </View>
                      {(member.email || member.phone) && (
                        <Text style={[styles.householdMemberContact, { color: c.textTertiary }]}>
                          {member.email || member.phone}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(
                          'Remove Member',
                          `Remove ${member.name} from your household?`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Remove',
                              style: 'destructive',
                              onPress: () => removeHouseholdMember(member.id),
                            },
                          ]
                        );
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={styles.householdRemoveButton}
                    >
                      <Trash2 size={16} color={c.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
          <TouchableOpacity
            style={[styles.householdInviteButton, { backgroundColor: c.surface }]}
            onPress={() => {
              setInviteName('');
              setInviteContact('');
              setInviteRole('spouse');
              setInviteMethod('email');
              setShowInviteModal(true);
            }}
            activeOpacity={0.7}
            testID="invite-household-member"
          >
            <View style={[styles.householdInviteIconContainer, { backgroundColor: c.primaryLight }]}>
              <UserPlus size={16} color={c.primary} />
            </View>
            <Text style={[styles.householdInviteText, { color: c.text }]}>Invite a Household Member</Text>
            <ChevronDown size={16} color={c.textTertiary} style={{ transform: [{ rotate: '-90deg' }] }} />
          </TouchableOpacity>
        </CollapsibleSection>

        <CollapsibleSection title="Notes" themeColors={c} globalDefault={sectionsDefaultOpen}>
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            <View style={styles.notesRow}>
              <View style={[styles.inputIcon, { backgroundColor: c.surfaceAlt }]}>
                <StickyNote size={18} color={c.textSecondary} />
              </View>
              <TextInput
                style={[styles.notesInput, { color: c.text }]}
                value={form.notes}
                onChangeText={(v) => updateField('notes', v)}
                placeholder="Any additional details about your home..."
                placeholderTextColor={c.textTertiary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </CollapsibleSection>

        <CollapsibleSection title="Settings" defaultOpen={false} themeColors={c}>
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <View style={[styles.inputIcon, { backgroundColor: c.primaryLight }]}>
                  <Moon size={18} color={c.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={[styles.switchLabel, { color: c.text, marginLeft: 0 }]}>Appearance</Text>
                  <Text style={{ fontSize: 12, color: c.textTertiary, marginTop: 2 }}>
                    {themeMode === 'system' ? 'Follows device settings' : themeMode === 'dark' ? 'Always dark' : 'Always light'}
                  </Text>
                </View>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: c.borderLight }]} />
            <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
              <View style={styles.themeToggleRow}>
                <TouchableOpacity
                  style={[
                    styles.themeToggleButton,
                    { backgroundColor: c.surfaceAlt, borderColor: c.border },
                    themeMode === 'system' && styles.themeToggleButtonActive,
                    themeMode === 'system' && { backgroundColor: c.primary },
                  ]}
                  onPress={() => setThemeMode('system')}
                  activeOpacity={0.7}
                  testID="theme-system"
                >
                  <Smartphone size={14} color={themeMode === 'system' ? c.white : c.textSecondary} />
                  <Text style={[
                    styles.themeToggleText,
                    { color: c.textSecondary },
                    themeMode === 'system' && styles.themeToggleTextActive,
                    themeMode === 'system' && { color: c.white },
                  ]}>Auto</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.themeToggleButton,
                    { backgroundColor: c.surfaceAlt, borderColor: c.border },
                    themeMode === 'light' && styles.themeToggleButtonActive,
                    themeMode === 'light' && { backgroundColor: c.primary },
                  ]}
                  onPress={() => setThemeMode('light')}
                  activeOpacity={0.7}
                  testID="theme-light"
                >
                  <Sun size={14} color={themeMode === 'light' ? c.white : c.textSecondary} />
                  <Text style={[
                    styles.themeToggleText,
                    { color: c.textSecondary },
                    themeMode === 'light' && styles.themeToggleTextActive,
                    themeMode === 'light' && { color: c.white },
                  ]}>Light</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.themeToggleButton,
                    { backgroundColor: c.surfaceAlt, borderColor: c.border },
                    themeMode === 'dark' && styles.themeToggleButtonActive,
                    themeMode === 'dark' && { backgroundColor: c.primary },
                  ]}
                  onPress={() => setThemeMode('dark')}
                  activeOpacity={0.7}
                  testID="theme-dark"
                >
                  <Moon size={14} color={themeMode === 'dark' ? c.white : c.textSecondary} />
                  <Text style={[
                    styles.themeToggleText,
                    { color: c.textSecondary },
                    themeMode === 'dark' && styles.themeToggleTextActive,
                    themeMode === 'dark' && { color: c.white },
                  ]}>Dark</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: c.borderLight }]} />
            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <View style={[styles.inputIcon, { backgroundColor: c.primaryLight }]}>
                  <ChevronsUpDown size={18} color={c.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={[styles.switchLabel, { color: c.text, marginLeft: 0 }]}>Sections Expanded</Text>
                  <Text style={{ fontSize: 12, color: c.textTertiary, marginTop: 2 }}>
                    {sectionsDefaultOpen ? 'Sections open by default' : 'Sections collapsed by default'}
                  </Text>
                </View>
              </View>
              <Switch
                value={sectionsDefaultOpen}
                onValueChange={(v) => {
                  setSectionsDefaultOpen(v);
                  successNotification();
                }}
                trackColor={{ false: c.surfaceAlt, true: c.primaryLight }}
                thumbColor={sectionsDefaultOpen ? c.primary : c.textTertiary}
                testID="sections-default-open-toggle"
              />
            </View>
          </View>
        </CollapsibleSection>

        <TouchableOpacity style={[styles.saveButtonLarge, { backgroundColor: c.primary }]} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveButtonLargeText}>Save Profile</Text>
        </TouchableOpacity>

        <CollapsibleSection title="Data" themeColors={c} globalDefault={sectionsDefaultOpen}>
          <TouchableOpacity
            style={styles.resetButton}
            activeOpacity={0.7}
            disabled={isResetting}
            onPress={() => {
              Alert.alert(
                'Reset All Data',
                'This will erase all appliances, tasks, expenses, and profile info and restore the original sample data. This cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: () => {
                      resetData();
                    },
                  },
                ]
              );
            }}
            testID="reset-data-button"
          >
            <RotateCcw size={18} color="#D1453B" />
            <Text style={styles.resetButtonText}>
              {isResetting ? 'Resetting...' : 'Reset All Data'}
            </Text>
          </TouchableOpacity>
        </CollapsibleSection>

        <View style={{ height: 40 }} />
      </ScrollView>

      <PickerModal
        visible={activePicker === 'homeType'}
        title="Home Type"
        options={HOME_TYPE_OPTIONS}
        selected={form.homeType}
        onSelect={(v) => updateField('homeType', v as HomeType)}
        onClose={() => setActivePicker(null)}
      />
      <PickerModal
        visible={activePicker === 'foundationType'}
        title="Foundation Type"
        options={FOUNDATION_OPTIONS}
        selected={form.foundationType}
        onSelect={(v) => updateField('foundationType', v as FoundationType)}
        onClose={() => setActivePicker(null)}
      />
      <PickerModal
        visible={activePicker === 'roofType'}
        title="Roof Type"
        options={ROOF_OPTIONS}
        selected={form.roofType}
        onSelect={(v) => updateField('roofType', v as RoofType)}
        onClose={() => setActivePicker(null)}
      />
      <PickerModal
        visible={activePicker === 'heatingCoolingType'}
        title="Heating & Cooling"
        options={HVAC_OPTIONS}
        selected={form.heatingCoolingType}
        onSelect={(v) => updateField('heatingCoolingType', v as HeatingCoolingType)}
        onClose={() => setActivePicker(null)}
      />
      <PickerModal
        visible={activePicker === 'waterHeaterType'}
        title="Water Heater"
        options={WATER_HEATER_OPTIONS}
        selected={form.waterHeaterType}
        onSelect={(v) => updateField('waterHeaterType', v as WaterHeaterType)}
        onClose={() => setActivePicker(null)}
      />
      <PickerModal
        visible={activePicker === 'garageType'}
        title="Garage"
        options={GARAGE_OPTIONS}
        selected={form.garageType}
        onSelect={(v) => updateField('garageType', v as GarageType)}
        onClose={() => setActivePicker(null)}
      />

      <Modal
        visible={showInviteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setShowInviteModal(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: c.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: c.text }]}>Invite Member</Text>
              <TouchableOpacity
                onPress={() => setShowInviteModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={22} color={c.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalDescription, { color: c.textSecondary }]}>
              Add a household member and send them an invitation to join.
            </Text>

            <View style={[styles.modalInputContainer, { backgroundColor: c.background }]}>
              <User size={18} color={c.textTertiary} />
              <TextInput
                style={[styles.modalInput, { color: c.text }]}
                value={inviteName}
                onChangeText={setInviteName}
                placeholder="Name"
                placeholderTextColor={c.textTertiary}
                testID="invite-name-input"
              />
            </View>

            <View style={styles.inviteMethodToggle}>
              <TouchableOpacity
                style={[
                  styles.inviteMethodButton,
                  inviteMethod === 'email' && styles.inviteMethodButtonActive,
                ]}
                onPress={() => setInviteMethod('email')}
                activeOpacity={0.7}
              >
                <Mail size={14} color={inviteMethod === 'email' ? c.white : c.textSecondary} />
                <Text style={[
                  styles.inviteMethodText,
                  inviteMethod === 'email' && styles.inviteMethodTextActive,
                ]}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.inviteMethodButton,
                  inviteMethod === 'sms' && styles.inviteMethodButtonActive,
                ]}
                onPress={() => setInviteMethod('sms')}
                activeOpacity={0.7}
              >
                <MessageSquare size={14} color={inviteMethod === 'sms' ? c.white : c.textSecondary} />
                <Text style={[
                  styles.inviteMethodText,
                  inviteMethod === 'sms' && styles.inviteMethodTextActive,
                ]}>Text Message</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.modalInputContainer, { backgroundColor: c.background }]}>
              {inviteMethod === 'email' ? (
                <Mail size={18} color={c.textTertiary} />
              ) : (
                <MessageSquare size={18} color={c.textTertiary} />
              )}
              <TextInput
                style={[styles.modalInput, { color: c.text }]}
                value={inviteContact}
                onChangeText={setInviteContact}
                placeholder={inviteMethod === 'email' ? 'Email address' : 'Phone number'}
                placeholderTextColor={c.textTertiary}
                keyboardType={inviteMethod === 'email' ? 'email-address' : 'phone-pad'}
                autoCapitalize="none"
                testID="invite-contact-input"
              />
            </View>

            <Text style={[styles.inviteRoleLabel, { color: c.textSecondary }]}>Role</Text>
            <View style={styles.inviteRoleRow}>
              {ROLE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.inviteRoleChip,
                    inviteRole === opt.value && styles.inviteRoleChipActive,
                  ]}
                  onPress={() => setInviteRole(opt.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.inviteRoleChipText,
                    inviteRole === opt.value && styles.inviteRoleChipTextActive,
                  ]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <View />
              <TouchableOpacity
                style={[
                  styles.modalSaveButton,
                  { backgroundColor: c.primary },
                  (!inviteName.trim() || !inviteContact.trim()) && styles.modalSaveButtonDisabled,
                ]}
                disabled={!inviteName.trim() || !inviteContact.trim()}
                onPress={() => {
                  const name = inviteName.trim();
                  const contact = inviteContact.trim();
                  if (!name || !contact) return;

                  const member: HouseholdMember = {
                    id: `member-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    name,
                    email: inviteMethod === 'email' ? contact : undefined,
                    phone: inviteMethod === 'sms' ? contact : undefined,
                    role: inviteRole,
                    invitedAt: toISOTimestamp(new Date()),
                    status: 'pending',
                  };

                  addHouseholdMember(member);
                  console.log('[Profile] Household member added:', name);

                  const homeName = form.nickname || 'our home';
                  const appStoreUrl = 'https://apps.apple.com/app/homeeq/id0000000000';
                  const message = `Hey ${name}! I'd like to invite you to help manage ${homeName} together on HomeEQ. Download the app to get started and stay on top of our home maintenance, budget, and more!\n\n${appStoreUrl}`;

                  setShowInviteModal(false);
                  successNotification();

                  if (inviteMethod === 'email') {
                    const subject = encodeURIComponent(`Join me on our home management app`);
                    const body = encodeURIComponent(message);
                    const emailUrl = `mailto:${contact}?subject=${subject}&body=${body}`;
                    console.log('[Profile] Opening email:', emailUrl);
                    Linking.openURL(emailUrl).catch(() => {
                      Alert.alert('Member Added', `${name} was added to your household. You can send the invitation manually.`);
                    });
                  } else {
                    const smsBody = encodeURIComponent(message);
                    const smsUrl = Platform.OS === 'ios'
                      ? `sms:${contact}&body=${smsBody}`
                      : `sms:${contact}?body=${smsBody}`;
                    console.log('[Profile] Opening SMS:', smsUrl);
                    Linking.openURL(smsUrl).catch(() => {
                      Alert.alert('Member Added', `${name} was added to your household. You can send the invitation manually.`);
                    });
                  }
                }}
                activeOpacity={0.7}
                testID="send-invite-button"
              >
                <Text style={styles.modalSaveText}>Add & Invite</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showZillowModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowZillowModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => {
              setZillowInput(form.zillowLink ?? '');
              setShowZillowModal(false);
            }}
          />
          <View style={[styles.modalContent, { backgroundColor: c.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: c.text }]}>Zillow Profile</Text>
              <TouchableOpacity
                onPress={() => {
                  setZillowInput(form.zillowLink ?? '');
                  setShowZillowModal(false);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={22} color={c.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalDescription, { color: c.textSecondary }]}>
              Search Zillow for your property, then copy and paste the link below.
            </Text>

            <TouchableOpacity
              style={styles.zillowSearchButton}
              onPress={() => {
                const parts: string[] = [];
                if (form.address) parts.push(form.address);
                if (form.city) parts.push(form.city);
                if (form.state) parts.push(form.state);
                if (form.zipCode) parts.push(form.zipCode);
                const query = parts.join(', ');
                if (!query) {
                  Alert.alert('No Address', 'Please fill in your address details above first.');
                  return;
                }
                const searchUrl = `https://www.zillow.com/homes/${encodeURIComponent(query)}_rb/`;
                console.log('[Profile] Searching Zillow:', searchUrl);
                Linking.openURL(searchUrl).catch(() => {
                  Alert.alert('Error', 'Could not open Zillow search.');
                });
              }}
              activeOpacity={0.7}
              testID="search-zillow-button"
            >
              <Search size={18} color="#fff" />
              <Text style={styles.zillowSearchButtonText}>Search on Zillow</Text>
            </TouchableOpacity>

            {(form.address || form.city || form.state || form.zipCode) ? (
              <Text style={styles.zillowSearchHint}>
                Searching: {[form.address, form.city, form.state, form.zipCode].filter(Boolean).join(', ')}
              </Text>
            ) : (
              <Text style={styles.zillowSearchHint}>
                Fill in your address above to enable search
              </Text>
            )}

            <View style={styles.zillowDividerRow}>
              <View style={styles.zillowDividerLine} />
              <Text style={styles.zillowDividerText}>then paste link</Text>
              <View style={styles.zillowDividerLine} />
            </View>

            <View style={[styles.modalInputContainer, { backgroundColor: c.background }]}>
              <Link size={18} color={c.textTertiary} />
              <TextInput
                style={[styles.modalInput, { color: c.text }]}
                value={zillowInput}
                onChangeText={setZillowInput}
                placeholder="https://www.zillow.com/homedetails/..."
                placeholderTextColor={c.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                testID="zillow-link-input"
              />
              {zillowInput.length > 0 && (
                <TouchableOpacity onPress={() => setZillowInput('')}>
                  <X size={16} color={c.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.modalActions}>
              {form.zillowLink ? (
                <TouchableOpacity
                  style={styles.modalRemoveButton}
                  onPress={() => {
                    console.log('[Profile] Removing Zillow link');
                    updateField('zillowLink', undefined);
                    setZillowInput('');
                    setShowZillowModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalRemoveText}>Remove</Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}
              <TouchableOpacity
                style={[
                  styles.modalSaveButton,
                  !zillowInput.trim() && styles.modalSaveButtonDisabled,
                ]}
                onPress={() => {
                  const trimmed = zillowInput.trim();
                  if (trimmed) {
                    console.log('[Profile] Saving Zillow link:', trimmed);
                    updateField('zillowLink', trimmed);
                    setShowZillowModal(false);
                  }
                }}
                disabled={!zillowInput.trim()}
                activeOpacity={0.7}
                testID="save-zillow-link"
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  profileImageContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 14,
    position: 'relative' as const,
  },
  profileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.surfaceAlt,
  },
  profileImagePlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: Colors.background,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  inputContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  textInput: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.text,
    padding: 0,
    margin: 0,
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerValue: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 66,
  },
  inlineRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  inlineField: {
    flex: 2,
  },
  inlineFieldSmall: {
    flex: 1,
  },
  gridRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  gridItem: {
    flex: 1,
    alignItems: 'center',
  },
  gridIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  gridInput: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    padding: 0,
    minWidth: 40,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.text,
    marginLeft: 14,
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  notesInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400' as const,
    color: Colors.text,
    minHeight: 80,
    padding: 0,
    margin: 0,
  },
  saveButtonLarge: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonLargeText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#D1453B',
  },
  zillowPreviewContainer: {
    marginTop: 10,
  },
  zillowPreviewActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  zillowEditButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
  },
  zillowEditText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  zillowAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  zillowAddIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  zillowAddText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 18,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 20,
  },
  modalInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400' as const,
    color: Colors.text,
    padding: 0,
    margin: 0,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalRemoveButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
  },
  modalRemoveText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#D1453B',
  },
  modalSaveButton: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  modalSaveButtonDisabled: {
    opacity: 0.4,
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  zillowSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#006AFF',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 10,
    marginBottom: 8,
  },
  zillowSearchButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  zillowSearchHint: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 17,
  },
  zillowDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  zillowDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  householdEmpty: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  householdEmptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  householdEmptyTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  householdEmptySubtitle: {
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  householdMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  householdAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  householdMemberInfo: {
    flex: 1,
  },
  householdMemberName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  householdMemberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  householdRoleBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  householdRoleBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  householdPendingBadge: {
    backgroundColor: Colors.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  householdPendingText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.warning,
  },
  householdMemberContact: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  householdRemoveButton: {
    padding: 8,
    marginLeft: 4,
  },
  householdInviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  householdInviteIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  householdInviteText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  inviteMethodToggle: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  inviteMethodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
  },
  inviteMethodButtonActive: {
    backgroundColor: Colors.primary,
  },
  inviteMethodText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  inviteMethodTextActive: {
    color: Colors.white,
  },
  inviteRoleLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
    marginLeft: 2,
  },
  inviteRoleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  inviteRoleChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceAlt,
  },
  inviteRoleChipActive: {
    backgroundColor: Colors.primary,
  },
  inviteRoleChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  inviteRoleChipTextActive: {
    color: Colors.white,
  },
  zillowDividerText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  themeToggleRow: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  themeToggleButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  themeToggleButtonActive: {
    borderWidth: 0,
  },
  themeToggleText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  themeToggleTextActive: {
    fontWeight: '600' as const,
  },
});
