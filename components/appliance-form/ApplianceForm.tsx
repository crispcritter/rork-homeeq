import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Camera, X, Sparkles, ChevronRight, ScanLine, Hash, Receipt, Plus, Star, ImagePlus, BookOpen, Upload, Search, ExternalLink } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Appliance, ApplianceCategory, PurchaseData, AppliancePhoto, ManualInfo } from '@/types';
import { successNotification } from '@/utils/haptics';
import { CATEGORIES } from '@/components/appliance-form/constants';
import { formStyles as styles } from '@/components/appliance-form/styles';
import { useApplianceAnalysis } from '@/components/appliance-form/useApplianceAnalysis';
import { useManualSearch } from '@/hooks/useManualSearch';

interface ApplianceFormProps {
  mode: 'add' | 'edit';
  initialData?: Appliance;
  onSave: (appliance: Appliance) => void;
}

export default function ApplianceForm({ mode, initialData, onSave }: ApplianceFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialData?.name ?? '');
  const [brand, setBrand] = useState(initialData?.brand ?? '');
  const [model, setModel] = useState(initialData?.model ?? '');
  const [serialNumber, setSerialNumber] = useState(initialData?.serialNumber ?? '');
  const [category, setCategory] = useState<ApplianceCategory>(initialData?.category ?? 'other');
  const [location, setLocation] = useState(initialData?.location ?? '');
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [purchaseDate, setPurchaseDate] = useState(initialData?.purchaseDate ?? '');
  const [warrantyExpiry, setWarrantyExpiry] = useState(initialData?.warrantyExpiry ?? '');
  const [imageUri, setImageUri] = useState<string | null>(initialData?.imageUrl ?? null);
  const [photos, setPhotos] = useState<AppliancePhoto[]>(initialData?.photos ?? []);
  const [purchasePrice, setPurchasePrice] = useState(initialData?.purchaseData?.price?.toString() ?? '');
  const [retailer, setRetailer] = useState(initialData?.purchaseData?.retailer ?? '');
  const [paymentMethod, setPaymentMethod] = useState(initialData?.purchaseData?.paymentMethod ?? '');
  const [orderNumber, setOrderNumber] = useState(initialData?.purchaseData?.orderNumber ?? '');
  const [receiptImageUri, setReceiptImageUri] = useState<string | null>(initialData?.purchaseData?.receiptImageUrl ?? null);
  const [manual, setManual] = useState<ManualInfo | undefined>(initialData?.manual);

  const nameRef = useRef(name);
  nameRef.current = name;
  const photosRef = useRef(photos);
  photosRef.current = photos;
  const imageUriRef = useRef(imageUri);
  imageUriRef.current = imageUri;

  const settersRef = useRef({
    setName, setBrand, setModel, setSerialNumber, setCategory,
    setNotes: setNotes as (v: string | ((prev: string) => string)) => void,
    setPurchaseDate, setPurchasePrice, setRetailer, setPaymentMethod,
    setOrderNumber, setReceiptImageUri, setImageUri,
    setPhotos: setPhotos as (v: AppliancePhoto[] | ((prev: AppliancePhoto[]) => AppliancePhoto[])) => void,
    getName: () => nameRef.current,
    getPhotos: () => photosRef.current,
    getImageUri: () => imageUriRef.current,
  });

  const {
    isAnalyzing, isAnalyzingReceipt, scanMode, scanPulse,
    handleScanPress, handleScanLabelPress, handleScanReceiptPress,
    clearImage, showAddPhotoOptions, setPrimaryPhoto,
    setMainImageAsPrimary, removePhoto,
  } = useApplianceAnalysis(settersRef.current);

  const { isSearchingManual, handleUploadManual, handleFindManual } = useManualSearch({
    brand, model, serialNumber, name,
  });

  const testIdPrefix = mode === 'edit' ? 'edit-' : '';

  const handleSave = useCallback(() => {
    if (!name.trim()) { Alert.alert('Just a moment', 'Please enter a name for this item'); return; }
    if (!brand.trim()) { Alert.alert('Just a moment', 'Please enter the brand'); return; }
    successNotification();

    const purchaseData: PurchaseData = {};
    if (purchasePrice.trim()) purchaseData.price = parseFloat(purchasePrice.trim());
    if (retailer.trim()) purchaseData.retailer = retailer.trim();
    if (purchaseDate.trim()) purchaseData.purchaseDate = purchaseDate.trim();
    if (receiptImageUri) purchaseData.receiptImageUrl = receiptImageUri;
    if (paymentMethod.trim()) purchaseData.paymentMethod = paymentMethod.trim();
    if (orderNumber.trim()) purchaseData.orderNumber = orderNumber.trim();

    const allPhotos: AppliancePhoto[] = [];
    if (imageUri) {
      const hasPrimaryInPhotos = photos.some((p) => p.isPrimary);
      allPhotos.push({ id: 'scan_' + Date.now().toString(), uri: imageUri, isPrimary: !hasPrimaryInPhotos });
    }
    allPhotos.push(...photos);
    const primaryPhoto = allPhotos.find((p) => p.isPrimary) ?? allPhotos[0];
    const primaryImageUrl = primaryPhoto?.uri || imageUri || undefined;

    console.log(`[ApplianceForm] Saving (${mode}):`, name.trim());
    onSave({
      id: initialData?.id ?? Date.now().toString(),
      name: name.trim(),
      brand: brand.trim(),
      model: model.trim(),
      serialNumber: serialNumber.trim(),
      category,
      purchaseDate: purchaseDate.trim() || new Date().toISOString().split('T')[0],
      warrantyExpiry: warrantyExpiry.trim() || '',
      notes: notes.trim(),
      location: location.trim(),
      imageUrl: primaryImageUrl,
      photos: allPhotos.length > 0 ? allPhotos : undefined,
      purchaseData: Object.keys(purchaseData).length > 0 ? purchaseData : undefined,
      manual,
    });
    router.back();
  }, [name, brand, model, serialNumber, category, purchaseDate, warrantyExpiry, notes, location, imageUri, photos, purchasePrice, retailer, paymentMethod, orderNumber, receiptImageUri, manual, initialData, mode, onSave, router]);

  const handleManualUpload = useCallback(async () => {
    const result = await handleUploadManual();
    if (result) setManual(result);
  }, [handleUploadManual]);

  const handleManualFind = useCallback(async () => {
    const result = await handleFindManual();
    if (result) setManual(result);
  }, [handleFindManual]);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {!imageUri ? (
          <View style={styles.scanOptions}>
            <TouchableOpacity
              style={[styles.scanCard, isAnalyzing && scanMode === 'appliance' && styles.scanCardActive]}
              activeOpacity={0.7} onPress={handleScanPress} disabled={isAnalyzing} testID={`${testIdPrefix}scan-appliance`}
            >
              <View style={styles.scanIconWrap}>
                {isAnalyzing && scanMode === 'appliance' ? <ActivityIndicator size="small" color={Colors.primary} /> : <Camera size={22} color={Colors.primary} />}
              </View>
              <View style={styles.scanTextWrap}>
                <View style={styles.scanTitleRow}>
                  <Text style={styles.scanTitle}>{isAnalyzing && scanMode === 'appliance' ? 'Identifying...' : 'Scan appliance'}</Text>
                  <Sparkles size={13} color={Colors.accent} />
                </View>
                <Text style={styles.scanSubtitle}>Photo the appliance to auto-fill</Text>
              </View>
              {!isAnalyzing && <ChevronRight size={16} color={Colors.textTertiary} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.scanCard, styles.scanCardLabel, isAnalyzing && scanMode === 'label' && styles.scanCardActive]}
              activeOpacity={0.7} onPress={handleScanLabelPress} disabled={isAnalyzing} testID={`${testIdPrefix}scan-label`}
            >
              <View style={[styles.scanIconWrap, styles.scanIconWrapLabel]}>
                {isAnalyzing && scanMode === 'label' ? <ActivityIndicator size="small" color={Colors.accent} /> : <ScanLine size={22} color={Colors.accent} />}
              </View>
              <View style={styles.scanTextWrap}>
                <View style={styles.scanTitleRow}>
                  <Text style={[styles.scanTitle, styles.scanTitleLabel]}>{isAnalyzing && scanMode === 'label' ? 'Reading label...' : 'Scan serial / model'}</Text>
                  <Hash size={13} color={Colors.textTertiary} />
                </View>
                <Text style={[styles.scanSubtitle, styles.scanSubtitleLabel]}>Photo the label to read numbers</Text>
              </View>
              {!isAnalyzing && <ChevronRight size={16} color={Colors.textTertiary} />}
            </TouchableOpacity>
          </View>
        ) : (
          <Animated.View style={[styles.imagePreviewCard, { transform: [{ scale: scanPulse }] }]}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            <View style={styles.imageOverlay}>
              {isAnalyzing ? (
                <View style={styles.analyzingBadge}>
                  <ActivityIndicator size="small" color={Colors.white} />
                  <Text style={styles.analyzingText}>{scanMode === 'label' ? 'Reading label...' : 'Analyzing...'}</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.removeImageBtn} onPress={clearImage}><X size={16} color={Colors.white} /></TouchableOpacity>
              )}
            </View>
            {!isAnalyzing && (
              <View style={styles.rescanRow}>
                <TouchableOpacity style={styles.rescanBtn} onPress={handleScanPress}>
                  <Camera size={14} color={Colors.primary} /><Text style={styles.rescanText}>Rescan</Text>
                </TouchableOpacity>
                <View style={styles.rescanDivider} />
                <TouchableOpacity style={styles.rescanBtn} onPress={handleScanLabelPress}>
                  <ScanLine size={14} color={Colors.accent} /><Text style={[styles.rescanText, { color: Colors.accent }]}>Scan Label</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        )}

        {(imageUri || photos.length > 0) && (
          <View style={styles.section}>
            <View style={styles.photosSectionHeader}>
              <Text style={styles.sectionLabel}>Photos</Text>
              <TouchableOpacity style={styles.addPhotoSmallBtn} onPress={showAddPhotoOptions} activeOpacity={0.7}>
                <Plus size={14} color={Colors.primary} /><Text style={styles.addPhotoSmallText}>Add</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosRow}>
              {imageUri && (
                <View style={styles.photoThumbWrap}>
                  <TouchableOpacity activeOpacity={0.8} onPress={setMainImageAsPrimary} style={[styles.photoThumb, !photos.some((p) => p.isPrimary) && styles.photoThumbPrimary]}>
                    <Image source={{ uri: imageUri }} style={styles.photoThumbImage} />
                    {!photos.some((p) => p.isPrimary) && <View style={styles.primaryBadge}><Star size={8} color={Colors.white} fill={Colors.white} /></View>}
                  </TouchableOpacity>
                  <Text style={styles.photoThumbLabel}>{!photos.some((p) => p.isPrimary) ? 'Primary' : 'Scanned'}</Text>
                </View>
              )}
              {photos.map((photo) => (
                <View key={photo.id} style={styles.photoThumbWrap}>
                  <TouchableOpacity
                    activeOpacity={0.8} onPress={() => setPrimaryPhoto(photo.id)}
                    onLongPress={() => { Alert.alert('Remove Photo', 'Remove this photo?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: () => removePhoto(photo.id) }]); }}
                    style={[styles.photoThumb, photo.isPrimary && styles.photoThumbPrimary]}
                  >
                    <Image source={{ uri: photo.uri }} style={styles.photoThumbImage} />
                    {photo.isPrimary && <View style={styles.primaryBadge}><Star size={8} color={Colors.white} fill={Colors.white} /></View>}
                    <TouchableOpacity style={styles.photoRemoveBtn} onPress={() => removePhoto(photo.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><X size={10} color={Colors.white} /></TouchableOpacity>
                  </TouchableOpacity>
                  <Text style={styles.photoThumbLabel}>{photo.isPrimary ? 'Primary' : 'Tap = primary'}</Text>
                </View>
              ))}
              <TouchableOpacity style={styles.addPhotoThumb} onPress={showAddPhotoOptions} activeOpacity={0.7}><ImagePlus size={20} color={Colors.textTertiary} /></TouchableOpacity>
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Details</Text>
          <View style={styles.card}>
            <View style={styles.inputRow}><View style={styles.inputContent}><Text style={styles.inputLabel}>Name</Text><TextInput style={styles.textInput} placeholder="e.g. Central AC Unit, Dishwasher" placeholderTextColor={Colors.textTertiary} value={name} onChangeText={setName} testID={`${testIdPrefix}input-name`} /></View></View>
            <View style={styles.divider} />
            <View style={styles.inputRow}><View style={styles.inputContent}><Text style={styles.inputLabel}>Brand</Text><TextInput style={styles.textInput} placeholder="e.g. Carrier, Samsung" placeholderTextColor={Colors.textTertiary} value={brand} onChangeText={setBrand} testID={`${testIdPrefix}input-brand`} /></View></View>
            <View style={styles.divider} />
            <View style={styles.inputRow}><View style={styles.inputContent}><Text style={styles.inputLabel}>Model</Text><TextInput style={styles.textInput} placeholder="Model number" placeholderTextColor={Colors.textTertiary} value={model} onChangeText={setModel} testID={`${testIdPrefix}input-model`} /></View></View>
            <View style={styles.divider} />
            <View style={styles.inputRow}><View style={styles.inputContent}><Text style={styles.inputLabel}>Serial number</Text><TextInput style={styles.textInput} placeholder="Found on the label or manual" placeholderTextColor={Colors.textTertiary} value={serialNumber} onChangeText={setSerialNumber} testID={`${testIdPrefix}input-serial`} /></View></View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Type</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity key={cat.key} style={[styles.categoryChip, category === cat.key && styles.categoryChipActive]} onPress={() => setCategory(cat.key)} activeOpacity={0.7}>
                <Text style={[styles.categoryChipText, category === cat.key && styles.categoryChipTextActive]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Location & Dates</Text>
          <View style={styles.card}>
            <View style={styles.inputRow}><View style={styles.inputContent}><Text style={styles.inputLabel}>Where is it?</Text><TextInput style={styles.textInput} placeholder="e.g. Basement, Kitchen, Garage" placeholderTextColor={Colors.textTertiary} value={location} onChangeText={setLocation} testID={`${testIdPrefix}input-location`} /></View></View>
            <View style={styles.divider} />
            <View style={styles.inputRow}><View style={styles.inputContent}><Text style={styles.inputLabel}>Purchase date</Text><TextInput style={styles.textInput} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textTertiary} value={purchaseDate} onChangeText={setPurchaseDate} testID={`${testIdPrefix}input-purchase-date`} /></View></View>
            <View style={styles.divider} />
            <View style={styles.inputRow}><View style={styles.inputContent}><Text style={styles.inputLabel}>Warranty expires</Text><TextInput style={styles.textInput} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textTertiary} value={warrantyExpiry} onChangeText={setWarrantyExpiry} testID={`${testIdPrefix}input-warranty`} /></View></View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Purchase Information</Text>
          <TouchableOpacity
            style={[styles.receiptScanCard, isAnalyzingReceipt && styles.receiptScanCardActive]}
            activeOpacity={0.7} onPress={handleScanReceiptPress} disabled={isAnalyzingReceipt} testID={`${testIdPrefix}scan-receipt`}
          >
            <View style={styles.receiptScanIconWrap}>
              {isAnalyzingReceipt ? <ActivityIndicator size="small" color={Colors.warning} /> : <Receipt size={20} color={Colors.warning} />}
            </View>
            <View style={styles.scanTextWrap}>
              <View style={styles.scanTitleRow}>
                <Text style={styles.receiptScanTitle}>{isAnalyzingReceipt ? 'Reading receipt...' : 'Scan receipt'}</Text>
                <Sparkles size={13} color={Colors.warning} />
              </View>
              <Text style={styles.receiptScanSubtitle}>Photo the receipt to auto-fill purchase info</Text>
            </View>
            {!isAnalyzingReceipt && <ChevronRight size={16} color={Colors.textTertiary} />}
          </TouchableOpacity>

          {receiptImageUri && !isAnalyzingReceipt && (
            <View style={styles.receiptPreviewRow}>
              <Image source={{ uri: receiptImageUri }} style={styles.receiptThumbnail} />
              <View style={styles.receiptPreviewInfo}>
                <Text style={styles.receiptPreviewLabel}>Receipt captured</Text>
                <TouchableOpacity onPress={() => setReceiptImageUri(null)}><Text style={styles.receiptRemoveText}>Remove</Text></TouchableOpacity>
              </View>
            </View>
          )}

          <View style={[styles.card, { marginTop: 10 }]}>
            <View style={styles.inputRow}><View style={styles.inputContent}><Text style={styles.inputLabel}>Purchase price</Text><TextInput style={styles.textInput} placeholder="e.g. 599.99" placeholderTextColor={Colors.textTertiary} value={purchasePrice} onChangeText={setPurchasePrice} keyboardType="decimal-pad" testID={`${testIdPrefix}input-purchase-price`} /></View></View>
            <View style={styles.divider} />
            <View style={styles.inputRow}><View style={styles.inputContent}><Text style={styles.inputLabel}>Retailer / Store</Text><TextInput style={styles.textInput} placeholder="e.g. Home Depot, Best Buy" placeholderTextColor={Colors.textTertiary} value={retailer} onChangeText={setRetailer} testID={`${testIdPrefix}input-retailer`} /></View></View>
            <View style={styles.divider} />
            <View style={styles.inputRow}><View style={styles.inputContent}><Text style={styles.inputLabel}>Payment method</Text><TextInput style={styles.textInput} placeholder="e.g. Visa ending 4321" placeholderTextColor={Colors.textTertiary} value={paymentMethod} onChangeText={setPaymentMethod} testID={`${testIdPrefix}input-payment-method`} /></View></View>
            <View style={styles.divider} />
            <View style={styles.inputRow}><View style={styles.inputContent}><Text style={styles.inputLabel}>Order / Receipt number</Text><TextInput style={styles.textInput} placeholder="Transaction or order ID" placeholderTextColor={Colors.textTertiary} value={orderNumber} onChangeText={setOrderNumber} testID={`${testIdPrefix}input-order-number`} /></View></View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>User Manual</Text>
          {manual ? (
            <View style={styles.card}>
              <View style={styles.inputRow}>
                <View style={styles.inputContent}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    {manual.type === 'link' ? <ExternalLink size={14} color="#5B8CB8" /> : <BookOpen size={14} color={Colors.primary} />}
                    <Text style={styles.inputLabel}>{manual.type === 'link' ? 'Manual Link' : 'Uploaded Manual'}</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: Colors.textSecondary }} numberOfLines={2}>{manual.uri}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.inputRow} onPress={() => setManual(undefined)} activeOpacity={0.7}>
                <View style={styles.inputContent}>
                  <Text style={{ fontSize: 14, color: Colors.danger, fontWeight: '500' as const }}>Remove Manual</Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.inputRow}
                onPress={handleManualUpload}
                activeOpacity={0.7}
                testID={`${testIdPrefix}upload-manual`}
              >
                <View style={[{ width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primaryLight }]}>
                  <Upload size={16} color={Colors.primary} />
                </View>
                <View style={[styles.inputContent, { marginLeft: 12 }]}>
                  <Text style={{ fontSize: 14, fontWeight: '600' as const, color: Colors.primary }}>Upload Manual</Text>
                  <Text style={{ fontSize: 12, color: Colors.textTertiary }}>Add a photo or document</Text>
                </View>
                <ChevronRight size={16} color={Colors.textTertiary} />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.inputRow}
                onPress={handleManualFind}
                activeOpacity={0.7}
                disabled={isSearchingManual}
                testID={`${testIdPrefix}find-manual`}
              >
                <View style={[{ width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: '#DBEAFE' }]}>
                  {isSearchingManual ? <ActivityIndicator size="small" color="#5B8CB8" /> : <Search size={16} color="#5B8CB8" />}
                </View>
                <View style={[styles.inputContent, { marginLeft: 12 }]}>
                  <Text style={{ fontSize: 14, fontWeight: '600' as const, color: '#5B8CB8' }}>{isSearchingManual ? 'Searching...' : 'Find Manual'}</Text>
                  <Text style={{ fontSize: 12, color: Colors.textTertiary }}>Search using brand & model info</Text>
                </View>
                {!isSearchingManual && <ChevronRight size={16} color={Colors.textTertiary} />}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notes</Text>
          <View style={styles.card}>
            <View style={styles.notesRow}>
              <TextInput style={styles.notesInput} placeholder="Anything helpful to remember..." placeholderTextColor={Colors.textTertiary} value={notes} onChangeText={setNotes} multiline numberOfLines={3} textAlignVertical="top" testID={`${testIdPrefix}input-notes`} />
            </View>
          </View>
        </View>

        <TouchableOpacity style={[styles.saveBtn, isAnalyzing && styles.saveBtnDisabled]} onPress={handleSave} activeOpacity={0.85} disabled={isAnalyzing} testID={mode === 'edit' ? 'save-edit-appliance' : 'save-appliance'}>
          <Text style={styles.saveBtnText}>{mode === 'edit' ? 'Save Changes' : 'Save Item'}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
