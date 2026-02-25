import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Animated,
  Modal,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  Phone,
  Mail,
  MapPin,
  Globe,
  Pencil,
  Check,
  X,
  Trash2,
  ExternalLink,
  StickyNote,
  Star,
  Link2,
  Plus,
  Shield,
  Wrench,
  ChevronRight,
  Award,
  Unlink,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { categoryLabels, BUDGET_CATEGORY_COLORS, CATEGORY_AVATARS } from '@/constants/categories';
import { ReviewRating, ProServiceCategory } from '@/types';
import { REVIEW_SOURCES } from '@/constants/reviewSources';
import { SERVICE_CATEGORY_OPTIONS, RADIUS_OPTIONS } from '@/constants/serviceCategories';
import StarRating from '@/components/StarRating';
import { useProviderDetail } from '@/hooks/useProviderDetail';
import { formatRating } from '@/utils/ratings';
import { lightImpact, successNotification } from '@/utils/haptics';
import createStyles from '@/styles/providerDetail';

export default function ProviderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors: c } = useTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const {
    pro,
    relatedExpenses,
    totalSpentWithPro,
    linkedAppliances,
    unlinkableAppliances,
    appliances,
    averageRating,
    handleSave,
    handleDelete,
    callPhone,
    sendEmail,
    openWebsite,
    handleAddNote,
    handleDeleteNote,
    handleSaveEditNote,
    handleLinkAppliance,
    handleUnlinkAppliance,
    handleAddRating,
    handleRemoveRating,
    handleSaveServiceInfo,
  } = useProviderDetail(id);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(pro?.name ?? '');
  const [specialty, setSpecialty] = useState(pro?.specialty ?? '');
  const [phone, setPhone] = useState(pro?.phone ?? '');
  const [email, setEmail] = useState(pro?.email ?? '');
  const [website, setWebsite] = useState(pro?.website ?? '');
  const [address, setAddress] = useState(pro?.address ?? '');
  const [notes, setNotes] = useState(pro?.notes ?? '');
  const [licenseNumber, setLicenseNumber] = useState(pro?.licenseNumber ?? '');
  const [insuranceVerified, setInsuranceVerified] = useState(pro?.insuranceVerified ?? false);

  const [newNoteText, setNewNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  const [showApplianceModal, setShowApplianceModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);

  const [ratingSource, setRatingSource] = useState<ReviewRating['source']>('google');
  const [ratingValue, setRatingValue] = useState('');
  const [ratingReviewCount, setRatingReviewCount] = useState('');
  const [ratingUrl, setRatingUrl] = useState('');

  const [selectedServiceCats, setSelectedServiceCats] = useState<ProServiceCategory[]>(pro?.serviceCategories ?? []);
  const [selectedRadius, setSelectedRadius] = useState<number>(pro?.serviceRadius ?? 20);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const onSave = useCallback(() => {
    const success = handleSave({ name, specialty, phone, email, website, address, notes, licenseNumber, insuranceVerified });
    if (success) setEditing(false);
  }, [handleSave, name, specialty, phone, email, website, address, notes, licenseNumber, insuranceVerified]);

  const onDelete = useCallback(() => {
    handleDelete(() => router.back());
  }, [handleDelete, router]);

  const onAddNote = useCallback(() => {
    if (!newNoteText.trim()) return;
    handleAddNote(newNoteText);
    setNewNoteText('');
  }, [newNoteText, handleAddNote]);

  const onSaveEditNote = useCallback(() => {
    if (!editingNoteId || !editingNoteText.trim()) return;
    handleSaveEditNote(editingNoteId, editingNoteText);
    setEditingNoteId(null);
    setEditingNoteText('');
  }, [editingNoteId, editingNoteText, handleSaveEditNote]);

  const onLinkAppliance = useCallback((applianceId: string) => {
    handleLinkAppliance(applianceId);
    setShowApplianceModal(false);
  }, [handleLinkAppliance]);

  const onAddRating = useCallback(() => {
    const success = handleAddRating({
      source: ratingSource,
      value: ratingValue,
      reviewCount: ratingReviewCount,
      url: ratingUrl,
    });
    if (success) {
      setRatingValue('');
      setRatingReviewCount('');
      setRatingUrl('');
      setShowRatingModal(false);
    }
  }, [handleAddRating, ratingSource, ratingValue, ratingReviewCount, ratingUrl]);

  const onSaveServiceInfo = useCallback(() => {
    handleSaveServiceInfo(selectedServiceCats, selectedRadius);
    setShowServiceModal(false);
  }, [handleSaveServiceInfo, selectedServiceCats, selectedRadius]);

  const toggleServiceCat = useCallback((cat: ProServiceCategory) => {
    setSelectedServiceCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }, []);

  if (!pro) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Provider' }} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Provider not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: pro.name,
          headerRight: () =>
            editing ? (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity onPress={() => setEditing(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <X size={22} color={c.danger} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onSave} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Check size={22} color={c.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setEditing(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Pencil size={20} color={c.primary} />
              </TouchableOpacity>
            ),
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{pro.name.charAt(0).toUpperCase()}</Text>
            </View>
            {editing ? (
              <TextInput style={styles.nameInput} value={name} onChangeText={setName} placeholder="Provider name" placeholderTextColor={c.textTertiary} />
            ) : (
              <Text style={styles.proName}>{pro.name}</Text>
            )}
            {editing ? (
              <TextInput style={styles.specialtyInput} value={specialty} onChangeText={setSpecialty} placeholder="Specialty" placeholderTextColor={c.textTertiary} />
            ) : (
              <Text style={styles.proSpecialty}>{pro.specialty}</Text>
            )}
            {averageRating !== null && !editing && (
              <View style={styles.overallRatingRow}>
                <StarRating rating={averageRating} size={16} />
                <Text style={styles.overallRatingText}>{formatRating(averageRating)}</Text>
                <Text style={styles.overallRatingLabel}>avg across {pro.ratings!.length} {pro.ratings!.length === 1 ? 'source' : 'sources'}</Text>
              </View>
            )}
            {pro.insuranceVerified && !editing && (
              <View style={styles.verifiedBadge}>
                <Shield size={12} color={c.primary} />
                <Text style={styles.verifiedText}>Insured</Text>
              </View>
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>${totalSpentWithPro.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total spent</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{relatedExpenses.length}</Text>
              <Text style={styles.statLabel}>{relatedExpenses.length === 1 ? 'Expense' : 'Expenses'}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{pro.serviceRadius ? `${pro.serviceRadius}mi` : '—'}</Text>
              <Text style={styles.statLabel}>Radius</Text>
            </View>
          </View>

          {(pro.serviceCategories?.length ?? 0) > 0 && !editing && (
            <View style={styles.serviceCatsWrap}>
              {pro.serviceCategories!.map((cat) => {
                const label = SERVICE_CATEGORY_OPTIONS.find((o) => o.value === cat)?.label ?? cat;
                return (
                  <View key={cat} style={styles.serviceCatChip}>
                    <Text style={styles.serviceCatChipText}>{label}</Text>
                  </View>
                );
              })}
              <TouchableOpacity style={styles.editCatsBtn} onPress={() => {
                setSelectedServiceCats(pro.serviceCategories ?? []);
                setSelectedRadius(pro.serviceRadius ?? 20);
                setShowServiceModal(true);
              }}>
                <Pencil size={12} color={c.primary} />
              </TouchableOpacity>
            </View>
          )}

          {(pro.serviceCategories?.length ?? 0) === 0 && !editing && (
            <TouchableOpacity
              style={styles.addServiceInfoBtn}
              onPress={() => {
                setSelectedServiceCats(pro.serviceCategories ?? []);
                setSelectedRadius(pro.serviceRadius ?? 20);
                setShowServiceModal(true);
              }}
              activeOpacity={0.7}
            >
              <Wrench size={16} color={c.primary} />
              <Text style={styles.addServiceInfoText}>Add service categories & radius</Text>
            </TouchableOpacity>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ratings & Reviews</Text>
              <TouchableOpacity style={styles.sectionAddBtn} onPress={() => setShowRatingModal(true)} activeOpacity={0.7}>
                <Plus size={16} color={c.primary} />
              </TouchableOpacity>
            </View>
            {(pro.ratings?.length ?? 0) === 0 ? (
              <View style={styles.emptyCard}>
                <Star size={20} color={c.textTertiary} />
                <Text style={styles.emptyCardText}>No ratings yet — add from Google, Yelp, Angi, and more</Text>
              </View>
            ) : (
              <View style={styles.ratingsGrid}>
                {pro.ratings!.map((r) => {
                  const source = REVIEW_SOURCES[r.source];
                  return (
                    <View key={r.source} style={styles.ratingCard}>
                      <View style={styles.ratingCardTop}>
                        <View style={[styles.ratingSourceDot, { backgroundColor: source.color }]} />
                        <Text style={styles.ratingSourceLabel}>{source.label}</Text>
                        <TouchableOpacity onPress={() => handleRemoveRating(r.source)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <X size={14} color={c.textTertiary} />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.ratingCardBody}>
                        <Text style={styles.ratingValue}>{formatRating(r.rating)}</Text>
                        <StarRating rating={r.rating} size={12} />
                      </View>
                      {r.reviewCount !== undefined && (
                        <Text style={styles.ratingReviewCount}>{r.reviewCount.toLocaleString()} reviews</Text>
                      )}
                      {r.url && (
                        <TouchableOpacity onPress={() => Linking.openURL(r.url!.startsWith('http') ? r.url! : `https://${r.url!}`)} style={styles.ratingLinkBtn}>
                          <ExternalLink size={11} color={c.primary} />
                          <Text style={styles.ratingLinkText}>View</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact info</Text>
            <View style={styles.card}>
              {editing ? (
                <>
                  <View style={styles.editRow}><Phone size={16} color={c.textTertiary} /><TextInput style={styles.editInput} value={phone} onChangeText={setPhone} placeholder="Phone number" placeholderTextColor={c.textTertiary} keyboardType="phone-pad" /></View>
                  <View style={styles.divider} />
                  <View style={styles.editRow}><Mail size={16} color={c.textTertiary} /><TextInput style={styles.editInput} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={c.textTertiary} keyboardType="email-address" autoCapitalize="none" /></View>
                  <View style={styles.divider} />
                  <View style={styles.editRow}><Globe size={16} color={c.textTertiary} /><TextInput style={styles.editInput} value={website} onChangeText={setWebsite} placeholder="Website" placeholderTextColor={c.textTertiary} autoCapitalize="none" /></View>
                  <View style={styles.divider} />
                  <View style={styles.editRow}><MapPin size={16} color={c.textTertiary} /><TextInput style={styles.editInput} value={address} onChangeText={setAddress} placeholder="Address" placeholderTextColor={c.textTertiary} /></View>
                  <View style={styles.divider} />
                  <View style={styles.editRow}><Award size={16} color={c.textTertiary} /><TextInput style={styles.editInput} value={licenseNumber} onChangeText={setLicenseNumber} placeholder="License #" placeholderTextColor={c.textTertiary} /></View>
                  <View style={styles.divider} />
                  <TouchableOpacity style={styles.editRow} onPress={() => setInsuranceVerified(!insuranceVerified)} activeOpacity={0.7}>
                    <Shield size={16} color={c.textTertiary} />
                    <Text style={[styles.editInput, { color: insuranceVerified ? c.primary : c.textTertiary }]}>
                      {insuranceVerified ? 'Insurance verified ✓' : 'Insurance not verified'}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.divider} />
                  <View style={styles.editRow}><StickyNote size={16} color={c.textTertiary} /><TextInput style={[styles.editInput, { minHeight: 40 }]} value={notes} onChangeText={setNotes} placeholder="General notes" placeholderTextColor={c.textTertiary} multiline /></View>
                </>
              ) : (
                <>
                  {pro.phone ? (<TouchableOpacity style={styles.contactRow} onPress={() => callPhone(pro.phone!)} activeOpacity={0.7}><Phone size={16} color="#4A7FBF" /><Text style={styles.contactText}>{pro.phone}</Text><ExternalLink size={14} color={c.textTertiary} /></TouchableOpacity>) : null}
                  {pro.phone && (pro.email || pro.website || pro.address) && <View style={styles.divider} />}
                  {pro.email ? (<TouchableOpacity style={styles.contactRow} onPress={() => sendEmail(pro.email!)} activeOpacity={0.7}><Mail size={16} color="#4A7FBF" /><Text style={styles.contactText}>{pro.email}</Text><ExternalLink size={14} color={c.textTertiary} /></TouchableOpacity>) : null}
                  {pro.email && (pro.website || pro.address) && <View style={styles.divider} />}
                  {pro.website ? (<TouchableOpacity style={styles.contactRow} onPress={() => openWebsite(pro.website!)} activeOpacity={0.7}><Globe size={16} color="#4A7FBF" /><Text style={styles.contactText}>{pro.website}</Text><ExternalLink size={14} color={c.textTertiary} /></TouchableOpacity>) : null}
                  {pro.website && pro.address && <View style={styles.divider} />}
                  {pro.address ? (<View style={styles.contactRow}><MapPin size={16} color="#4A7FBF" /><Text style={styles.contactText}>{pro.address}</Text></View>) : null}
                  {pro.licenseNumber ? (<><View style={styles.divider} /><View style={styles.contactRow}><Award size={16} color="#4A7FBF" /><Text style={styles.contactText}>License: {pro.licenseNumber}</Text></View></>) : null}
                  {pro.notes ? (<><View style={styles.divider} /><View style={styles.contactRow}><StickyNote size={16} color={c.textTertiary} /><Text style={styles.contactText}>{pro.notes}</Text></View></>) : null}
                  {!pro.phone && !pro.email && !pro.website && !pro.address && !pro.notes && (
                    <View style={styles.contactRow}><Text style={styles.noContactText}>No contact info added — tap edit to add</Text></View>
                  )}
                </>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Linked Items</Text>
              {unlinkableAppliances.length > 0 && (
                <TouchableOpacity style={styles.sectionAddBtn} onPress={() => setShowApplianceModal(true)} activeOpacity={0.7}>
                  <Plus size={16} color={c.primary} />
                </TouchableOpacity>
              )}
            </View>
            {linkedAppliances.length === 0 ? (
              <TouchableOpacity style={styles.emptyCard} onPress={unlinkableAppliances.length > 0 ? () => setShowApplianceModal(true) : undefined} activeOpacity={0.7}>
                <Link2 size={20} color={c.textTertiary} />
                <Text style={styles.emptyCardText}>
                  {appliances.length === 0 ? 'Add items first, then link them here' : 'Link this pro to your items (e.g. HVAC tech → Central AC)'}
                </Text>
              </TouchableOpacity>
            ) : (
              linkedAppliances.map((appliance) => (
                <View key={appliance.id} style={styles.linkedApplianceCard}>
                  <TouchableOpacity style={styles.linkedApplianceMain} onPress={() => { lightImpact(); router.push(`/appliance/${appliance.id}` as any); }} activeOpacity={0.7}>
                    <View style={[styles.applianceDot, { backgroundColor: CATEGORY_AVATARS[appliance.category] || c.textTertiary }]} />
                    <View style={styles.applianceInfo}>
                      <Text style={styles.applianceName}>{appliance.name}</Text>
                      <Text style={styles.applianceMeta}>{categoryLabels[appliance.category] || appliance.category}{appliance.location ? ` · ${appliance.location}` : ''}</Text>
                    </View>
                    <ChevronRight size={16} color={c.textTertiary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.unlinkBtn} onPress={() => handleUnlinkAppliance(appliance.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Unlink size={14} color={c.danger} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Private Notes</Text>
                <View style={styles.privateBadge}><Text style={styles.privateBadgeText}>Only you</Text></View>
              </View>
            </View>

            {(pro.privateNotes ?? []).map((note) => (
              <View key={note.id} style={styles.noteCard}>
                {editingNoteId === note.id ? (
                  <View style={styles.noteEditWrap}>
                    <TextInput style={styles.noteEditInput} value={editingNoteText} onChangeText={setEditingNoteText} multiline autoFocus />
                    <View style={styles.noteEditActions}>
                      <TouchableOpacity onPress={() => setEditingNoteId(null)} style={styles.noteEditCancelBtn}><Text style={styles.noteEditCancelText}>Cancel</Text></TouchableOpacity>
                      <TouchableOpacity onPress={onSaveEditNote} style={styles.noteEditSaveBtn}><Text style={styles.noteEditSaveText}>Save</Text></TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <>
                    <Text style={styles.noteText}>{note.text}</Text>
                    <View style={styles.noteFooter}>
                      <Text style={styles.noteDate}>{new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                      <View style={styles.noteActions}>
                        <TouchableOpacity onPress={() => { setEditingNoteId(note.id); setEditingNoteText(note.text); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Pencil size={13} color={c.textTertiary} /></TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteNote(note.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Trash2 size={13} color={c.danger} /></TouchableOpacity>
                      </View>
                    </View>
                  </>
                )}
              </View>
            ))}

            <View style={styles.addNoteWrap}>
              <TextInput style={styles.addNoteInput} value={newNoteText} onChangeText={setNewNoteText} placeholder="Add a private note..." placeholderTextColor={c.textTertiary} multiline />
              {newNoteText.trim().length > 0 && (
                <TouchableOpacity style={styles.addNoteBtn} onPress={onAddNote} activeOpacity={0.7}><Plus size={18} color={c.white} /></TouchableOpacity>
              )}
            </View>
          </View>

          {relatedExpenses.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Expense history</Text>
              {relatedExpenses.map((expense) => (
                <TouchableOpacity key={expense.id} style={styles.expenseRow} onPress={() => { lightImpact(); router.push(`/expense/${expense.id}` as any); }} activeOpacity={0.7}>
                  <View style={[styles.expenseDot, { backgroundColor: BUDGET_CATEGORY_COLORS[expense.category] || c.textTertiary }]} />
                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseDesc}>{expense.description}</Text>
                    <Text style={styles.expenseMeta}>{categoryLabels[expense.category] || expense.category} · {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                  </View>
                  <Text style={styles.expenseAmount}>-${expense.amount}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.deleteCard} onPress={onDelete} activeOpacity={0.7}>
            <Trash2 size={18} color={c.danger} />
            <Text style={styles.deleteText}>Remove from Trusted Pros</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>

      <Modal visible={showApplianceModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowApplianceModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Link an Item</Text>
            <TouchableOpacity onPress={() => setShowApplianceModal(false)}><X size={22} color={c.text} /></TouchableOpacity>
          </View>
          <Text style={styles.modalSubtitle}>Associate this pro with your home items</Text>
          <FlatList
            data={unlinkableAppliances}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalApplianceRow} onPress={() => onLinkAppliance(item.id)} activeOpacity={0.7}>
                <View style={[styles.modalApplianceDot, { backgroundColor: CATEGORY_AVATARS[item.category] || c.textTertiary }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalApplianceName}>{item.name}</Text>
                  <Text style={styles.modalApplianceSub}>{categoryLabels[item.category] || item.category}{item.location ? ` · ${item.location}` : ''}</Text>
                </View>
                <Plus size={18} color={c.primary} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={<View style={styles.modalEmpty}><Text style={styles.modalEmptyText}>All items are already linked</Text></View>}
          />
        </View>
      </Modal>

      <Modal visible={showRatingModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowRatingModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Rating</Text>
            <TouchableOpacity onPress={() => setShowRatingModal(false)}><X size={22} color={c.text} /></TouchableOpacity>
          </View>
          <Text style={styles.modalSubtitle}>Record ratings from review platforms</Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={styles.modalFieldLabel}>Source</Text>
            <View style={styles.sourceChipWrap}>
              {(Object.keys(REVIEW_SOURCES) as ReviewRating['source'][]).map((src) => {
                const active = ratingSource === src;
                return (
                  <TouchableOpacity key={src} style={[styles.sourceChip, active && { backgroundColor: REVIEW_SOURCES[src].color }]} onPress={() => setRatingSource(src)} activeOpacity={0.7}>
                    <Text style={[styles.sourceChipText, active && { color: '#fff' }]}>{REVIEW_SOURCES[src].label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.modalFieldLabel}>Rating (0-5)</Text>
            <TextInput style={styles.modalInput} value={ratingValue} onChangeText={setRatingValue} placeholder="e.g. 4.7" placeholderTextColor={c.textTertiary} keyboardType="decimal-pad" />
            <Text style={styles.modalFieldLabel}>Number of Reviews (optional)</Text>
            <TextInput style={styles.modalInput} value={ratingReviewCount} onChangeText={setRatingReviewCount} placeholder="e.g. 142" placeholderTextColor={c.textTertiary} keyboardType="number-pad" />
            <Text style={styles.modalFieldLabel}>Review Page URL (optional)</Text>
            <TextInput style={styles.modalInput} value={ratingUrl} onChangeText={setRatingUrl} placeholder="https://..." placeholderTextColor={c.textTertiary} autoCapitalize="none" keyboardType="url" />
            <TouchableOpacity style={styles.modalSaveBtn} onPress={onAddRating} activeOpacity={0.7}><Text style={styles.modalSaveBtnText}>Save Rating</Text></TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showServiceModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowServiceModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Service Info</Text>
            <TouchableOpacity onPress={() => setShowServiceModal(false)}><X size={22} color={c.text} /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={styles.modalFieldLabel}>Service Categories</Text>
            <View style={styles.serviceCatGrid}>
              {SERVICE_CATEGORY_OPTIONS.map((opt) => {
                const active = selectedServiceCats.includes(opt.value);
                return (
                  <TouchableOpacity key={opt.value} style={[styles.serviceCatOption, active && styles.serviceCatOptionActive]} onPress={() => toggleServiceCat(opt.value)} activeOpacity={0.7}>
                    <Text style={[styles.serviceCatOptionText, active && styles.serviceCatOptionTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.modalFieldLabel}>Service Radius</Text>
            <View style={styles.radiusWrap}>
              {RADIUS_OPTIONS.map((r) => {
                const active = selectedRadius === r;
                return (
                  <TouchableOpacity key={r} style={[styles.radiusChip, active && styles.radiusChipActive]} onPress={() => setSelectedRadius(r)} activeOpacity={0.7}>
                    <Text style={[styles.radiusChipText, active && styles.radiusChipTextActive]}>{r} mi</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={onSaveServiceInfo} activeOpacity={0.7}><Text style={styles.modalSaveBtnText}>Save Service Info</Text></TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
