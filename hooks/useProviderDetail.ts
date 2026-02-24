import { useMemo, useCallback, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { useHome } from '@/contexts/HomeContext';
import { ReviewRating, ProServiceCategory } from '@/types';
import { lightImpact, successNotification } from '@/utils/haptics';
import { getAverageRating } from '@/utils/ratings';

export function useProviderDetail(providerId: string | undefined) {
  const {
    trustedPros, updateTrustedPro, deleteTrustedPro, budgetItems, appliances,
    addProPrivateNote, removeProPrivateNote, updateProPrivateNote,
    linkApplianceToPro, unlinkApplianceFromPro, updateProRatings, updateProServiceInfo,
  } = useHome();

  const pro = useMemo(() => trustedPros.find((p) => p.id === providerId), [trustedPros, providerId]);

  const relatedExpenses = useMemo(() => {
    if (!pro) return [];
    return budgetItems.filter((item) => pro.expenseIds.includes(item.id));
  }, [pro, budgetItems]);

  const totalSpentWithPro = useMemo(
    () => relatedExpenses.reduce((sum, e) => sum + e.amount, 0),
    [relatedExpenses]
  );

  const linkedAppliances = useMemo(() => {
    if (!pro?.linkedApplianceIds?.length) return [];
    return appliances.filter((a) => pro.linkedApplianceIds!.includes(a.id));
  }, [pro, appliances]);

  const unlinkableAppliances = useMemo(() => {
    const linkedIds = pro?.linkedApplianceIds ?? [];
    return appliances.filter((a) => !linkedIds.includes(a.id));
  }, [pro, appliances]);

  const averageRating = useMemo(() => getAverageRating(pro?.ratings), [pro?.ratings]);

  const handleSave = useCallback((fields: {
    name: string;
    specialty: string;
    phone: string;
    email: string;
    website: string;
    address: string;
    notes: string;
    licenseNumber: string;
    insuranceVerified: boolean;
  }) => {
    if (!pro) return false;
    if (!fields.name.trim()) {
      Alert.alert('Required', 'Provider name is required');
      return false;
    }
    successNotification();
    updateTrustedPro({
      ...pro,
      name: fields.name.trim(),
      specialty: fields.specialty.trim(),
      phone: fields.phone.trim() || undefined,
      email: fields.email.trim() || undefined,
      website: fields.website.trim() || undefined,
      address: fields.address.trim() || undefined,
      notes: fields.notes.trim() || undefined,
      licenseNumber: fields.licenseNumber.trim() || undefined,
      insuranceVerified: fields.insuranceVerified,
    });
    console.log('[useProviderDetail] Updated pro:', pro.id);
    return true;
  }, [pro, updateTrustedPro]);

  const handleDelete = useCallback((onSuccess?: () => void) => {
    if (!pro) return;
    Alert.alert(
      'Remove Provider',
      `Remove ${pro.name} from your Trusted Pros?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            lightImpact();
            deleteTrustedPro(pro.id);
            onSuccess?.();
          },
        },
      ]
    );
  }, [pro, deleteTrustedPro]);

  const callPhone = useCallback((phone: string) => {
    const cleaned = phone.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${cleaned}`).catch(() => {
      console.log('[useProviderDetail] Could not open phone');
    });
  }, []);

  const sendEmail = useCallback((email: string) => {
    Linking.openURL(`mailto:${email}`).catch(() => {
      console.log('[useProviderDetail] Could not open email');
    });
  }, []);

  const openWebsite = useCallback((website: string) => {
    const url = website.startsWith('http') ? website : `https://${website}`;
    Linking.openURL(url).catch(() => {
      console.log('[useProviderDetail] Could not open website');
    });
  }, []);

  const handleAddNote = useCallback((text: string) => {
    if (!pro || !text.trim()) return;
    lightImpact();
    addProPrivateNote(pro.id, text.trim());
    console.log('[useProviderDetail] Added private note');
  }, [pro, addProPrivateNote]);

  const handleDeleteNote = useCallback((noteId: string) => {
    if (!pro) return;
    Alert.alert('Delete Note', 'Remove this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => {
          lightImpact();
          removeProPrivateNote(pro.id, noteId);
        },
      },
    ]);
  }, [pro, removeProPrivateNote]);

  const handleSaveEditNote = useCallback((noteId: string, text: string) => {
    if (!pro || !text.trim()) return;
    updateProPrivateNote(pro.id, noteId, text.trim());
    successNotification();
  }, [pro, updateProPrivateNote]);

  const handleLinkAppliance = useCallback((applianceId: string) => {
    if (!pro) return;
    lightImpact();
    linkApplianceToPro(pro.id, applianceId);
  }, [pro, linkApplianceToPro]);

  const handleUnlinkAppliance = useCallback((applianceId: string) => {
    if (!pro) return;
    lightImpact();
    unlinkApplianceFromPro(pro.id, applianceId);
  }, [pro, unlinkApplianceFromPro]);

  const handleAddRating = useCallback((rating: {
    source: ReviewRating['source'];
    value: string;
    reviewCount: string;
    url: string;
  }) => {
    if (!pro) return false;
    const val = parseFloat(rating.value);
    if (isNaN(val) || val < 0 || val > 5) {
      Alert.alert('Invalid', 'Rating must be between 0 and 5');
      return false;
    }
    const existing = pro.ratings ?? [];
    const filtered = existing.filter((r) => r.source !== rating.source);
    const newRating: ReviewRating = {
      source: rating.source,
      rating: Math.round(val * 10) / 10,
      reviewCount: rating.reviewCount ? parseInt(rating.reviewCount, 10) : undefined,
      url: rating.url.trim() || undefined,
    };
    updateProRatings(pro.id, [...filtered, newRating]);
    successNotification();
    console.log('[useProviderDetail] Added/updated rating:', rating.source, val);
    return true;
  }, [pro, updateProRatings]);

  const handleRemoveRating = useCallback((source: ReviewRating['source']) => {
    if (!pro) return;
    const updated = (pro.ratings ?? []).filter((r) => r.source !== source);
    updateProRatings(pro.id, updated);
    lightImpact();
  }, [pro, updateProRatings]);

  const handleSaveServiceInfo = useCallback((cats: ProServiceCategory[], radius: number) => {
    if (!pro) return;
    updateProServiceInfo(pro.id, cats, radius);
    successNotification();
  }, [pro, updateProServiceInfo]);

  return {
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
  };
}
