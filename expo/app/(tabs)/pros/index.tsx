import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Animated,
  Linking,
  Modal,
  FlatList,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { generateId } from '@/utils/id';
import { AlertTriangle } from 'lucide-react-native';
import {
  UserCheck,
  Phone,
  Mail,
  MapPin,
  Globe,
  Receipt,
  Trash2,
  ChevronRight,
  Search,
  X,
  SlidersHorizontal,
  MapPinned,
  Link2,
  Compass,
  Wrench,
  ChevronDown,
  Plus,
  Check,
  Award,
  Shield,
  StickyNote,
  UserPlus,
} from 'lucide-react-native';
import { useHome } from '@/contexts/HomeContext';
import { useTheme } from '@/contexts/ThemeContext';
import { lightImpact, mediumImpact, successNotification } from '@/utils/haptics';
import { ProServiceCategory, toISOTimestamp, toRating, toNonNegativeInt } from '@/types';
import { SERVICE_FILTER_OPTIONS, RADIUS_FILTER_OPTIONS, SEARCH_RADIUS_OPTIONS, APPLIANCE_TO_SERVICE, SERVICE_CATEGORY_OPTIONS, RADIUS_OPTIONS } from '@/constants/serviceCategories';
import { categoryLabels, CATEGORY_AVATARS } from '@/constants/categories';
import StarRating from '@/components/StarRating';
import { searchPlaces, PlaceResult } from '@/utils/googlePlaces';
import { useMutation } from '@tanstack/react-query';
import createStyles from '@/styles/trustedPros';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TrustedProsScreen() {
  const router = useRouter();
  const { colors: c } = useTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const { trustedPros, deleteTrustedPro, addTrustedPro, appliances, homeProfile, isError, errors } = useHome();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const [selectedCategory, setSelectedCategory] = useState<ProServiceCategory | 'all'>('all');
  const [maxRadius, setMaxRadius] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [findQuery, setFindQuery] = useState('');
  const [findLocation, setFindLocation] = useState(homeProfile?.zipCode ?? '');
  const [findRadius, setFindRadius] = useState(20);
  const [showAppliancePicker, setShowAppliancePicker] = useState(false);
  const [showAddProModal, setShowAddProModal] = useState(false);

  const [addProName, setAddProName] = useState('');
  const [addProSpecialty, setAddProSpecialty] = useState('');
  const [addProPhone, setAddProPhone] = useState('');
  const [addProEmail, setAddProEmail] = useState('');
  const [addProWebsite, setAddProWebsite] = useState('');
  const [addProAddress, setAddProAddress] = useState('');
  const [addProLicense, setAddProLicense] = useState('');
  const [addProInsurance, setAddProInsurance] = useState(false);
  const [addProNotes, setAddProNotes] = useState('');
  const [addProServiceCats, setAddProServiceCats] = useState<ProServiceCategory[]>([]);
  const [addProRadius, setAddProRadius] = useState<number>(20);
  const [addProLinkedApplianceIds, setAddProLinkedApplianceIds] = useState<string[]>([]);
  const [selectedApplianceId, setSelectedApplianceId] = useState<string | null>(null);
  const [showFindSection, setShowFindSection] = useState(true);

  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const RESULTS_PER_PAGE = 5;

  const resetAddProForm = useCallback(() => {
    setAddProName('');
    setAddProSpecialty('');
    setAddProPhone('');
    setAddProEmail('');
    setAddProWebsite('');
    setAddProAddress('');
    setAddProLicense('');
    setAddProInsurance(false);
    setAddProNotes('');
    setAddProServiceCats([]);
    setAddProRadius(20);
    setAddProLinkedApplianceIds([]);
  }, []);

  const handleOpenAddPro = useCallback(() => {
    resetAddProForm();
    setShowAddProModal(true);
    lightImpact();
  }, [resetAddProForm]);

  const canSaveAddPro = addProName.trim().length > 0;

  const handleSaveAddPro = useCallback(() => {
    if (!canSaveAddPro) {
      Alert.alert('Name Required', 'Please enter a name for the professional.');
      return;
    }

    const newProId = generateId('pro');
    const newPro = {
      id: newProId,
      name: addProName.trim(),
      specialty: addProSpecialty.trim() || 'General',
      phone: addProPhone.trim() || undefined,
      email: addProEmail.trim() || undefined,
      website: addProWebsite.trim() || undefined,
      address: addProAddress.trim() || undefined,
      notes: addProNotes.trim() || undefined,
      licenseNumber: addProLicense.trim() || undefined,
      insuranceVerified: addProInsurance,
      expenseIds: [] as string[],
      createdAt: toISOTimestamp(new Date()),
      ratings: [] as [],
      serviceCategories: addProServiceCats.length > 0 ? addProServiceCats : undefined,
      serviceRadius: addProServiceCats.length > 0 ? addProRadius : undefined,
      linkedApplianceIds: addProLinkedApplianceIds.length > 0 ? addProLinkedApplianceIds : undefined,
    };

    addTrustedPro(newPro);
    successNotification();
    setShowAddProModal(false);
    resetAddProForm();
    console.log('[TrustedPros] Manually added pro:', newPro.name);
  }, [
    canSaveAddPro, addProName, addProSpecialty, addProPhone, addProEmail,
    addProWebsite, addProAddress, addProNotes, addProLicense, addProInsurance,
    addProServiceCats, addProRadius, addProLinkedApplianceIds, addTrustedPro, resetAddProForm,
  ]);

  const toggleAddProServiceCat = useCallback((cat: ProServiceCategory) => {
    setAddProServiceCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }, []);

  const toggleAddProAppliance = useCallback((applianceId: string) => {
    setAddProLinkedApplianceIds((prev) =>
      prev.includes(applianceId) ? prev.filter((id) => id !== applianceId) : [...prev, applianceId]
    );
    lightImpact();
  }, []);

  const filterAnim = useRef(new Animated.Value(0)).current;
  const findSectionAnim = useRef(new Animated.Value(1)).current;

  const placesSearchMutation = useMutation({
    mutationFn: async ({ query, location, radius }: { query: string; location: string; radius: number }) => {
      return searchPlaces(query, location, radius);
    },
    onSuccess: (data) => {
      setSearchResults(data);
      setHasSearched(true);
      setCurrentPage(1);
      console.log('[TrustedPros] Search returned', data.length, 'results');
    },
    onError: (error) => {
      console.error('[TrustedPros] Search failed:', error);
      Alert.alert('Search Failed', 'Could not search for professionals. Please check your connection and try again.');
      setHasSearched(true);
    },
  });

  const toggleFilters = useCallback(() => {
    const next = !showFilters;
    setShowFilters(next);
    Animated.timing(filterAnim, {
      toValue: next ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [showFilters, filterAnim]);

  const toggleFindSection = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.create(
      300,
      LayoutAnimation.Types.easeInEaseOut,
      LayoutAnimation.Properties.opacity,
    ));
    setShowFindSection((prev) => !prev);
    Animated.timing(findSectionAnim, {
      toValue: showFindSection ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showFindSection, findSectionAnim]);

  const selectedAppliance = useMemo(
    () => appliances.find((a) => a.id === selectedApplianceId),
    [appliances, selectedApplianceId]
  );

  const effectiveSearchQuery = useMemo(() => {
    if (findQuery.trim()) return findQuery.trim();
    if (selectedAppliance) {
      const serviceType = APPLIANCE_TO_SERVICE[selectedAppliance.category] ?? 'home repair';
      return `${serviceType} ${selectedAppliance.name}`;
    }
    return '';
  }, [findQuery, selectedAppliance]);

  const canSearch = effectiveSearchQuery.length > 0 && findLocation.trim().length > 0;

  const handleSearch = useCallback(() => {
    if (!canSearch) {
      Alert.alert('Missing Info', 'Please enter a service need and your location (zip code) to search.');
      return;
    }
    mediumImpact();
    console.log('[TrustedPros] Searching for:', effectiveSearchQuery, 'in', findLocation, 'radius:', findRadius);
    placesSearchMutation.mutate({
      query: effectiveSearchQuery,
      location: findLocation.trim(),
      radius: findRadius,
    });
  }, [canSearch, effectiveSearchQuery, findLocation, findRadius, placesSearchMutation]);

  const handleSelectAppliance = useCallback((applianceId: string) => {
    setSelectedApplianceId(applianceId);
    setFindQuery('');
    setShowAppliancePicker(false);
    lightImpact();
    console.log('[TrustedPros] Selected appliance for search:', applianceId);
  }, []);

  const clearApplianceSelection = useCallback(() => {
    setSelectedApplianceId(null);
    lightImpact();
  }, []);

  const savedProNames = useMemo(
    () => new Set(trustedPros.map((p) => p.name.toLowerCase())),
    [trustedPros]
  );

  const isAlreadySaved = useCallback((_placeId: string, placeName: string) => {
    return savedProNames.has(placeName.toLowerCase());
  }, [savedProNames]);

  const handleSavePro = useCallback((place: PlaceResult) => {
    if (isAlreadySaved(place.id, place.name)) {
      Alert.alert('Already Saved', `${place.name} is already in your Trusted Pros list.`);
      return;
    }

    const newPro = {
      id: generateId('pro'),
      name: place.name,
      specialty: place.types.length > 0
        ? place.types[0].replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())
        : effectiveSearchQuery,
      phone: place.phone ?? undefined,
      email: place.email ?? undefined,
      website: place.website ?? undefined,
      address: place.address ?? undefined,
      expenseIds: [] as string[],
      createdAt: toISOTimestamp(new Date()),
      ratings: place.rating !== null
        ? [{ source: 'google' as const, rating: toRating(place.rating), reviewCount: place.userRatingCount != null ? toNonNegativeInt(place.userRatingCount) : undefined }]
        : [],
      serviceCategories: [] as ProServiceCategory[],
    };

    addTrustedPro(newPro);
    successNotification();
    console.log('[TrustedPros] Saved pro from Places:', place.name);
  }, [isAlreadySaved, effectiveSearchQuery, addTrustedPro]);

  const filteredPros = useMemo(() => {
    let result = [...trustedPros];

    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase().trim();
      result = result.filter((pro) => {
        const nameMatch = pro.name.toLowerCase().includes(q);
        const specialtyMatch = pro.specialty.toLowerCase().includes(q);
        const categoryMatch = pro.serviceCategories?.some((cat) => cat.toLowerCase().includes(q)) ?? false;
        const linkedAppliances = appliances.filter((a) => pro.linkedApplianceIds?.includes(a.id));
        const applianceMatch = linkedAppliances.some(
          (a) => a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
        );
        return nameMatch || specialtyMatch || categoryMatch || applianceMatch;
      });
    }

    if (selectedCategory !== 'all') {
      result = result.filter((pro) =>
        pro.serviceCategories?.includes(selectedCategory) ||
        pro.specialty.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    if (maxRadius > 0) {
      result = result.filter((pro) =>
        pro.serviceRadius !== undefined && pro.serviceRadius <= maxRadius
      );
    }

    return result
      .map((pro) => ({
        ...pro,
        _avgRating: pro.ratings?.length
          ? pro.ratings.reduce((s, r) => s + r.rating, 0) / pro.ratings.length
          : null,
      }))
      .sort((a, b) => {
        const aR = a._avgRating ?? 0;
        const bR = b._avgRating ?? 0;
        if (bR !== aR) return bR - aR;
        return b.expenseIds.length - a.expenseIds.length;
      });
  }, [trustedPros, debouncedSearchQuery, selectedCategory, maxRadius, appliances]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (maxRadius > 0) count++;
    return count;
  }, [selectedCategory, maxRadius]);

  const handleDelete = useCallback((id: string, name: string) => {
    Alert.alert(
      'Remove Provider',
      `Remove ${name} from your Trusted Pros?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            lightImpact();
            deleteTrustedPro(id);
            console.log('[TrustedPros] Deleted pro:', id);
          },
        },
      ]
    );
  }, [deleteTrustedPro]);

  const clearFilters = useCallback(() => {
    setSelectedCategory('all');
    setMaxRadius(0);
    setSearchQuery('');
  }, []);

  const filterMaxHeight = filterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 220],
  });

  const filterOpacity = filterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const findOpacity = findSectionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const chevronRotation = findSectionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.findCard}>
          <TouchableOpacity
            style={styles.findCardHeader}
            onPress={toggleFindSection}
            activeOpacity={0.7}
          >
            <View style={styles.findCardHeaderLeft}>
              <View style={styles.findIconWrap}>
                <Compass size={20} color={c.white} />
              </View>
              <View>
                <Text style={styles.findCardTitle}>Find a Pro</Text>
                <Text style={styles.findCardSubtitle}>Search nearby professionals via Google</Text>
              </View>
            </View>
            <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
              <ChevronDown size={20} color={c.textSecondary} />
            </Animated.View>
          </TouchableOpacity>

          {showFindSection && (
          <Animated.View style={{ opacity: findOpacity }}>
            <View style={styles.findBody}>
              <Text style={styles.findInputLabel}>What do you need?</Text>
              <View style={styles.findInputRow}>
                <View style={styles.findInputWrap}>
                  <Wrench size={15} color={c.textTertiary} />
                  <TextInput
                    style={styles.findInput}
                    value={selectedAppliance ? '' : findQuery}
                    onChangeText={(text) => {
                      setFindQuery(text);
                      if (selectedApplianceId) setSelectedApplianceId(null);
                    }}
                    placeholder={selectedAppliance ? '' : 'e.g. plumber, electrician, HVAC...'}
                    placeholderTextColor={c.textTertiary}
                    editable={!selectedAppliance}
                    returnKeyType="search"
                    onSubmitEditing={handleSearch}
                  />
                  {selectedAppliance && (
                    <View style={styles.selectedApplianceChip}>
                      <Text style={styles.selectedApplianceText} numberOfLines={1}>
                        {selectedAppliance.name}
                      </Text>
                      <TouchableOpacity onPress={clearApplianceSelection} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                        <X size={13} color={c.primary} />
                      </TouchableOpacity>
                    </View>
                  )}
                  {!selectedAppliance && findQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setFindQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <X size={15} color={c.textTertiary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {appliances.length > 0 && !selectedAppliance && (
                <TouchableOpacity
                  style={styles.orApplianceBtn}
                  onPress={() => setShowAppliancePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.orApplianceText}>or select from your items</Text>
                  <ChevronRight size={14} color={c.primary} />
                </TouchableOpacity>
              )}

              <Text style={[styles.findInputLabel, { marginTop: 14 }]}>Your location</Text>
              <View style={styles.findInputWrap}>
                <MapPin size={15} color={c.textTertiary} />
                <TextInput
                  style={styles.findInput}
                  value={findLocation}
                  onChangeText={setFindLocation}
                  placeholder="Zip code or city"
                  placeholderTextColor={c.textTertiary}
                  keyboardType="default"
                  returnKeyType="search"
                  onSubmitEditing={handleSearch}
                />
              </View>

              <Text style={[styles.findInputLabel, { marginTop: 14 }]}>Search radius</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.findRadiusRow}
              >
                {SEARCH_RADIUS_OPTIONS.map((opt) => {
                  const active = findRadius === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.findRadiusChip, active && styles.findRadiusChipActive]}
                      onPress={() => { setFindRadius(opt.value); lightImpact(); }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.findRadiusChipText, active && styles.findRadiusChipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                style={[styles.searchButton, !canSearch && styles.searchButtonDisabled]}
                onPress={handleSearch}
                activeOpacity={0.7}
                disabled={!canSearch || placesSearchMutation.isPending}
              >
                {placesSearchMutation.isPending ? (
                  <ActivityIndicator size="small" color={c.white} />
                ) : (
                  <>
                    <Search size={18} color={c.white} />
                    <Text style={styles.searchButtonText}>Search Professionals</Text>
                  </>
                )}
              </TouchableOpacity>

              {!canSearch && !hasSearched && (
                <Text style={styles.findHint}>
                  Enter a service need and location to search
                </Text>
              )}

              {placesSearchMutation.isPending && (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator size="large" color={c.primary} />
                  <Text style={styles.loadingText}>Searching nearby professionals...</Text>
                </View>
              )}

              {hasSearched && !placesSearchMutation.isPending && searchResults.length === 0 && (
                <View style={styles.noResultsWrap}>
                  <Search size={24} color={c.textTertiary} />
                  <Text style={styles.noResultsTitle}>No results found</Text>
                  <Text style={styles.noResultsText}>
                    Try broadening your search or increasing the radius
                  </Text>
                </View>
              )}

              {searchResults.length > 0 && !placesSearchMutation.isPending && (() => {
                const totalPages = Math.ceil(searchResults.length / RESULTS_PER_PAGE);
                const startIdx = (currentPage - 1) * RESULTS_PER_PAGE;
                const paginatedResults = searchResults.slice(startIdx, startIdx + RESULTS_PER_PAGE);

                return (
                  <View style={styles.resultsSection}>
                    <View style={styles.resultsHeader}>
                      <Text style={styles.resultsTitle}>
                        {searchResults.length} {searchResults.length === 1 ? 'Result' : 'Results'} Found
                      </Text>
                      <TouchableOpacity
                        onPress={() => { setSearchResults([]); setHasSearched(false); setCurrentPage(1); }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.clearResultsText}>Clear</Text>
                      </TouchableOpacity>
                    </View>

                    {paginatedResults.map((place) => {
                      const saved = isAlreadySaved(place.id, place.name);
                      return (
                        <View key={place.id} style={styles.resultCard}>
                          <View style={styles.resultTop}>
                            <View style={styles.resultAvatar}>
                              <Text style={styles.resultAvatarText}>
                                {place.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <View style={styles.resultInfo}>
                              <Text style={styles.resultName} numberOfLines={2}>{place.name}</Text>
                              {place.rating !== null && (
                                <View style={styles.resultRatingRow}>
                                  <StarRating rating={place.rating} size={12} />
                                  <Text style={styles.resultRatingText}>{place.rating.toFixed(1)}</Text>
                                  {place.userRatingCount !== null && (
                                    <Text style={styles.resultReviewCount}>
                                      ({place.userRatingCount})
                                    </Text>
                                  )}
                                </View>
                              )}
                            </View>
                            <TouchableOpacity
                              style={[styles.saveBtn, saved && styles.saveBtnSaved]}
                              onPress={() => handleSavePro(place)}
                              activeOpacity={0.7}
                              disabled={saved}
                            >
                              {saved ? (
                                <Check size={16} color={c.primary} />
                              ) : (
                                <Plus size={16} color={c.white} />
                              )}
                            </TouchableOpacity>
                          </View>

                          <View style={styles.resultDetails}>
                            {place.address ? (
                              <View style={styles.resultDetailRow}>
                                <MapPin size={13} color={c.textTertiary} />
                                <Text style={styles.resultDetailText} numberOfLines={2}>{place.address}</Text>
                              </View>
                            ) : null}
                            {place.phone ? (
                              <TouchableOpacity
                                style={styles.resultDetailRow}
                                onPress={() => Linking.openURL(`tel:${place.phone}`).catch(() => {})}
                                activeOpacity={0.7}
                              >
                                <Phone size={13} color={c.primary} />
                                <Text style={[styles.resultDetailText, styles.resultDetailLink]}>{place.phone}</Text>
                              </TouchableOpacity>
                            ) : null}
                            {place.email ? (
                              <TouchableOpacity
                                style={styles.resultDetailRow}
                                onPress={() => Linking.openURL(`mailto:${place.email}`).catch(() => {})}
                                activeOpacity={0.7}
                              >
                                <Mail size={13} color={c.primary} />
                                <Text style={[styles.resultDetailText, styles.resultDetailLink]}>{place.email}</Text>
                              </TouchableOpacity>
                            ) : null}
                            {place.website ? (
                              <TouchableOpacity
                                style={styles.resultDetailRow}
                                onPress={() => Linking.openURL(place.website!).catch(() => {})}
                                activeOpacity={0.7}
                              >
                                <Globe size={13} color={c.primary} />
                                <Text style={[styles.resultDetailText, styles.resultDetailLink]} numberOfLines={1}>
                                  {place.website.replace(/^https?:\/\/(www\.)?/, '')}
                                </Text>
                              </TouchableOpacity>
                            ) : null}
                          </View>

                          {saved && (
                            <View style={styles.savedBadge}>
                              <Check size={11} color={c.primary} />
                              <Text style={styles.savedBadgeText}>Saved to Trusted Pros</Text>
                            </View>
                          )}
                        </View>
                      );
                    })}

                    {totalPages > 1 && (
                      <View style={styles.paginationRow}>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <TouchableOpacity
                            key={page}
                            style={[styles.paginationBtn, currentPage === page && styles.paginationBtnActive]}
                            onPress={() => { setCurrentPage(page); lightImpact(); }}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.paginationText, currentPage === page && styles.paginationTextActive]}>
                              {page}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })()}
            </View>
          </Animated.View>
          )}
        </View>

        <View style={styles.savedHeader}>
          <View style={styles.savedHeaderLeft}>
            <UserCheck size={18} color={c.primary} />
            <Text style={styles.savedHeaderTitle}>Your Saved Pros</Text>
          </View>
          <View style={styles.savedHeaderLeft}>
            <View style={styles.savedCountBadge}>
              <Text style={styles.savedCountText}>{trustedPros.length}</Text>
            </View>
            <TouchableOpacity
              style={styles.addProBtn}
              onPress={handleOpenAddPro}
              activeOpacity={0.7}
              testID="add-pro-btn"
            >
              <Plus size={18} color={c.white} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Search size={16} color={c.textTertiary} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name, specialty, or item..."
              placeholderTextColor={c.textTertiary}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={16} color={c.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[styles.filterToggleBtn, activeFilterCount > 0 && styles.filterToggleBtnActive]}
            onPress={toggleFilters}
            activeOpacity={0.7}
          >
            <SlidersHorizontal size={18} color={activeFilterCount > 0 ? c.white : c.primary} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.filtersWrap, { maxHeight: filterMaxHeight, opacity: filterOpacity }]}>
          <View style={styles.filterSection}>
            <View style={styles.filterLabelRow}>
              <Text style={styles.filterLabel}>Category</Text>
              {selectedCategory !== 'all' && (
                <TouchableOpacity onPress={() => setSelectedCategory('all')}>
                  <Text style={styles.filterClearText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
              {SERVICE_FILTER_OPTIONS.map((opt) => {
                const active = selectedCategory === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setSelectedCategory(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <View style={styles.filterLabelRow}>
              <View style={styles.filterLabelIconRow}>
                <MapPinned size={13} color={c.textSecondary} />
                <Text style={styles.filterLabel}>Max Radius</Text>
              </View>
              {maxRadius > 0 && (
                <TouchableOpacity onPress={() => setMaxRadius(0)}>
                  <Text style={styles.filterClearText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.radiusRow}>
              {RADIUS_FILTER_OPTIONS.map((opt) => {
                const active = maxRadius === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.radiusChip, active && styles.radiusChipActive]}
                    onPress={() => setMaxRadius(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.radiusChipText, active && styles.radiusChipTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Animated.View>

        {activeFilterCount > 0 && (
          <View style={styles.activeFilterSummary}>
            <Text style={styles.activeFilterText}>
              {filteredPros.length} {filteredPros.length === 1 ? 'result' : 'results'}
              {selectedCategory !== 'all' ? ` in ${SERVICE_FILTER_OPTIONS.find((o) => o.value === selectedCategory)?.label}` : ''}
              {maxRadius > 0 ? ` within ${maxRadius} mi` : ''}
            </Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearAllText}>Clear all</Text>
            </TouchableOpacity>
          </View>
        )}

        {isError ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: c.danger + '15' }]}>
              <AlertTriangle size={28} color={c.danger} />
            </View>
            <Text style={styles.emptyTitle}>Failed to load pros</Text>
            <Text style={styles.emptySubtext}>
              {errors.find((e) => e.key === 'trustedPros')?.error?.message ?? 'Something went wrong loading your Trusted Pros. Please try again.'}
            </Text>
          </View>
        ) : filteredPros.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              {trustedPros.length === 0 ? (
                <UserCheck size={28} color={c.textTertiary} />
              ) : (
                <Search size={28} color={c.textTertiary} />
              )}
            </View>
            <Text style={styles.emptyTitle}>
              {trustedPros.length === 0 ? 'No Trusted Pros yet' : 'No matching providers'}
            </Text>
            <Text style={styles.emptySubtext}>
              {trustedPros.length === 0
                ? 'Use "Find a Pro" above to search, or add provider info when logging expenses'
                : 'Try adjusting your search or filters'}
            </Text>
            {trustedPros.length > 0 && (
              <TouchableOpacity style={styles.emptyResetBtn} onPress={clearFilters} activeOpacity={0.7}>
                <Text style={styles.emptyResetText}>Reset filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredPros.map((pro) => {
            const avgRating = pro._avgRating;
            const linkedCount = pro.linkedApplianceIds?.length ?? 0;

            return (
              <TouchableOpacity
                key={pro.id}
                style={styles.proCard}
                onPress={() => {
                  lightImpact();
                  router.push({ pathname: '/provider/[id]', params: { id: pro.id } });
                }}
                activeOpacity={0.7}
              >
                <View style={styles.proTop}>
                  <View style={styles.proAvatar}>
                    <Text style={styles.proAvatarText}>
                      {pro.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.proMainInfo}>
                    <Text style={styles.proName}>{pro.name}</Text>
                    <Text style={styles.proSpecialty}>{pro.specialty}</Text>
                    {avgRating !== null && (
                      <View style={styles.proRatingRow}>
                        <StarRating rating={avgRating} size={11} />
                        <Text style={styles.proRatingText}>{avgRating.toFixed(1)}</Text>
                        <Text style={styles.proRatingCount}>
                          ({pro.ratings?.length ?? 0} {(pro.ratings?.length ?? 0) === 1 ? 'source' : 'sources'})
                        </Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDelete(pro.id, pro.name);
                    }}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Trash2 size={16} color={c.danger} />
                  </TouchableOpacity>
                </View>

                <View style={styles.proDetails}>
                  {pro.phone && (
                    <View style={styles.proDetailRow}>
                      <Phone size={13} color={c.textTertiary} />
                      <Text style={styles.proDetailText}>{pro.phone}</Text>
                    </View>
                  )}
                  {pro.email && (
                    <View style={styles.proDetailRow}>
                      <Mail size={13} color={c.textTertiary} />
                      <Text style={styles.proDetailText}>{pro.email}</Text>
                    </View>
                  )}
                  {pro.address && (
                    <View style={styles.proDetailRow}>
                      <MapPin size={13} color={c.textTertiary} />
                      <Text style={styles.proDetailText} numberOfLines={1}>{pro.address}</Text>
                    </View>
                  )}
                  {pro.website && (
                    <View style={styles.proDetailRow}>
                      <Globe size={13} color={c.textTertiary} />
                      <Text style={styles.proDetailText} numberOfLines={1}>{pro.website}</Text>
                    </View>
                  )}
                </View>

                {((pro.serviceCategories?.length ?? 0) > 0 || pro.serviceRadius) && (
                  <View style={styles.proTagsRow}>
                    {pro.serviceCategories?.slice(0, 3).map((cat) => (
                      <View key={cat} style={styles.proTag}>
                        <Text style={styles.proTagText}>
                          {SERVICE_FILTER_OPTIONS.find((o) => o.value === cat)?.label ?? cat}
                        </Text>
                      </View>
                    ))}
                    {(pro.serviceCategories?.length ?? 0) > 3 && (
                      <Text style={styles.proTagMore}>+{(pro.serviceCategories?.length ?? 0) - 3}</Text>
                    )}
                    {pro.serviceRadius && (
                      <View style={styles.proRadiusBadge}>
                        <MapPinned size={10} color={c.primary} />
                        <Text style={styles.proRadiusText}>{pro.serviceRadius} mi</Text>
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.proFooter}>
                  <View style={styles.proFooterLeft}>
                    <View style={styles.proExpenseBadge}>
                      <Receipt size={12} color={c.primary} />
                      <Text style={styles.proExpenseText}>
                        {pro.expenseIds.length} {pro.expenseIds.length === 1 ? 'expense' : 'expenses'}
                      </Text>
                    </View>
                    {linkedCount > 0 && (
                      <View style={styles.proLinkedBadge}>
                        <Link2 size={12} color={c.primary} />
                        <Text style={styles.proLinkedText}>
                          {linkedCount} {linkedCount === 1 ? 'item' : 'items'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <ChevronRight size={16} color={c.textTertiary} />
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={showAddProModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddProModal(false)}
      >
        <View style={styles.addProModalOverlay}>
          <View style={styles.addProModalContent}>
            <View style={styles.addProModalHeader}>
              <Text style={styles.addProModalTitle}>Add a Pro</Text>
              <TouchableOpacity
                onPress={() => setShowAddProModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={22} color={c.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.addProModalSubtitle}>
              Add a trusted professional you already know
            </Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.addProScrollContent}
            >
              <Text style={[styles.addProSectionLabel, { marginTop: 0 }]}>Details</Text>
              <View style={styles.addProFieldRow}>
                <UserPlus size={16} color={c.textTertiary} />
                <TextInput
                  style={styles.addProFieldInput}
                  value={addProName}
                  onChangeText={setAddProName}
                  placeholder="Name *"
                  placeholderTextColor={c.textTertiary}
                  testID="add-pro-name"
                />
              </View>
              <View style={styles.addProFieldRow}>
                <Wrench size={16} color={c.textTertiary} />
                <TextInput
                  style={styles.addProFieldInput}
                  value={addProSpecialty}
                  onChangeText={setAddProSpecialty}
                  placeholder="Specialty (e.g. Plumber, Electrician)"
                  placeholderTextColor={c.textTertiary}
                />
              </View>

              <Text style={styles.addProSectionLabel}>Contact</Text>
              <View style={styles.addProFieldRow}>
                <Phone size={16} color={c.textTertiary} />
                <TextInput
                  style={styles.addProFieldInput}
                  value={addProPhone}
                  onChangeText={setAddProPhone}
                  placeholder="Phone number"
                  placeholderTextColor={c.textTertiary}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.addProFieldRow}>
                <Mail size={16} color={c.textTertiary} />
                <TextInput
                  style={styles.addProFieldInput}
                  value={addProEmail}
                  onChangeText={setAddProEmail}
                  placeholder="Email"
                  placeholderTextColor={c.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.addProFieldRow}>
                <Globe size={16} color={c.textTertiary} />
                <TextInput
                  style={styles.addProFieldInput}
                  value={addProWebsite}
                  onChangeText={setAddProWebsite}
                  placeholder="Website"
                  placeholderTextColor={c.textTertiary}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
              <View style={styles.addProFieldRow}>
                <MapPin size={16} color={c.textTertiary} />
                <TextInput
                  style={styles.addProFieldInput}
                  value={addProAddress}
                  onChangeText={setAddProAddress}
                  placeholder="Address"
                  placeholderTextColor={c.textTertiary}
                />
              </View>
              <View style={styles.addProFieldRow}>
                <Award size={16} color={c.textTertiary} />
                <TextInput
                  style={styles.addProFieldInput}
                  value={addProLicense}
                  onChangeText={setAddProLicense}
                  placeholder="License #"
                  placeholderTextColor={c.textTertiary}
                />
              </View>
              <TouchableOpacity
                style={styles.addProInsuranceRow}
                onPress={() => setAddProInsurance((v) => !v)}
                activeOpacity={0.7}
              >
                <Shield size={16} color={addProInsurance ? c.primary : c.textTertiary} />
                <Text style={[styles.addProInsuranceText, { color: addProInsurance ? c.primary : c.textSecondary }]}>
                  {addProInsurance ? 'Insurance verified' : 'Insurance not verified'}
                </Text>
                {addProInsurance && <Check size={16} color={c.primary} />}
              </TouchableOpacity>
              <View style={styles.addProFieldRow}>
                <StickyNote size={16} color={c.textTertiary} />
                <TextInput
                  style={styles.addProNotesInput}
                  value={addProNotes}
                  onChangeText={setAddProNotes}
                  placeholder="Notes"
                  placeholderTextColor={c.textTertiary}
                  multiline
                />
              </View>

              <Text style={styles.addProSectionLabel}>Service Info</Text>
              <View style={styles.addProCatGrid}>
                {SERVICE_CATEGORY_OPTIONS.map((opt) => {
                  const active = addProServiceCats.includes(opt.value);
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.addProCatChip, active && styles.addProCatChipActive]}
                      onPress={() => toggleAddProServiceCat(opt.value)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.addProCatChipText, active && styles.addProCatChipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {addProServiceCats.length > 0 && (
                <>
                  <Text style={[styles.addProSectionLabel, { marginTop: 16 }]}>Service Radius</Text>
                  <View style={styles.addProRadiusRow}>
                    {RADIUS_OPTIONS.map((r) => {
                      const active = addProRadius === r;
                      return (
                        <TouchableOpacity
                          key={r}
                          style={[styles.addProRadiusChip, active && styles.addProRadiusChipActive]}
                          onPress={() => { setAddProRadius(r); lightImpact(); }}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.addProRadiusChipText, active && styles.addProRadiusChipTextActive]}>
                            {r} mi
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              <Text style={styles.addProSectionLabel}>Linked Items</Text>
              {appliances.length === 0 ? (
                <View style={styles.addProEmptyAppliances}>
                  <Text style={styles.addProEmptyAppliancesText}>No items added yet</Text>
                </View>
              ) : (
                appliances.map((item) => {
                  const linked = addProLinkedApplianceIds.includes(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.addProApplianceRow}
                      onPress={() => toggleAddProAppliance(item.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.addProApplianceDot, { backgroundColor: CATEGORY_AVATARS[item.category] || c.textTertiary }]} />
                      <View style={styles.addProApplianceInfo}>
                        <Text style={styles.addProApplianceName}>{item.name}</Text>
                        <Text style={styles.addProApplianceMeta}>
                          {categoryLabels[item.category] || item.category}{item.location ? ` · ${item.location}` : ''}
                        </Text>
                      </View>
                      <View style={[styles.addProCheckbox, linked && styles.addProCheckboxActive]}>
                        {linked && <Check size={14} color={c.white} />}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}

              <TouchableOpacity
                style={[styles.addProSaveBtn, !canSaveAddPro && styles.addProSaveBtnDisabled]}
                onPress={handleSaveAddPro}
                activeOpacity={0.7}
                disabled={!canSaveAddPro}
                testID="save-add-pro-btn"
              >
                <Text style={styles.addProSaveBtnText}>Save Pro</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAppliancePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAppliancePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select an Item</Text>
              <TouchableOpacity
                onPress={() => setShowAppliancePicker(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={22} color={c.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              We'll search for the right type of professional based on your item
            </Text>
            <FlatList
              data={appliances}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => {
                const serviceType = APPLIANCE_TO_SERVICE[item.category] ?? 'home repair';
                return (
                  <TouchableOpacity
                    style={styles.appliancePickerItem}
                    onPress={() => handleSelectAppliance(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.appliancePickerLeft}>
                      <View style={styles.appliancePickerIcon}>
                        <Wrench size={16} color={c.primary} />
                      </View>
                      <View style={styles.appliancePickerInfo}>
                        <Text style={styles.appliancePickerName}>{item.name}</Text>
                        <Text style={styles.appliancePickerMeta}>
                          {item.brand}{item.model ? ` · ${item.model}` : ''}
                        </Text>
                        <Text style={styles.appliancePickerService}>
                          Will search for: {serviceType}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={16} color={c.textTertiary} />
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyModalState}>
                  <Text style={styles.emptyModalText}>No items added yet</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
