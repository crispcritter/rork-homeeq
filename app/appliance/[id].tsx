import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  FlatList,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import {
  Shield,
  MapPin,
  Calendar,
  Hash,
  Trash2,
  Clock,
  Wrench,
  Pencil,
  DollarSign,
  Store,
  CreditCard,
  FileText,
  Receipt,
  Star,
  ChevronRight,
  BookOpen,
  Upload,
  Search,
  ExternalLink,
  X,
  Sparkles,
  Plus,
  Check,
  RotateCcw,
} from 'lucide-react-native';
import { useHome } from '@/contexts/HomeContext';
import Colors from '@/constants/colors';
import { categoryLabels } from '@/constants/categories';
import { getWarrantyStatus, formatMonthDay, formatMonthYear, formatLongDate } from '@/utils/dates';
import { lightImpact, successNotification, warningNotification } from '@/utils/haptics';
import { useManualSearch } from '@/hooks/useManualSearch';
import { useMaintenanceRecommendations } from '@/hooks/useMaintenanceRecommendations';

export default function ApplianceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getApplianceById, tasks, deleteAppliance, budgetItems, updateAppliance, addTask } = useHome();

  const appliance = getApplianceById(id ?? '');
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const screenWidth = Dimensions.get('window').width;

  const { isSearchingManual, handleUploadManual, handleFindManual } = useManualSearch({
    brand: appliance?.brand ?? '',
    model: appliance?.model ?? '',
    serialNumber: appliance?.serialNumber ?? '',
    name: appliance?.name ?? '',
  });

  const {
    isGeneratingRecs,
    recommendations,
    addedRecIds,
    handleGenerateRecommendations,
    handleAddRecommendationAsTask,
    handleAddAllRecommendations,
  } = useMaintenanceRecommendations(appliance, addTask);

  const relatedTasks = useMemo(
    () => tasks.filter((t) => t.applianceId === id).sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [tasks, id]
  );

  const relatedExpenses = useMemo(
    () => budgetItems.filter((b) => b.applianceId === id).sort((a, b) => b.date.localeCompare(a.date)),
    [budgetItems, id]
  );

  const totalExpenses = useMemo(
    () => relatedExpenses.reduce((sum, item) => sum + item.amount, 0),
    [relatedExpenses]
  );

  const handleUploadManualAction = useCallback(async () => {
    if (!appliance) return;
    const result = await handleUploadManual();
    if (result) {
      updateAppliance({ ...appliance, manual: result });
      successNotification();
    }
  }, [appliance, handleUploadManual, updateAppliance]);

  const handleFindManualAction = useCallback(async () => {
    if (!appliance) return;
    const result = await handleFindManual();
    if (result) {
      updateAppliance({ ...appliance, manual: result });
      Alert.alert('Manual Found', 'We found a manual link for your appliance.');
    }
  }, [appliance, handleFindManual, updateAppliance]);

  const handleOpenManual = useCallback(() => {
    if (!appliance?.manual) return;
    if (appliance.manual.type === 'link') {
      Linking.openURL(appliance.manual.uri).catch(() => {
        Alert.alert('Error', 'Could not open the manual link.');
      });
    }
  }, [appliance]);

  const handleRemoveManual = useCallback(() => {
    if (!appliance) return;
    Alert.alert('Remove Manual', 'Are you sure you want to remove the stored manual?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          updateAppliance({ ...appliance, manual: undefined });
          warningNotification();
        },
      },
    ]);
  }, [appliance, updateAppliance]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Remove this item?',
      `Are you sure you want to remove "${appliance?.name}"? This can't be undone.`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            warningNotification();
            deleteAppliance(id ?? '');
            router.back();
          },
        },
      ]
    );
  }, [appliance, id, deleteAppliance, router]);

  if (!appliance) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Item not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const warranty = getWarrantyStatus(appliance.warrantyExpiry, Colors);

  return (
    <>
      <Stack.Screen options={{ title: appliance.name }} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {appliance.photos && appliance.photos.length > 1 ? (
          <View>
            <FlatList
              data={appliance.photos}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
                setActivePhotoIndex(index);
              }}
              renderItem={({ item }) => (
                <View style={{ width: screenWidth, height: 220 }}>
                  <Image source={{ uri: item.uri }} style={styles.heroImage} contentFit="cover" />
                  {item.isPrimary && (
                    <View style={styles.heroPrimaryBadge}>
                      <Star size={10} color={Colors.white} fill={Colors.white} />
                      <Text style={styles.heroPrimaryText}>Primary</Text>
                    </View>
                  )}
                </View>
              )}
            />
            <View style={styles.photoDots}>
              {appliance.photos.map((_, i) => (
                <View
                  key={i}
                  style={[styles.photoDot, i === activePhotoIndex && styles.photoDotActive]}
                />
              ))}
            </View>
          </View>
        ) : appliance.imageUrl ? (
          <Image source={{ uri: appliance.imageUrl }} style={styles.heroImage} contentFit="cover" />
        ) : (
          <View style={[styles.heroImage, styles.heroPlaceholder]}>
            <Text style={styles.heroInitial}>{appliance.name[0]}</Text>
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>{appliance.name}</Text>
            <Text style={styles.subtitle}>{appliance.brand} · {appliance.model}</Text>
          </View>

          <View style={styles.warrantyCard}>
            <View style={styles.warrantyHeader}>
              <Shield size={20} color={warranty.color} />
              <Text style={[styles.warrantyStatus, { color: warranty.color }]}>{warranty.label}</Text>
            </View>
            <Text style={styles.warrantyExpiry}>
              {warranty.daysLeft > 0
                ? `${warranty.daysLeft} days remaining`
                : warranty.daysLeft === 0
                ? 'Expires today'
                : `Expired ${Math.abs(warranty.daysLeft)} days ago`}
            </Text>
            <Text style={styles.warrantyDate}>
              Warranty ends {formatLongDate(appliance.warrantyExpiry)}
            </Text>
          </View>

          <View style={styles.detailsCard}>
            <View style={styles.detailItem}>
              <View style={[styles.detailIcon, { backgroundColor: Colors.primaryLight }]}>
                <MapPin size={16} color={Colors.primary} />
              </View>
              <View style={styles.detailTextWrap}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{appliance.location || 'Not set'}</Text>
              </View>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailItem}>
              <View style={[styles.detailIcon, { backgroundColor: Colors.accentLight }]}>
                <Calendar size={16} color={Colors.accent} />
              </View>
              <View style={styles.detailTextWrap}>
                <Text style={styles.detailLabel}>Purchased</Text>
                <Text style={styles.detailValue}>{formatMonthYear(appliance.purchaseDate)}</Text>
              </View>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailItem}>
              <View style={[styles.detailIcon, { backgroundColor: '#EDE9FE' }]}>
                <Hash size={16} color="#7C3AED" />
              </View>
              <View style={styles.detailTextWrap}>
                <Text style={styles.detailLabel}>Serial Number</Text>
                <Text style={styles.detailValue}>{appliance.serialNumber || 'Not recorded'}</Text>
              </View>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailItem}>
              <View style={[styles.detailIcon, { backgroundColor: '#DBEAFE' }]}>
                <Wrench size={16} color="#5B8CB8" />
              </View>
              <View style={styles.detailTextWrap}>
                <Text style={styles.detailLabel}>Type</Text>
                <Text style={styles.detailValue}>{categoryLabels[appliance.category] || appliance.category}</Text>
              </View>
            </View>
          </View>

          {(appliance.purchaseData && (appliance.purchaseData.price || appliance.purchaseData.retailer || appliance.purchaseData.paymentMethod || appliance.purchaseData.orderNumber)) ? (
            <View style={styles.purchaseCard}>
              <View style={styles.purchaseHeader}>
                <Receipt size={18} color={Colors.warning} />
                <Text style={styles.cardTitle}>Purchase Details</Text>
              </View>
              {appliance.purchaseData.price ? (
                <>
                  <View style={styles.purchaseItem}>
                    <View style={[styles.detailIcon, { backgroundColor: '#FEF3C7' }]}>
                      <DollarSign size={16} color={Colors.warning} />
                    </View>
                    <View style={styles.detailTextWrap}>
                      <Text style={styles.detailLabel}>Price Paid</Text>
                      <Text style={styles.detailValue}>${appliance.purchaseData.price.toFixed(2)}</Text>
                    </View>
                  </View>
                  <View style={styles.purchaseDivider} />
                </>
              ) : null}
              {appliance.purchaseData.retailer ? (
                <>
                  <View style={styles.purchaseItem}>
                    <View style={[styles.detailIcon, { backgroundColor: Colors.accentLight }]}>
                      <Store size={16} color={Colors.accent} />
                    </View>
                    <View style={styles.detailTextWrap}>
                      <Text style={styles.detailLabel}>Purchased From</Text>
                      <Text style={styles.detailValue}>{appliance.purchaseData.retailer}</Text>
                    </View>
                  </View>
                  <View style={styles.purchaseDivider} />
                </>
              ) : null}
              {appliance.purchaseData.paymentMethod ? (
                <>
                  <View style={styles.purchaseItem}>
                    <View style={[styles.detailIcon, { backgroundColor: '#EDE9FE' }]}>
                      <CreditCard size={16} color="#7C3AED" />
                    </View>
                    <View style={styles.detailTextWrap}>
                      <Text style={styles.detailLabel}>Payment Method</Text>
                      <Text style={styles.detailValue}>{appliance.purchaseData.paymentMethod}</Text>
                    </View>
                  </View>
                  <View style={styles.purchaseDivider} />
                </>
              ) : null}
              {appliance.purchaseData.orderNumber ? (
                <View style={styles.purchaseItem}>
                  <View style={[styles.detailIcon, { backgroundColor: '#DBEAFE' }]}>
                    <FileText size={16} color="#5B8CB8" />
                  </View>
                  <View style={styles.detailTextWrap}>
                    <Text style={styles.detailLabel}>Order / Receipt #</Text>
                    <Text style={styles.detailValue}>{appliance.purchaseData.orderNumber}</Text>
                  </View>
                </View>
              ) : null}
              {appliance.purchaseData.receiptImageUrl ? (
                <>
                  <View style={styles.purchaseDivider} />
                  <View style={styles.receiptImageWrap}>
                    <Image source={{ uri: appliance.purchaseData.receiptImageUrl }} style={styles.receiptImage} contentFit="cover" />
                    <Text style={styles.receiptImageLabel}>Receipt photo</Text>
                  </View>
                </>
              ) : null}
            </View>
          ) : null}

          {appliance.notes ? (
            <View style={styles.notesCard}>
              <Text style={styles.cardTitle}>Notes</Text>
              <Text style={styles.notesText}>{appliance.notes}</Text>
            </View>
          ) : null}

          <View style={styles.manualCard}>
            <View style={styles.manualHeader}>
              <BookOpen size={18} color="#5B8CB8" />
              <Text style={styles.cardTitle}>User Manual</Text>
            </View>
            {appliance.manual ? (
              <View style={styles.manualContent}>
                {appliance.manual.type === 'link' ? (
                  <TouchableOpacity style={styles.manualLinkRow} onPress={handleOpenManual} activeOpacity={0.7} testID="open-manual-link">
                    <View style={styles.manualLinkIcon}>
                      <ExternalLink size={18} color="#5B8CB8" />
                    </View>
                    <View style={styles.manualLinkInfo}>
                      <Text style={styles.manualLinkTitle} numberOfLines={1}>{appliance.manual.title || 'View Manual'}</Text>
                      <Text style={styles.manualLinkUrl} numberOfLines={1}>{appliance.manual.uri}</Text>
                      {appliance.manual.foundVia === 'search' && (
                        <View style={styles.manualFoundBadge}>
                          <Search size={9} color="#5B8CB8" />
                          <Text style={styles.manualFoundText}>Found via search</Text>
                        </View>
                      )}
                    </View>
                    <ChevronRight size={16} color={Colors.textTertiary} />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.manualUploadedRow}>
                    <View style={styles.manualUploadedIcon}>
                      <FileText size={18} color={Colors.primary} />
                    </View>
                    <View style={styles.manualLinkInfo}>
                      <Text style={styles.manualLinkTitle} numberOfLines={1}>{appliance.manual.title || 'Uploaded Manual'}</Text>
                      <View style={styles.manualFoundBadge}>
                        <Upload size={9} color={Colors.primary} />
                        <Text style={[styles.manualFoundText, { color: Colors.primary }]}>Uploaded by you</Text>
                      </View>
                    </View>
                  </View>
                )}
                <TouchableOpacity style={styles.manualRemoveBtn} onPress={handleRemoveManual} activeOpacity={0.7} testID="remove-manual">
                  <X size={14} color={Colors.danger} />
                  <Text style={styles.manualRemoveText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.manualActions}>
                <TouchableOpacity style={styles.manualActionBtn} onPress={handleUploadManualAction} activeOpacity={0.7} testID="upload-manual">
                  <View style={[styles.manualActionIcon, { backgroundColor: Colors.primaryLight }]}>
                    <Upload size={18} color={Colors.primary} />
                  </View>
                  <View style={styles.manualActionTextWrap}>
                    <Text style={styles.manualActionTitle}>Upload Manual</Text>
                    <Text style={styles.manualActionSub}>Add a photo or document</Text>
                  </View>
                  <ChevronRight size={16} color={Colors.textTertiary} />
                </TouchableOpacity>
                <View style={styles.manualDivider} />
                <TouchableOpacity style={styles.manualActionBtn} onPress={handleFindManualAction} activeOpacity={0.7} disabled={isSearchingManual} testID="find-manual">
                  <View style={[styles.manualActionIcon, { backgroundColor: '#DBEAFE' }]}>
                    {isSearchingManual ? <ActivityIndicator size="small" color="#5B8CB8" /> : <Search size={18} color="#5B8CB8" />}
                  </View>
                  <View style={styles.manualActionTextWrap}>
                    <Text style={[styles.manualActionTitle, { color: '#5B8CB8' }]}>{isSearchingManual ? 'Searching...' : 'Find Manual'}</Text>
                    <Text style={styles.manualActionSub}>Search using brand & model info</Text>
                  </View>
                  {!isSearchingManual && <ChevronRight size={16} color={Colors.textTertiary} />}
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.cardTitle}>Maintenance</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{relatedTasks.length}</Text>
              </View>
            </View>
            {relatedTasks.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No maintenance tasks yet</Text>
              </View>
            ) : (
              relatedTasks.map((task) => (
                <View key={task.id} style={[styles.taskRow, task.status === 'overdue' && styles.taskRowOverdue]}>
                  <View style={[styles.taskStatusDot, { backgroundColor: task.status === 'completed' ? Colors.success : task.status === 'overdue' ? Colors.danger : Colors.warning }]} />
                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskTitle, task.status === 'completed' && styles.taskTitleDone]}>{task.title}</Text>
                    <View style={styles.taskMetaRow}>
                      <Clock size={11} color={Colors.textTertiary} />
                      <Text style={styles.taskMeta}>
                        {task.status === 'completed' && task.completedDate
                          ? `Done ${formatMonthDay(task.completedDate)}`
                          : formatMonthDay(task.dueDate)}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: task.status === 'completed' ? Colors.successLight : task.status === 'overdue' ? Colors.dangerLight : Colors.warningLight }]}>
                    <Text style={[styles.statusChipText, { color: task.status === 'completed' ? Colors.success : task.status === 'overdue' ? Colors.danger : Colors.warning }]}>{task.status}</Text>
                  </View>
                </View>
              ))
            )}

            <View style={styles.maintenanceActions}>
              <TouchableOpacity style={styles.generateRecsBtn} onPress={handleGenerateRecommendations} activeOpacity={0.7} disabled={isGeneratingRecs} testID="generate-recommendations">
                <View style={styles.generateRecsBtnInner}>
                  {isGeneratingRecs ? <ActivityIndicator size="small" color={Colors.white} /> : <Sparkles size={16} color={Colors.white} />}
                  <Text style={styles.generateRecsBtnText}>{isGeneratingRecs ? 'Generating...' : 'Generate Recommendations'}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addCustomTaskBtn} onPress={() => router.push({ pathname: '/add-task' as any, params: { applianceId: appliance.id } })} activeOpacity={0.7} testID="add-custom-task">
                <Plus size={16} color={Colors.primary} />
                <Text style={styles.addCustomTaskBtnText}>Add Custom Task</Text>
              </TouchableOpacity>
            </View>

            {recommendations.length > 0 && (
              <View style={styles.recsCard}>
                <View style={styles.recsHeader}>
                  <View style={styles.recsHeaderLeft}>
                    <Sparkles size={16} color="#C9943A" />
                    <Text style={styles.recsTitle}>AI Recommendations</Text>
                  </View>
                  {recommendations.some((_, i) => !addedRecIds.has(i)) && (
                    <TouchableOpacity style={styles.addAllBtn} onPress={handleAddAllRecommendations} activeOpacity={0.7} testID="add-all-recommendations">
                      <Text style={styles.addAllBtnText}>Add All</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {recommendations.map((rec, index) => {
                  const isAdded = addedRecIds.has(index);
                  return (
                    <View key={index} style={styles.recItem}>
                      <View style={styles.recItemContent}>
                        <View style={styles.recTitleRow}>
                          <Text style={styles.recItemTitle} numberOfLines={1}>{rec.title}</Text>
                          <View style={[styles.recPriorityBadge, { backgroundColor: rec.priority === 'high' ? Colors.dangerLight : rec.priority === 'medium' ? Colors.warningLight : Colors.surfaceAlt }]}>
                            <Text style={[styles.recPriorityText, { color: rec.priority === 'high' ? Colors.danger : rec.priority === 'medium' ? Colors.warning : Colors.textTertiary }]}>{rec.priority}</Text>
                          </View>
                        </View>
                        <Text style={styles.recItemDesc} numberOfLines={2}>{rec.description}</Text>
                        <View style={styles.recMetaRow}>
                          <View style={styles.recMetaItem}>
                            <RotateCcw size={10} color={Colors.textTertiary} />
                            <Text style={styles.recMetaText}>
                              Every {rec.frequencyDays < 30 ? `${rec.frequencyDays}d` : rec.frequencyDays < 365 ? `${Math.round(rec.frequencyDays / 30)}mo` : `${Math.round(rec.frequencyDays / 365)}yr`}
                            </Text>
                          </View>
                          {rec.estimatedCost != null && (
                            <View style={styles.recMetaItem}>
                              <DollarSign size={10} color={Colors.textTertiary} />
                              <Text style={styles.recMetaText}>~${rec.estimatedCost}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity style={[styles.recAddBtn, isAdded && styles.recAddBtnDone]} onPress={() => !isAdded && handleAddRecommendationAsTask(rec, index)} activeOpacity={isAdded ? 1 : 0.7} testID={`add-rec-${index}`}>
                        {isAdded ? <Check size={14} color={Colors.success} /> : <Plus size={14} color={Colors.primary} />}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {relatedExpenses.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.cardTitle}>Expenses</Text>
                <Text style={styles.totalExpense}>${totalExpenses}</Text>
              </View>
              {relatedExpenses.map((expense) => (
                <View key={expense.id} style={styles.expenseRow}>
                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseDesc}>{expense.description}</Text>
                    <Text style={styles.expenseMeta}>
                      {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                  <Text style={styles.expenseAmount}>${expense.amount}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.editBtn} onPress={() => router.push({ pathname: '/edit-appliance' as any, params: { id: appliance.id } })} activeOpacity={0.7} testID="edit-appliance">
              <Pencil size={16} color={Colors.primary} />
              <Text style={styles.editBtnText}>Edit Item</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.7} testID="delete-appliance">
              <Trash2 size={16} color={Colors.danger} />
              <Text style={styles.deleteBtnText}>Remove Item</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  heroImage: { width: '100%', height: 220 },
  heroPlaceholder: { backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  heroPrimaryBadge: { position: 'absolute', bottom: 10, left: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  heroPrimaryText: { fontSize: 11, fontWeight: '600' as const, color: Colors.white },
  photoDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 8, position: 'absolute', bottom: 0, left: 0, right: 0 },
  photoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  photoDotActive: { backgroundColor: Colors.white, width: 8, height: 8, borderRadius: 4 },
  heroInitial: { fontSize: 56, fontWeight: '700' as const, color: Colors.primary, opacity: 0.35 },
  content: { paddingHorizontal: 20, marginTop: -20, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: Colors.background, paddingTop: 24 },
  titleSection: { marginBottom: 18 },
  title: { fontSize: 24, fontWeight: '700' as const, color: Colors.text, marginBottom: 4, letterSpacing: -0.3 },
  subtitle: { fontSize: 15, color: Colors.textSecondary },
  warrantyCard: { backgroundColor: Colors.surface, borderRadius: 18, padding: 18, marginBottom: 16, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  warrantyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  warrantyStatus: { fontSize: 16, fontWeight: '600' as const },
  warrantyExpiry: { fontSize: 14, color: Colors.text, fontWeight: '500' as const, marginBottom: 4 },
  warrantyDate: { fontSize: 13, color: Colors.textTertiary },
  detailsCard: { backgroundColor: Colors.surface, borderRadius: 18, padding: 6, marginBottom: 16, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  detailDivider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: 14 },
  detailIcon: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  detailTextWrap: { flex: 1 },
  detailLabel: { fontSize: 11, color: Colors.textTertiary, marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  notesCard: { backgroundColor: Colors.surface, borderRadius: 18, padding: 18, marginBottom: 16, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 17, fontWeight: '600' as const, color: Colors.text, marginBottom: 8 },
  notesText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 21 },
  section: { marginBottom: 18 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  countBadge: { backgroundColor: Colors.surfaceAlt, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  countText: { fontSize: 12, fontWeight: '600' as const, color: Colors.textSecondary },
  emptyCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 22, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.textTertiary },
  taskRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 8, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  taskRowOverdue: { borderLeftWidth: 3, borderLeftColor: Colors.danger },
  taskStatusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 14, fontWeight: '600' as const, color: Colors.text, marginBottom: 3 },
  taskTitleDone: { textDecorationLine: 'line-through', color: Colors.textTertiary },
  taskMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  taskMeta: { fontSize: 12, color: Colors.textTertiary },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginLeft: 8 },
  statusChipText: { fontSize: 10, fontWeight: '600' as const, textTransform: 'capitalize' },
  totalExpense: { fontSize: 15, fontWeight: '600' as const, color: Colors.accent },
  expenseRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 8, shadowColor: Colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  expenseInfo: { flex: 1 },
  expenseDesc: { fontSize: 14, fontWeight: '600' as const, color: Colors.text, marginBottom: 2 },
  expenseMeta: { fontSize: 12, color: Colors.textTertiary },
  expenseAmount: { fontSize: 15, fontWeight: '600' as const, color: Colors.text },
  purchaseCard: { backgroundColor: Colors.surface, borderRadius: 18, padding: 6, marginBottom: 16, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  purchaseHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 6 },
  purchaseItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  purchaseDivider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: 14 },
  receiptImageWrap: { padding: 14, alignItems: 'center', gap: 8 },
  receiptImage: { width: '100%', height: 160, borderRadius: 12 },
  receiptImageLabel: { fontSize: 12, color: Colors.textTertiary, fontWeight: '500' as const },
  actionRow: { gap: 10, marginTop: 8 },
  editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: Colors.primary + '30', backgroundColor: Colors.primaryLight },
  editBtnText: { fontSize: 14, fontWeight: '600' as const, color: Colors.primary },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: Colors.danger + '30', backgroundColor: Colors.dangerLight },
  deleteBtnText: { fontSize: 14, fontWeight: '600' as const, color: Colors.danger },
  notFound: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  notFoundText: { fontSize: 18, fontWeight: '600' as const, color: Colors.textSecondary, marginBottom: 16 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.primary },
  backBtnText: { fontSize: 14, fontWeight: '600' as const, color: Colors.white },
  manualCard: { backgroundColor: Colors.surface, borderRadius: 18, padding: 6, marginBottom: 16, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  manualHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 6 },
  manualContent: { padding: 8 },
  manualLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F0F7FF', borderRadius: 14, padding: 14 },
  manualLinkIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center' },
  manualLinkInfo: { flex: 1 },
  manualLinkTitle: { fontSize: 14, fontWeight: '600' as const, color: Colors.text, marginBottom: 2 },
  manualLinkUrl: { fontSize: 11, color: Colors.textTertiary, marginBottom: 4 },
  manualFoundBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  manualFoundText: { fontSize: 10, fontWeight: '500' as const, color: '#5B8CB8' },
  manualUploadedRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.primaryLight, borderRadius: 14, padding: 14 },
  manualUploadedIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: Colors.primary + '30', justifyContent: 'center', alignItems: 'center' },
  manualRemoveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, paddingVertical: 8 },
  manualRemoveText: { fontSize: 13, fontWeight: '500' as const, color: Colors.danger },
  manualActions: { padding: 4 },
  manualActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12 },
  manualActionIcon: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  manualActionTextWrap: { flex: 1 },
  manualActionTitle: { fontSize: 14, fontWeight: '600' as const, color: Colors.primary, marginBottom: 2 },
  manualActionSub: { fontSize: 12, color: Colors.textTertiary },
  manualDivider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: 12 },
  maintenanceActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  generateRecsBtn: { flex: 1, backgroundColor: '#C9943A', borderRadius: 14, overflow: 'hidden' },
  generateRecsBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, paddingHorizontal: 14 },
  generateRecsBtnText: { fontSize: 13, fontWeight: '600' as const, color: Colors.white },
  addCustomTaskBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: Colors.primary + '30', backgroundColor: Colors.primaryLight },
  addCustomTaskBtnText: { fontSize: 13, fontWeight: '600' as const, color: Colors.primary },
  recsCard: { backgroundColor: Colors.surface, borderRadius: 16, marginTop: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#C9943A' + '25' },
  recsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, backgroundColor: '#FBF4E4' },
  recsHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recsTitle: { fontSize: 14, fontWeight: '600' as const, color: '#8B6914' },
  addAllBtn: { backgroundColor: '#C9943A', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  addAllBtnText: { fontSize: 11, fontWeight: '600' as const, color: Colors.white },
  recItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  recItemContent: { flex: 1, marginRight: 10 },
  recTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  recItemTitle: { fontSize: 14, fontWeight: '600' as const, color: Colors.text, flex: 1 },
  recPriorityBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  recPriorityText: { fontSize: 9, fontWeight: '600' as const, textTransform: 'uppercase' as const },
  recItemDesc: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17, marginBottom: 6 },
  recMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recMetaText: { fontSize: 11, color: Colors.textTertiary, fontWeight: '500' as const },
  recAddBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.primary + '25' },
  recAddBtnDone: { backgroundColor: Colors.successLight, borderColor: Colors.success + '25' },
});
