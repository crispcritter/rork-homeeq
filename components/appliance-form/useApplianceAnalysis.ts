import { useState, useCallback } from 'react';
import { Alert, Platform, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { ApplianceCategory, AppliancePhoto } from '@/types';
import { applianceSchema, labelReadSchema, lookupSchema, receiptSchema } from './schemas';

interface FormSetters {
  setName: (v: string) => void;
  setBrand: (v: string) => void;
  setModel: (v: string) => void;
  setSerialNumber: (v: string) => void;
  setCategory: (v: ApplianceCategory) => void;
  setNotes: (v: string | ((prev: string) => string)) => void;
  setPurchaseDate: (v: string) => void;
  setPurchasePrice: (v: string) => void;
  setRetailer: (v: string) => void;
  setPaymentMethod: (v: string) => void;
  setOrderNumber: (v: string) => void;
  setReceiptImageUri: (v: string | null) => void;
  setImageUri: (v: string | null) => void;
  setPhotos: (v: AppliancePhoto[] | ((prev: AppliancePhoto[]) => AppliancePhoto[])) => void;
  getName: () => string;
  getPhotos: () => AppliancePhoto[];
  getImageUri: () => string | null;
}

export function useApplianceAnalysis(setters: FormSetters) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingReceipt, setIsAnalyzingReceipt] = useState(false);
  const [scanMode, setScanMode] = useState<'appliance' | 'label' | 'receipt' | null>(null);
  const [scanPulse] = useState(() => new Animated.Value(1));

  const startPulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanPulse, { toValue: 0.95, duration: 800, useNativeDriver: true }),
        Animated.timing(scanPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [scanPulse]);

  const stopPulse = useCallback(() => {
    scanPulse.stopAnimation();
    Animated.timing(scanPulse, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, [scanPulse]);

  const analyzeReceipt = useCallback(async (base64: string, mimeType: string) => {
    setIsAnalyzingReceipt(true);
    setScanMode('receipt');
    startPulse();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      console.log('[ApplianceForm] Analyzing receipt with AI...');
      const result = await generateObject({
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'This is a photo of a purchase receipt. Extract the purchase details: total price, store/retailer name, purchase date, payment method, order/receipt number, item name, and any warranty information. Read the text carefully and extract exact values. If a field is not visible, return an empty string (or 0 for price).' },
            { type: 'image', image: `data:${mimeType};base64,${base64}` },
          ],
        }],
        schema: receiptSchema,
      });

      console.log('[ApplianceForm] Receipt analysis result:', JSON.stringify(result, null, 2));
      if (result.price > 0) setters.setPurchasePrice(result.price.toString());
      if (result.retailer) setters.setRetailer(result.retailer);
      if (result.purchaseDate) setters.setPurchaseDate(result.purchaseDate);
      if (result.paymentMethod) setters.setPaymentMethod(result.paymentMethod);
      if (result.orderNumber) setters.setOrderNumber(result.orderNumber);
      if (result.itemName && !setters.getName()) setters.setName(result.itemName);
      if (result.warrantyInfo) {
        setters.setNotes((prev: string) => prev ? `${prev}\nWarranty: ${result.warrantyInfo}` : `Warranty: ${result.warrantyInfo}`);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Receipt Scanned', `Extracted purchase details${result.retailer ? ` from ${result.retailer}` : ''}. Review and edit below.`);
    } catch (error) {
      console.error('[ApplianceForm] Receipt analysis error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Scan Failed', 'Could not read the receipt. Please enter purchase details manually.');
    } finally {
      setIsAnalyzingReceipt(false);
      setScanMode(null);
      stopPulse();
    }
  }, [startPulse, stopPulse, setters]);

  const analyzeImage = useCallback(async (base64: string, mimeType: string) => {
    setIsAnalyzing(true);
    setScanMode('appliance');
    startPulse();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      console.log('[ApplianceForm] Analyzing image with AI...');
      const result = await generateObject({
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'Identify this home appliance from the image. Extract the brand, model number, serial number, and any other details you can see. If you cannot determine a field, provide your best guess or leave it as an empty string. Be specific with the appliance name. Do NOT guess or assume a purchase date or location.' },
            { type: 'image', image: `data:${mimeType};base64,${base64}` },
          ],
        }],
        schema: applianceSchema,
      });

      console.log('[ApplianceForm] AI analysis result:', JSON.stringify(result, null, 2));
      if (result.name) setters.setName(result.name);
      if (result.brand) setters.setBrand(result.brand);
      if (result.model) setters.setModel(result.model);
      if (result.serialNumber) setters.setSerialNumber(result.serialNumber);
      if (result.category) setters.setCategory(result.category as ApplianceCategory);
      if (result.notes) setters.setNotes(result.notes);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Appliance Identified', `Detected: ${result.brand ? result.brand + ' ' : ''}${result.name}. Review and edit the details below.`);
    } catch (error) {
      console.error('[ApplianceForm] AI analysis error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Analysis Failed', 'Could not identify the appliance. Please fill in the details manually.');
    } finally {
      setIsAnalyzing(false);
      setScanMode(null);
      stopPulse();
    }
  }, [startPulse, stopPulse, setters]);

  const analyzeLabel = useCallback(async (base64: string, mimeType: string) => {
    setIsAnalyzing(true);
    setScanMode('label');
    startPulse();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      console.log('[ApplianceForm] Reading serial/model label with AI...');
      const labelResult = await generateObject({
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'This is a photo of a serial number / model number label on an appliance. Read the text on the label carefully. Extract the serial number, model number, and brand/manufacturer name exactly as printed. Also note any other useful specs visible (voltage, capacity, BTU, wattage, etc). If a field is not visible, return an empty string.' },
            { type: 'image', image: `data:${mimeType};base64,${base64}` },
          ],
        }],
        schema: labelReadSchema,
      });

      console.log('[ApplianceForm] Label read result:', JSON.stringify(labelResult, null, 2));
      if (labelResult.serialNumber) setters.setSerialNumber(labelResult.serialNumber);
      if (labelResult.model) setters.setModel(labelResult.model);
      if (labelResult.brand) setters.setBrand(labelResult.brand);

      const hasIdentifiers = labelResult.model || labelResult.serialNumber || labelResult.brand;
      if (hasIdentifiers) {
        console.log('[ApplianceForm] Looking up appliance details from label data...');
        try {
          const lookupResult = await generateObject({
            messages: [{
              role: 'user',
              content: `Based on the following appliance label information, identify the appliance type and provide details. Do NOT guess or assume a purchase date or location — leave those blank.\n\nBrand: ${labelResult.brand || 'Unknown'}\nModel Number: ${labelResult.model || 'Unknown'}\nSerial Number: ${labelResult.serialNumber || 'Unknown'}\nOther label text: ${labelResult.otherText || 'None'}\n\nIdentify the specific appliance type (e.g. "French Door Refrigerator", "Gas Furnace", "Front Load Washer") and provide the correct category. Include any known specs in the notes.`,
            }],
            schema: lookupSchema,
          });

          console.log('[ApplianceForm] Lookup result:', JSON.stringify(lookupResult, null, 2));
          if (lookupResult.name) setters.setName(lookupResult.name);
          if (lookupResult.brand) setters.setBrand(lookupResult.brand);
          if (lookupResult.model) setters.setModel(lookupResult.model);
          if (lookupResult.serialNumber) setters.setSerialNumber(lookupResult.serialNumber);
          if (lookupResult.category) setters.setCategory(lookupResult.category as ApplianceCategory);
          if (lookupResult.notes) setters.setNotes(lookupResult.notes);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Label Scanned', `Identified: ${lookupResult.brand ? lookupResult.brand + ' ' : ''}${lookupResult.name}. Review and edit the details below.`);
        } catch (lookupError) {
          console.error('[ApplianceForm] Lookup error:', lookupError);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Label Read', 'Serial/model numbers captured. Could not identify the appliance type — please fill in remaining details.');
        }
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert('No Numbers Found', 'Could not read a serial or model number from the image. Try taking a clearer photo of the label.');
      }
    } catch (error) {
      console.error('[ApplianceForm] Label analysis error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Scan Failed', 'Could not read the label. Please try again or enter details manually.');
    } finally {
      setIsAnalyzing(false);
      setScanMode(null);
      stopPulse();
    }
  }, [startPulse, stopPulse, setters]);

  const captureReceiptImage = useCallback(async (mode: 'camera' | 'library') => {
    try {
      let result;
      if (mode === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission Required', 'Camera access is needed to scan receipts.'); return; }
        result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, base64: true, allowsEditing: false });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, base64: true, allowsEditing: false });
      }
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log('[ApplianceForm] Receipt image captured, URI:', asset.uri);
        setters.setReceiptImageUri(asset.uri);
        if (asset.base64) await analyzeReceipt(asset.base64, asset.mimeType || 'image/jpeg');
      }
    } catch (error) {
      console.error('[ApplianceForm] Receipt capture error:', error);
      Alert.alert('Error', 'Something went wrong capturing the receipt image.');
    }
  }, [analyzeReceipt, setters]);

  const showReceiptCaptureOptions = useCallback(() => {
    Alert.alert('Scan Receipt', 'Take a photo of the purchase receipt to auto-fill details', [
      { text: 'Take Photo', onPress: () => captureReceiptImage('camera') },
      { text: 'Choose from Library', onPress: () => captureReceiptImage('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [captureReceiptImage]);

  const handleScanReceiptPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showReceiptCaptureOptions();
  }, [showReceiptCaptureOptions]);

  const captureImage = useCallback(async (mode: 'camera' | 'library', analysisType: 'appliance' | 'label') => {
    try {
      let result;
      if (mode === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission Required', 'Camera access is needed to scan appliances.'); return; }
        result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, base64: true, allowsEditing: false });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, base64: true, allowsEditing: false });
      }
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log(`[ApplianceForm] Image captured (${mode}/${analysisType}), URI:`, asset.uri);
        setters.setImageUri(asset.uri);
        if (asset.base64) {
          const mimeType = asset.mimeType || 'image/jpeg';
          if (analysisType === 'label') await analyzeLabel(asset.base64, mimeType);
          else await analyzeImage(asset.base64, mimeType);
        }
      }
    } catch (error) {
      console.error('[ApplianceForm] Capture error:', error);
      Alert.alert('Error', 'Something went wrong capturing the image.');
    }
  }, [analyzeImage, analyzeLabel, setters]);

  const showCaptureOptions = useCallback((analysisType: 'appliance' | 'label') => {
    Alert.alert(
      analysisType === 'label' ? 'Scan Label' : 'Scan Appliance',
      analysisType === 'label' ? 'Take a clear photo of the serial/model number label' : 'Choose how to capture the appliance image',
      [
        { text: 'Take Photo', onPress: () => captureImage('camera', analysisType) },
        { text: 'Choose from Library', onPress: () => captureImage('library', analysisType) },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  }, [captureImage]);

  const handleScanPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showCaptureOptions('appliance');
  }, [showCaptureOptions]);

  const handleScanLabelPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showCaptureOptions('label');
  }, [showCaptureOptions]);

  const clearImage = useCallback(() => {
    setters.setImageUri(null);
  }, [setters]);

  const addAdditionalPhoto = useCallback(async (mode: 'camera' | 'library') => {
    try {
      let result;
      if (mode === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission Required', 'Camera access is needed to take photos.'); return; }
        result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, base64: false, allowsEditing: false });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, base64: false, allowsEditing: false });
      }
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log('[ApplianceForm] Additional photo captured:', asset.uri);
        const newPhoto: AppliancePhoto = {
          id: Date.now().toString() + '_' + Math.random().toString(36).substring(2, 7),
          uri: asset.uri,
          isPrimary: setters.getPhotos().length === 0 && !setters.getImageUri(),
        };
        setters.setPhotos((prev: AppliancePhoto[]) => [...prev, newPhoto]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('[ApplianceForm] Additional photo capture error:', error);
      Alert.alert('Error', 'Something went wrong capturing the photo.');
    }
  }, [setters]);

  const showAddPhotoOptions = useCallback(() => {
    Alert.alert('Add Photo', 'Add another photo of this appliance', [
      { text: 'Take Photo', onPress: () => addAdditionalPhoto('camera') },
      { text: 'Choose from Library', onPress: () => addAdditionalPhoto('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [addAdditionalPhoto]);

  const setPrimaryPhoto = useCallback((photoId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setters.setPhotos((prev: AppliancePhoto[]) => prev.map((p: AppliancePhoto) => ({ ...p, isPrimary: p.id === photoId })));
    setters.setImageUri(null);
  }, [setters]);

  const setMainImageAsPrimary = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setters.setPhotos((prev: AppliancePhoto[]) => prev.map((p: AppliancePhoto) => ({ ...p, isPrimary: false })));
  }, [setters]);

  const removePhoto = useCallback((photoId: string) => {
    setters.setPhotos((prev: AppliancePhoto[]) => {
      const updated = prev.filter((p: AppliancePhoto) => p.id !== photoId);
      const removedWasPrimary = prev.find((p: AppliancePhoto) => p.id === photoId)?.isPrimary;
      if (removedWasPrimary && updated.length > 0) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
  }, [setters]);

  return {
    isAnalyzing,
    isAnalyzingReceipt,
    scanMode,
    scanPulse,
    handleScanPress,
    handleScanLabelPress,
    handleScanReceiptPress,
    clearImage,
    showAddPhotoOptions,
    setPrimaryPhoto,
    setMainImageAsPrimary,
    removePhoto,
  };
}
