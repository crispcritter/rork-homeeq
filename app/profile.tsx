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
  Link,
  X,
  Search,
  Users,
  UserPlus,
  User,
  Palette,
} from 'lucide-react-native';
import { Alert, Linking, Modal, ActivityIndicator } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { FileText, Shield, Trash2 as TrashIcon } from 'lucide-react-native';

import { useHome } from '@/contexts/HomeContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import DatePickerField from '@/components/DatePickerField';
import Colors, { ColorScheme, PALETTE_OPTIONS } from '@/constants/colors';
import { Moon, Sun, Smartphone, ChevronsUpDown, Cloud, LogOut, LogIn, RefreshCw, CheckCircle, Crown } from 'lucide-react-native';
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

type HouseholdRoleLabel = 'owner' | 'spouse' | 'partner' | 'family' | 'roommate' | 'other';

const ROLE_OPTIONS: { label: string; value: HouseholdRoleLabel }[] = [
  { label: 'Spouse', value: 'spouse' },
  { label: 'Partner', value: 'partner' },
  { label: 'Family Member', value: 'family' },
  { label: 'Roommate', value: 'roommate' },
  { label: 'Other', value: 'other' },
];

const getRoleLabel = (role: string): string => {
  if (role === 'owner') return 'Owner';
  return ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role;
};

