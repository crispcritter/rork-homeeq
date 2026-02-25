import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  Receipt,
  Camera,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  Globe,
  CreditCard,
  Hash,
  StickyNote,
  Trash2,
  Calendar,
  Tag,
  ExternalLink,
} from 'lucide-react-native';
import { useHome } from '@/contexts/HomeContext';
import { useTheme } from '@/contexts/ThemeContext';
import { categoryLabels, BUDGET_CATEGORY_COLORS } from '@/constants/categories';
import { lightImpact } from '@/utils/haptics';

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors: c } = useTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const { budgetItems, deleteBudgetItem, getApplianceById, trustedPros } = useHome();

  const expense = useMemo(() => budgetItems.find((i) => i.id === id), [budgetItems, id]);
  const appliance = useMemo(
    () => (expense?.applianceId ? getApplianceById(expense.applianceId) : undefined),
    [expense, getApplianceById]
  );
  const linkedPro = useMemo(() => {
    if (!expense?.provider) return undefined;
    return trustedPros.find((p) => p.name === expense.provider?.name);
  }, [expense, trustedPros]);

  const handleDelete = () => {
    if (!expense) return;
    Alert.alert(
      'Delete Expense',
      `Delete "${expense.description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            lightImpact();
            deleteBudgetItem(expense.id);
            router.back();
          },
        },
      ]
    );
  };

  if (!expense) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Expense' }} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Expense not found</Text>
        </View>
      </View>
    );
  }

  const catColor = BUDGET_CATEGORY_COLORS[expense.category] || c.textTertiary;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Expense Details' }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={[styles.categoryBadge, { backgroundColor: catColor }]}>
            <Text style={styles.categoryBadgeText}>
              {categoryLabels[expense.category] || expense.category}
            </Text>
          </View>
          <Text style={styles.heroAmount}>-${expense.amount.toLocaleString()}</Text>
          <Text style={styles.heroDesc}>{expense.description}</Text>
          <Text style={styles.heroDate}>
            {new Date(expense.date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.card}>
            <View style={styles.detailRow}>
              <Calendar size={16} color={c.textTertiary} />
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Tag size={16} color={c.textTertiary} />
              <Text style={styles.detailLabel}>Category</Text>
              <View style={[styles.detailCatDot, { backgroundColor: catColor }]} />
              <Text style={styles.detailValue}>
                {categoryLabels[expense.category] || expense.category}
              </Text>
            </View>
            {expense.paymentMethod && (
              <>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <CreditCard size={16} color={c.textTertiary} />
                  <Text style={styles.detailLabel}>Payment</Text>
                  <Text style={styles.detailValue}>{expense.paymentMethod}</Text>
                </View>
              </>
            )}
            {expense.invoiceNumber && (
              <>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <Hash size={16} color={c.textTertiary} />
                  <Text style={styles.detailLabel}>Invoice #</Text>
                  <Text style={styles.detailValue}>{expense.invoiceNumber}</Text>
                </View>
              </>
            )}
            {appliance && (
              <>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <Receipt size={16} color={c.textTertiary} />
                  <Text style={styles.detailLabel}>Related item</Text>
                  <Text style={styles.detailValue}>{appliance.name}</Text>
                </View>
              </>
            )}
            {expense.notes && (
              <>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <StickyNote size={16} color={c.textTertiary} />
                  <Text style={styles.detailLabel}>Notes</Text>
                  <Text style={[styles.detailValue, { flex: 1 }]}>{expense.notes}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {expense.receiptImages && expense.receiptImages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Receipts ({expense.receiptImages.length})
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.receiptsRow}
            >
              {expense.receiptImages.map((uri, idx) => (
                <View key={`receipt-${idx}`} style={styles.receiptCard}>
                  <Image source={{ uri }} style={styles.receiptImage} />
                  <View style={styles.receiptOverlay}>
                    <Camera size={14} color={c.white} />
                    <Text style={styles.receiptLabel}>Receipt {idx + 1}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {expense.provider && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Provider</Text>
            <TouchableOpacity
              style={styles.providerCard}
              onPress={() => {
                if (linkedPro) {
                  lightImpact();
                  router.push(`/provider/${linkedPro.id}` as any);
                }
              }}
              activeOpacity={linkedPro ? 0.7 : 1}
            >
              <View style={styles.providerTop}>
                <View style={styles.providerAvatar}>
                  <Text style={styles.providerAvatarText}>
                    {expense.provider.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.providerMainInfo}>
                  <Text style={styles.providerName}>{expense.provider.name}</Text>
                  {expense.provider.specialty && (
                    <Text style={styles.providerSpecialty}>{expense.provider.specialty}</Text>
                  )}
                </View>
                {linkedPro && (
                  <View style={styles.trustedBadge}>
                    <UserCheck size={12} color="#4A7FBF" />
                    <Text style={styles.trustedBadgeText}>Trusted</Text>
                  </View>
                )}
              </View>

              <View style={styles.providerDetails}>
                {expense.provider.phone && (
                  <TouchableOpacity
                    style={styles.providerDetailRow}
                    onPress={() => {
                      const cleaned = (expense.provider?.phone ?? '').replace(/[^\d+]/g, '');
                      Linking.openURL(`tel:${cleaned}`).catch(() => {});
                    }}
                    activeOpacity={0.7}
                  >
                    <Phone size={13} color="#4A7FBF" />
                    <Text style={styles.providerDetailText}>{expense.provider.phone}</Text>
                    <ExternalLink size={12} color={c.textTertiary} />
                  </TouchableOpacity>
                )}
                {expense.provider.email && (
                  <TouchableOpacity
                    style={styles.providerDetailRow}
                    onPress={() => {
                      Linking.openURL(`mailto:${expense.provider?.email}`).catch(() => {});
                    }}
                    activeOpacity={0.7}
                  >
                    <Mail size={13} color="#4A7FBF" />
                    <Text style={styles.providerDetailText}>{expense.provider.email}</Text>
                    <ExternalLink size={12} color={c.textTertiary} />
                  </TouchableOpacity>
                )}
                {expense.provider.website && (
                  <TouchableOpacity
                    style={styles.providerDetailRow}
                    onPress={() => {
                      const url = (expense.provider?.website ?? '').startsWith('http')
                        ? expense.provider?.website
                        : `https://${expense.provider?.website}`;
                      Linking.openURL(url ?? '').catch(() => {});
                    }}
                    activeOpacity={0.7}
                  >
                    <Globe size={13} color="#4A7FBF" />
                    <Text style={styles.providerDetailText}>{expense.provider.website}</Text>
                    <ExternalLink size={12} color={c.textTertiary} />
                  </TouchableOpacity>
                )}
                {expense.provider.address && (
                  <View style={styles.providerDetailRow}>
                    <MapPin size={13} color={c.textTertiary} />
                    <Text style={styles.providerDetailText}>{expense.provider.address}</Text>
                  </View>
                )}
                {expense.provider.notes && (
                  <View style={styles.providerDetailRow}>
                    <StickyNote size={13} color={c.textTertiary} />
                    <Text style={styles.providerDetailText}>{expense.provider.notes}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.7}>
          <Trash2 size={18} color={c.danger} />
          <Text style={styles.deleteBtnText}>Delete Expense</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const createStyles = (c: { background: string; surface: string; surfaceAlt: string; text: string; textSecondary: string; textTertiary: string; cardShadow: string; borderLight: string; danger: string; dangerLight: string; white: string; primary: string; primaryLight: string }) => {
  const Colors = c;
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 16,
    color: Colors.textTertiary,
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.white,
    lineHeight: 16,
  },
  heroAmount: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: Colors.danger,
    letterSpacing: -1,
    marginBottom: 6,
  },
  heroDesc: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 24,
  },
  heroDate: {
    fontSize: 13,
    color: Colors.textTertiary,
    lineHeight: 17,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    width: 80,
    lineHeight: 17,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 20,
  },
  detailCatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 42,
  },
  receiptsRow: {
    gap: 12,
  },
  receiptCard: {
    width: 160,
    height: 200,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceAlt,
  },
  receiptImage: {
    width: '100%',
    height: '100%',
  },
  receiptOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  receiptLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  providerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 1,
  },
  providerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  providerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4A7FBF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  providerAvatarText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  providerMainInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
    lineHeight: 21,
  },
  providerSpecialty: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  trustedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#E8F0FE',
    borderRadius: 10,
  },
  trustedBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#4A7FBF',
  },
  providerDetails: {
    gap: 8,
    paddingLeft: 56,
  },
  providerDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  providerDetailText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.dangerLight,
    borderRadius: 14,
    paddingVertical: 14,
  },
  deleteBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.danger,
  },
});
};
