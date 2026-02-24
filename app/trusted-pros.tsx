import React, { useMemo, useState, useCallback, useRef } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
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
  Star,
  SlidersHorizontal,
  MapPinned,
  Link2,
  Compass,
  Wrench,
  ChevronDown,
  Plus,
  Check,
} from 'lucide-react-native';
import { useHome } from '@/contexts/HomeContext';
import Colors from '@/constants/colors';
import { lightImpact, mediumImpact, successNotification } from '@/utils/haptics';
import { ProServiceCategory } from '@/types';
import { SERVICE_FILTER_OPTIONS, RADIUS_FILTER_OPTIONS, SEARCH_RADIUS_OPTIONS, APPLIANCE_TO_SERVICE } from '@/constants/serviceCategories';
import StarRating from '@/components/StarRating';
import { searchPlaces, PlaceResult } from '@/utils/googlePlaces';
import { useMutation } from '@tanstack/react-query';
import styles from '@/styles/trustedPros';

export default function TrustedProsScreen() {
  const router = useRouter();
  const { trustedPros, deleteTrustedPro, addTrustedPro, appliances, homeProfile } = useHome();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProServiceCategory | 'all'>('all');
  const [maxRadius, setMaxRadius] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [findQuery, setFindQuery] = useState('');
  const [findLocation, setFindLocation] = useState(homeProfile?.zipCode ?? '');
  const [findRadius, setFindRadius] = useState(20);
  const [showAppliancePicker, setShowAppliancePicker] = useState(false);
  const [selectedApplianceId, setSelectedApplianceId] = useState<string | null>(null);
  const [showFindSection, setShowFindSection] = useState(true);

  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [savedPlaceIds, setSavedPlaceIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const RESULTS_PER_PAGE = 5;

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
    const next = !showFindSection;
    setShowFindSection(next);
    Animated.timing(findSectionAnim, {
      toValue: next ? 1 : 0,
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

  const isAlreadySaved = useCallback((placeId: string, placeName: string) => {
    if (savedPlaceIds.has(placeId)) return true;
    return trustedPros.some((p) => p.name.toLowerCase() === placeName.toLowerCase());
  }, [savedPlaceIds, trustedPros]);

  const handleSavePro = useCallback((place: PlaceResult) => {
    if (isAlreadySaved(place.id, place.name)) {
      Alert.alert('Already Saved', `${place.name} is already in your Trusted Pros list.`);
      return;
    }

    const newPro = {
      id: `pro-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: place.name,
      specialty: place.types.length > 0
        ? place.types[0].replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : effectiveSearchQuery,
      phone: place.phone ?? undefined,
      email: place.email ?? undefined,
      website: place.website ?? undefined,
      address: place.address ?? undefined,
      expenseIds: [] as string[],
      createdAt: new Date().toISOString(),
      ratings: place.rating !== null
        ? [{ source: 'google' as const, rating: place.rating, reviewCount: place.userRatingCount ?? undefined }]
        : [],
      serviceCategories: [] as ProServiceCategory[],
    };

    addTrustedPro(newPro);
    setSavedPlaceIds((prev) => new Set(prev).add(place.id));
    successNotification();
    console.log('[TrustedPros] Saved pro from Places:', place.name);
  }, [isAlreadySaved, effectiveSearchQuery, addTrustedPro]);

  const filteredPros = useMemo(() => {
    let result = [...trustedPros];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((pro) => {
        const nameMatch = pro.name.toLowerCase().includes(q);
        const specialtyMatch = pro.specialty.toLowerCase().includes(q);
        const categoryMatch = pro.serviceCategories?.some((c) => c.toLowerCase().includes(q)) ?? false;
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

    return result.sort((a, b) => {
      const aRating = a.ratings?.length ? a.ratings.reduce((s, r) => s + r.rating, 0) / a.ratings.length : 0;
      const bRating = b.ratings?.length ? b.ratings.reduce((s, r) => s + r.rating, 0) / b.ratings.length : 0;
      if (bRating !== aRating) return bRating - aRating;
      return b.expenseIds.length - a.expenseIds.length;
    });
  }, [trustedPros, searchQuery, selectedCategory, maxRadius, appliances]);

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

  const findMaxHeight = findSectionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 800],
  });

  const findOpacity = findSectionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const chevronRotation = findSectionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const renderStars = useCallback((rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} size={12} color="#F5A623" fill="#F5A623" />);
      } else if (i === fullStars && hasHalf) {
        stars.push(<Star key={i} size={12} color="#F5A623" fill="#F5A623" style={{ opacity: 0.5 }} />);
      } else {
        stars.push(<Star key={i} size={12} color="#DDD" />);
      }
    }
    return stars;
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Find a Pro Section */}
        <View style={styles.findCard}>
          <TouchableOpacity
            style={styles.findCardHeader}
            onPress={toggleFindSection}
            activeOpacity={0.7}
          >
            <View style={styles.findCardHeaderLeft}>
              <View style={styles.findIconWrap}>
                <Compass size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.findCardTitle}>Find a Pro</Text>
                <Text style={styles.findCardSubtitle}>Search nearby professionals via Google</Text>
              </View>
            </View>
            <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
              <ChevronDown size={20} color="#5A7FA0" />
            </Animated.View>
          </TouchableOpacity>

          <Animated.View style={{ maxHeight: findMaxHeight, opacity: findOpacity, overflow: 'hidden' }}>
            <View style={styles.findBody}>
              <Text style={styles.findInputLabel}>What do you need?</Text>
              <View style={styles.findInputRow}>
                <View style={styles.findInputWrap}>
                  <Wrench size={15} color={Colors.textTertiary} />
                  <TextInput
                    style={styles.findInput}
                    value={selectedAppliance ? '' : findQuery}
                    onChangeText={(text) => {
                      setFindQuery(text);
                      if (selectedApplianceId) setSelectedApplianceId(null);
                    }}
                    placeholder={selectedAppliance ? '' : 'e.g. plumber, electrician, HVAC...'}
                    placeholderTextColor={Colors.textTertiary}
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
                        <X size={13} color="#4A7FBF" />
                      </TouchableOpacity>
                    </View>
                  )}
                  {!selectedAppliance && findQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setFindQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <X size={15} color={Colors.textTertiary} />
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
                  <ChevronRight size={14} color="#4A7FBF" />
                </TouchableOpacity>
              )}

              <Text style={[styles.findInputLabel, { marginTop: 14 }]}>Your location</Text>
              <View style={styles.findInputWrap}>
                <MapPin size={15} color={Colors.textTertiary} />
                <TextInput
                  style={styles.findInput}
                  value={findLocation}
                  onChangeText={setFindLocation}
                  placeholder="Zip code or city"
                  placeholderTextColor={Colors.textTertiary}
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
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Search size={18} color="#fff" />
                    <Text style={styles.searchButtonText}>Search Professionals</Text>
                  </>
                )}
              </TouchableOpacity>

              {!canSearch && !hasSearched && (
                <Text style={styles.findHint}>
                  Enter a service need and location to search
                </Text>
              )}

              {/* Search Results */}
              {placesSearchMutation.isPending && (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.loadingText}>Searching nearby professionals...</Text>
                </View>
              )}

              {hasSearched && !placesSearchMutation.isPending && searchResults.length === 0 && (
                <View style={styles.noResultsWrap}>
                  <Search size={24} color={Colors.textTertiary} />
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
                                  <View style={styles.starsRow}>
                                    {renderStars(place.rating)}
                                  </View>
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
                                <Check size={16} color={Colors.primary} />
                              ) : (
                                <Plus size={16} color="#fff" />
                              )}
                            </TouchableOpacity>
                          </View>

                          <View style={styles.resultDetails}>
                            {place.address ? (
                              <View style={styles.resultDetailRow}>
                                <MapPin size={13} color={Colors.textTertiary} />
                                <Text style={styles.resultDetailText} numberOfLines={2}>{place.address}</Text>
                              </View>
                            ) : null}
                            {place.phone ? (
                              <TouchableOpacity
                                style={styles.resultDetailRow}
                                onPress={() => Linking.openURL(`tel:${place.phone}`)}
                                activeOpacity={0.7}
                              >
                                <Phone size={13} color="#4A7FBF" />
                                <Text style={[styles.resultDetailText, styles.resultDetailLink]}>{place.phone}</Text>
                              </TouchableOpacity>
                            ) : null}
                            {place.email ? (
                              <TouchableOpacity
                                style={styles.resultDetailRow}
                                onPress={() => Linking.openURL(`mailto:${place.email}`)}
                                activeOpacity={0.7}
                              >
                                <Mail size={13} color="#4A7FBF" />
                                <Text style={[styles.resultDetailText, styles.resultDetailLink]}>{place.email}</Text>
                              </TouchableOpacity>
                            ) : null}
                            {place.website ? (
                              <TouchableOpacity
                                style={styles.resultDetailRow}
                                onPress={() => Linking.openURL(place.website!)}
                                activeOpacity={0.7}
                              >
                                <Globe size={13} color="#4A7FBF" />
                                <Text style={[styles.resultDetailText, styles.resultDetailLink]} numberOfLines={1}>
                                  {place.website.replace(/^https?:\/\/(www\.)?/, '')}
                                </Text>
                              </TouchableOpacity>
                            ) : null}
                          </View>

                          {saved && (
                            <View style={styles.savedBadge}>
                              <Check size={11} color={Colors.primary} />
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
        </View>

        {/* Saved Pros Header */}
        <View style={styles.savedHeader}>
          <View style={styles.savedHeaderLeft}>
            <UserCheck size={18} color="#4A7FBF" />
            <Text style={styles.savedHeaderTitle}>Your Saved Pros</Text>
          </View>
          <View style={styles.savedCountBadge}>
            <Text style={styles.savedCountText}>{trustedPros.length}</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Search size={16} color={Colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name, specialty, or item..."
              placeholderTextColor={Colors.textTertiary}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={16} color={Colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[styles.filterToggleBtn, activeFilterCount > 0 && styles.filterToggleBtnActive]}
            onPress={toggleFilters}
            activeOpacity={0.7}
          >
            <SlidersHorizontal size={18} color={activeFilterCount > 0 ? Colors.white : Colors.primary} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Expandable Filters */}
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
                <MapPinned size={13} color={Colors.textSecondary} />
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

        {/* Active Filter Summary */}
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

        {/* Results */}
        {filteredPros.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              {trustedPros.length === 0 ? (
                <UserCheck size={28} color={Colors.textTertiary} />
              ) : (
                <Search size={28} color={Colors.textTertiary} />
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
            const avgRating = pro.ratings?.length
              ? pro.ratings.reduce((s, r) => s + r.rating, 0) / pro.ratings.length
              : null;
            const linkedCount = pro.linkedApplianceIds?.length ?? 0;

            return (
              <TouchableOpacity
                key={pro.id}
                style={styles.proCard}
                onPress={() => {
                  lightImpact();
                  router.push(`/provider/${pro.id}` as any);
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
                          ({pro.ratings!.length} {pro.ratings!.length === 1 ? 'source' : 'sources'})
                        </Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      handleDelete(pro.id, pro.name);
                    }}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Trash2 size={16} color={Colors.danger} />
                  </TouchableOpacity>
                </View>

                <View style={styles.proDetails}>
                  {pro.phone && (
                    <View style={styles.proDetailRow}>
                      <Phone size={13} color={Colors.textTertiary} />
                      <Text style={styles.proDetailText}>{pro.phone}</Text>
                    </View>
                  )}
                  {pro.email && (
                    <View style={styles.proDetailRow}>
                      <Mail size={13} color={Colors.textTertiary} />
                      <Text style={styles.proDetailText}>{pro.email}</Text>
                    </View>
                  )}
                  {pro.address && (
                    <View style={styles.proDetailRow}>
                      <MapPin size={13} color={Colors.textTertiary} />
                      <Text style={styles.proDetailText} numberOfLines={1}>{pro.address}</Text>
                    </View>
                  )}
                  {pro.website && (
                    <View style={styles.proDetailRow}>
                      <Globe size={13} color={Colors.textTertiary} />
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
                        <MapPinned size={10} color="#4A7FBF" />
                        <Text style={styles.proRadiusText}>{pro.serviceRadius} mi</Text>
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.proFooter}>
                  <View style={styles.proFooterLeft}>
                    <View style={styles.proExpenseBadge}>
                      <Receipt size={12} color={Colors.primary} />
                      <Text style={styles.proExpenseText}>
                        {pro.expenseIds.length} {pro.expenseIds.length === 1 ? 'expense' : 'expenses'}
                      </Text>
                    </View>
                    {linkedCount > 0 && (
                      <View style={styles.proLinkedBadge}>
                        <Link2 size={12} color="#4A7FBF" />
                        <Text style={styles.proLinkedText}>
                          {linkedCount} {linkedCount === 1 ? 'item' : 'items'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <ChevronRight size={16} color={Colors.textTertiary} />
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Appliance Picker Modal */}
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
                <X size={22} color={Colors.textSecondary} />
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
                        <Wrench size={16} color="#4A7FBF" />
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
                    <ChevronRight size={16} color={Colors.textTertiary} />
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