export default function ProfileScreen() {
  const { homeProfile, updateHomeProfile, resetData, isResetting, sectionsDefaultOpen, setSectionsDefaultOpen } = useHome();
  const { colors: c, themeMode, setThemeMode, paletteId, setPalette } = useTheme();
  const { user, isAuthenticated, signOut, deleteAccount, syncStatus, lastSyncedAt, pushToCloud, household, createHousehold, generateInvite, removeMember, leaveHousehold, refreshHousehold } = useAuth();
  const { isPro } = useSubscription();
  const navRouter = useRouter();
  const [form, setForm] = useState<ProfileFormState>(() => profileToForm(homeProfile));
  const [activePicker, setActivePicker] = useState<string | null>(null);
  const [showZillowModal, setShowZillowModal] = useState<boolean>(false);
  const [zillowInput, setZillowInput] = useState<string>(form.zillowLink ?? '');


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
          if (buttonIndex === 0) void takePhoto();
          else if (buttonIndex === 1) void pickImage();
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
    void updateHomeProfile(formToProfile(form));
    successNotification();
    Alert.alert('Saved', 'Your home profile has been updated.');
  }, [form, updateHomeProfile]);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'You will no longer sync data to the cloud. Your local data will remain on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => void signOut(),
        },
      ]
    );
  }, [signOut]);

  const handleManualSync = useCallback(() => {
    void pushToCloud();
  }, [pushToCloud]);

  const doCreateHousehold = useCallback(async (name: string) => {
    try {
      await createHousehold(name);
      await pushToCloud();
      Alert.alert('Household Created', `"${name}" is ready. You can now invite members.`);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to create household.');
    }
  }, [createHousehold, pushToCloud]);

  const handleCreateHousehold = useCallback(() => {
    const homeName = form.nickname || 'My Home';
    if (Platform.OS === 'ios' && Alert.prompt) {
      Alert.prompt(
        'Create Household',
        'Give your household a name so members know what they\'re joining.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Create',
            onPress: (name?: string) => {
              void doCreateHousehold((name ?? '').trim() || homeName);
            },
          },
        ],
        'plain-text',
        homeName
      );
    } else {
      void doCreateHousehold(homeName);
    }
  }, [form.nickname, doCreateHousehold]);

  const handleInviteMember = useCallback(async () => {
    try {
      const result = await generateInvite();
      const scheme = 'rork-app';
      const inviteLink = `${scheme}://join/${result.code}`;
      const message = `Join my household "${result.householdName}" on HomeEQ! Open this link to join: ${inviteLink}`;

      if (Platform.OS === 'web') {
        Alert.alert('Invite Code', `Share this code with your household member:\n\n${result.code}\n\nThey can enter it in the app to join.`);
      } else {
        const RNShare = require('react-native').Share;
        await RNShare.share({ message });
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to generate invite.');
    }
  }, [generateInvite]);

  const handleRemoveMember = useCallback((memberId: string, memberEmail: string) => {
    Alert.alert(
      'Remove Member',
      `Remove ${memberEmail} from your household? They will lose access to all shared data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await removeMember(memberId);
              } catch (e: any) {
                Alert.alert('Error', e?.message ?? 'Failed to remove member.');
              }
            })();
          },
        },
      ]
    );
  }, [removeMember]);

  const handleLeaveHousehold = useCallback(() => {
    Alert.alert(
      'Leave Household',
      'You will lose access to all shared data. Your personal local data will remain.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await leaveHousehold();
              } catch (e: any) {
                Alert.alert('Error', e?.message ?? 'Failed to leave household.');
              }
            })();
          },
        },
      ]
    );
  }, [leaveHousehold]);

  useEffect(() => {
    if (isAuthenticated) {
      void refreshHousehold();
    }
  }, [isAuthenticated, refreshHousehold]);

  const syncStatusLabel = syncStatus === 'synced'
    ? `Last synced ${lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : 'recently'}`
    : syncStatus === 'syncing'
    ? 'Syncing...'
    : syncStatus === 'error'
    ? 'Sync failed'
    : 'Not synced';

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

        {isPro ? (
          <View style={[styles.card, { backgroundColor: c.primaryLight, marginBottom: 20 }]}>
            <View style={[styles.inputRow, { paddingVertical: 16 }]}>
              <View style={[styles.inputIcon, { backgroundColor: c.primary }]}>
                <Crown size={18} color={c.white} />
              </View>
              <View style={styles.inputContent}>
                <Text style={{ fontSize: 16, fontWeight: '700' as const, color: c.primary }}>HomeEQ Pro</Text>
                <Text style={{ fontSize: 13, color: c.textSecondary, marginTop: 2 }}>All features unlocked</Text>
              </View>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: c.surface, marginBottom: 20 }]}
            onPress={() => navRouter.push('/paywall')}
            activeOpacity={0.8}
            testID="upgrade-pro-card"
          >
            <View style={[styles.inputRow, { paddingVertical: 16 }]}>
              <View style={[styles.inputIcon, { backgroundColor: c.warningLight }]}>
                <Crown size={18} color={c.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700' as const, color: c.text }}>Upgrade to Pro</Text>
                <Text style={{ fontSize: 13, color: c.textSecondary, marginTop: 2 }}>Unlock unlimited items, tasks & more</Text>
              </View>
              <ChevronDown size={16} color={c.textTertiary} style={{ transform: [{ rotate: '-90deg' }] }} />
            </View>
          </TouchableOpacity>
        )}

        <CollapsibleSection title="Account & Household" themeColors={c} globalDefault={sectionsDefaultOpen}>
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            {isAuthenticated ? (
              <>
                <View style={styles.inputRow}>
                  <View style={[styles.inputIcon, { backgroundColor: c.primaryLight }]}>
                    <Cloud size={18} color={c.primary} />
                  </View>
                  <View style={styles.inputContent}>
                    <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Signed in as</Text>
                    <Text style={[styles.textInput, { color: c.text }]}>{user?.email}</Text>
                  </View>
                </View>
                <View style={[styles.divider, { backgroundColor: c.borderLight }]} />
                <View style={styles.inputRow}>
                  <View style={[styles.inputIcon, { backgroundColor: syncStatus === 'synced' ? c.successLight : syncStatus === 'error' ? c.dangerLight : c.primaryLight }]}>
                    {syncStatus === 'syncing' ? (
                      <ActivityIndicator size="small" color={c.primary} />
                    ) : syncStatus === 'synced' ? (
                      <CheckCircle size={18} color={c.success} />
                    ) : (
                      <RefreshCw size={18} color={syncStatus === 'error' ? c.danger : c.primary} />
                    )}
                  </View>
                  <View style={[styles.inputContent, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Sync status</Text>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: c.text }}>{syncStatusLabel}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={handleManualSync}
                      style={[styles.syncNowButton, { backgroundColor: c.primaryLight }]}
                      activeOpacity={0.7}
                      disabled={syncStatus === 'syncing'}
                    >
                      <Text style={[styles.syncNowText, { color: c.primary }]}>Sync Now</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : (
              <TouchableOpacity
                style={styles.inputRow}
                onPress={() => navRouter.push('/sign-in')}
                activeOpacity={0.7}
                testID="sign-in-button"
              >
                <View style={[styles.inputIcon, { backgroundColor: c.primaryLight }]}>
                  <LogIn size={18} color={c.primary} />
                </View>
                <View style={styles.inputContent}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: c.primary }}>Sign In</Text>
                  <Text style={[styles.inputLabel, { color: c.textSecondary, marginBottom: 0, marginTop: 2 }]}>Sync your data across devices</Text>
                </View>
                <ChevronDown size={16} color={c.textTertiary} style={{ transform: [{ rotate: '-90deg' }] }} />
              </TouchableOpacity>
            )}
          </View>

          {isAuthenticated && (
            <View style={[styles.card, { backgroundColor: c.surface, marginTop: 12 }]}>
              <View style={styles.inputRow}>
                <View style={[styles.inputIcon, { backgroundColor: c.primaryLight }]}>
                  <Users size={18} color={c.primary} />
                </View>
                <View style={styles.inputContent}>
                  <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Household</Text>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>
                    {household ? household.name : 'Not set up'}
                  </Text>
                  {household && (
                    <Text style={{ fontSize: 12, color: c.textTertiary, marginTop: 2 }}>
                      {household.members.length} {household.members.length === 1 ? 'member' : 'members'}
                      {household.isOwner ? ' · You are the owner' : ` · Owned by ${household.ownerEmail}`}
                    </Text>
                  )}
                </View>
              </View>

              {household ? (
                <>
                  {household.members.map((member) => (
                    <View key={member.userId}>
                      <View style={[styles.divider, { backgroundColor: c.borderLight }]} />
                      <View style={[styles.inputRow, { paddingVertical: 10 }]}>
                        <View style={[styles.householdAvatar, { backgroundColor: member.role === 'owner' ? c.primaryLight : c.surfaceAlt }]}>
                          <User size={14} color={member.role === 'owner' ? c.primary : c.textSecondary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '500', color: c.text }}>{member.email}</Text>
                          <Text style={{ fontSize: 12, color: c.textTertiary, marginTop: 1 }}>
                            {member.role === 'owner' ? 'Owner' : getRoleLabel(member.role)} · Joined {new Date(member.joinedAt).toLocaleDateString()}
                          </Text>
                        </View>
                        {household.isOwner && member.userId !== user?.id && (
                          <TouchableOpacity
                            onPress={() => handleRemoveMember(member.userId, member.email)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            activeOpacity={0.7}
                          >
                            <X size={16} color={c.danger} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}

                  <View style={[styles.divider, { backgroundColor: c.borderLight }]} />
                  <TouchableOpacity
                    style={styles.inputRow}
                    onPress={() => void handleInviteMember()}
                    activeOpacity={0.7}
                    testID="invite-household-member-real"
                  >
                    <View style={[styles.householdInviteIconContainer, { backgroundColor: c.primaryLight }]}>
                      <UserPlus size={14} color={c.primary} />
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: c.primary }}>Invite Member</Text>
                  </TouchableOpacity>

                  {!household.isOwner && (
                    <>
                      <View style={[styles.divider, { backgroundColor: c.borderLight }]} />
                      <TouchableOpacity
                        style={styles.inputRow}
                        onPress={handleLeaveHousehold}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.inputIcon, { backgroundColor: c.dangerLight }]}>
                          <LogOut size={16} color={c.danger} />
                        </View>
                        <Text style={{ fontSize: 15, fontWeight: '500', color: c.danger }}>Leave Household</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              ) : (
                <>
                  <View style={[styles.divider, { backgroundColor: c.borderLight }]} />
                  <TouchableOpacity
                    style={styles.inputRow}
                    onPress={handleCreateHousehold}
                    activeOpacity={0.7}
                    testID="create-household-button"
                  >
                    <View style={[styles.householdInviteIconContainer, { backgroundColor: c.primaryLight }]}>
                      <UserPlus size={14} color={c.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: c.primary }}>Create Household</Text>
                      <Text style={{ fontSize: 12, color: c.textTertiary, marginTop: 2 }}>Share your home data with family members</Text>
                    </View>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {isAuthenticated && (
            <View style={[styles.card, { backgroundColor: c.surface, marginTop: 12 }]}>
              <TouchableOpacity style={styles.inputRow} onPress={handleSignOut} activeOpacity={0.7}>
                <View style={[styles.inputIcon, { backgroundColor: c.dangerLight }]}>
                  <LogOut size={18} color={c.danger} />
                </View>
                <View style={styles.inputContent}>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: c.danger }}>Sign Out</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </CollapsibleSection>

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
                <DatePickerField
                  label="Purchase date"
                  value={form.purchaseDate ?? ''}
                  onChange={(v) => updateField('purchaseDate', asISODateString(v))}
                  placeholder="Select purchase date"
                  colors={c}
                  testID="profile-purchase-date"
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
                  style={[styles.zillowEditButton, { backgroundColor: c.primaryLight }]}
                  onPress={() => setShowZillowModal(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.zillowEditText, { color: c.primary }]}>Edit Link</Text>
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
                  style={[styles.gridInput, { color: c.text }]}
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
                  style={[styles.gridInput, { color: c.text }]}
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
                  style={[styles.gridInput, { color: c.text }]}
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



        <CollapsibleSection title="App Settings" themeColors={c} globalDefault={sectionsDefaultOpen}>
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
                <Text style={[styles.switchLabel, { color: c.text }]}>Show All Sections Collapsed</Text>
              </View>
              <Switch
                value={!sectionsDefaultOpen}
                onValueChange={(v) => {
                  void setSectionsDefaultOpen(!v);
                  successNotification();
                }}
                trackColor={{ false: c.surfaceAlt, true: c.primaryLight }}
                thumbColor={!sectionsDefaultOpen ? c.primary : c.textTertiary}
                testID="sections-default-open-toggle"
              />
            </View>
            <View style={[styles.divider, { backgroundColor: c.borderLight }]} />
            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <View style={[styles.inputIcon, { backgroundColor: c.primaryLight }]}>
                  <Palette size={18} color={c.primary} />
                </View>
                <Text style={[styles.switchLabel, { color: c.text }]}>Color Palette</Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: c.borderLight }]} />
            <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
              <View style={styles.themeToggleRow}>
                {PALETTE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.paletteButton,
                      { backgroundColor: c.surfaceAlt, borderColor: c.border },
                      paletteId === option.id && styles.paletteButtonActive,
                      paletteId === option.id && { borderColor: c.primary },
                    ]}
                    onPress={() => {
                      void setPalette(option.id);
                      successNotification();
                    }}
                    activeOpacity={0.7}
                    testID={`palette-${option.id}`}
                  >
                    <View style={[styles.paletteSwatch, { backgroundColor: option.preview }]} />
                    <Text style={[
                      styles.paletteLabel,
                      { color: c.textSecondary },
                      paletteId === option.id && { color: c.primary, fontWeight: '700' },
                    ]}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </CollapsibleSection>

        <TouchableOpacity style={[styles.saveButtonLarge, { backgroundColor: c.primary }]} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveButtonLargeText}>Save Profile</Text>
        </TouchableOpacity>

        <CollapsibleSection title="Legal" themeColors={c} globalDefault={sectionsDefaultOpen}>
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            <Link href="/privacy-policy" asChild>
              <TouchableOpacity style={styles.inputRow} activeOpacity={0.7} testID="privacy-policy-link">
                <View style={[styles.inputIcon, { backgroundColor: c.primaryLight }]}>
                  <Shield size={18} color={c.primary} />
                </View>
                <View style={styles.inputContent}>
                  <Text style={{ fontSize: 16, fontWeight: '500' as const, color: c.text }}>Privacy Policy</Text>
                </View>
                <ChevronDown size={16} color={c.textTertiary} style={{ transform: [{ rotate: '-90deg' }] }} />
              </TouchableOpacity>
            </Link>
            <View style={[styles.divider, { backgroundColor: c.borderLight }]} />
            <Link href="/terms-of-service" asChild>
              <TouchableOpacity style={styles.inputRow} activeOpacity={0.7} testID="terms-of-service-link">
                <View style={[styles.inputIcon, { backgroundColor: c.primaryLight }]}>
                  <FileText size={18} color={c.primary} />
                </View>
                <View style={styles.inputContent}>
                  <Text style={{ fontSize: 16, fontWeight: '500' as const, color: c.text }}>Terms of Service</Text>
                </View>
                <ChevronDown size={16} color={c.textTertiary} style={{ transform: [{ rotate: '-90deg' }] }} />
              </TouchableOpacity>
            </Link>
          </View>
        </CollapsibleSection>

        <CollapsibleSection title="Data" themeColors={c} globalDefault={sectionsDefaultOpen}>
          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: c.dangerLight }]}
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
                      resetData({ confirmed: true });
                    },
                  },
                ]
              );
            }}
            testID="reset-data-button"
          >
            <RotateCcw size={18} color={c.danger} />
            <Text style={[styles.resetButtonText, { color: c.danger }]}>
              {isResetting ? 'Resetting...' : 'Reset All Data'}
            </Text>
          </TouchableOpacity>

          {isAuthenticated && (
            <TouchableOpacity
              style={[styles.deleteAccountButton, { backgroundColor: c.dangerLight }]}
              activeOpacity={0.7}
              onPress={() => {
                Alert.alert(
                  'Delete Account',
                  'This will permanently delete your account, all cloud data, household memberships, and sync history. Your local data on this device will remain. This action cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete Account',
                      style: 'destructive',
                      onPress: () => {
                        void deleteAccount();
                      },
                    },
                  ]
                );
              }}
              testID="delete-account-button"
            >
              <TrashIcon size={18} color={c.danger} />
              <Text style={[styles.deleteAccountText, { color: c.danger }]}>Delete Account</Text>
            </TouchableOpacity>
          )}
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
              <Search size={18} color={c.white} />
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
                  style={[styles.modalRemoveButton, { backgroundColor: c.dangerLight }]}
                  onPress={() => {
                    console.log('[Profile] Removing Zillow link');
                    updateField('zillowLink', undefined);
                    setZillowInput('');
                    setShowZillowModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modalRemoveText, { color: c.danger }]}>Remove</Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}
              <TouchableOpacity
                style={[
                  styles.modalSaveButton,
                  { backgroundColor: c.primary },
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
                <Text style={[styles.modalSaveText, { color: c.white }]}>Save</Text>
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
    fontWeight: '600',
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
    fontWeight: '700',
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
    fontWeight: '600',
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
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  textInput: {
    fontSize: 16,
    fontWeight: '500',
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
    fontWeight: '500',
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
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  gridInput: {
    fontSize: 20,
    fontWeight: '700',
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
    fontWeight: '500',
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
    fontWeight: '400',
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
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
    marginTop: 12,
  },
  deleteAccountText: {
    fontSize: 16,
    fontWeight: '600',
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
  },
  zillowEditText: {
    fontSize: 13,
    fontWeight: '600',
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
    fontWeight: '500',
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
    fontWeight: '700',
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
    fontWeight: '400',
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
  },
  modalRemoveText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalSaveButton: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalSaveButtonDisabled: {
    opacity: 0.4,
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '600',
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
    fontWeight: '600',
    color: Colors.white,
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
    fontWeight: '600',
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
    fontWeight: '600',
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
    fontWeight: '600',
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
    fontWeight: '600',
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
    fontWeight: '500',
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
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  inviteMethodTextActive: {
    color: Colors.white,
  },
  inviteRoleLabel: {
    fontSize: 12,
    fontWeight: '500',
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
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  inviteRoleChipTextActive: {
    color: Colors.white,
  },
  zillowDividerText: {
    fontSize: 12,
    fontWeight: '500',
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
    fontWeight: '600',
  },
  themeToggleTextActive: {
    fontWeight: '600',
  },
  paletteButton: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  paletteButtonActive: {
    borderWidth: 2,
  },
  paletteSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  paletteLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  syncNowButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  syncNowText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
