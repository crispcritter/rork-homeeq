import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { generateText } from '@rork-ai/toolkit-sdk';
import { ManualInfo } from '@/types';
import { successNotification } from '@/utils/haptics';

interface UseManualSearchOptions {
  brand: string;
  model: string;
  serialNumber: string;
  name: string;
}

interface UseManualSearchResult {
  isSearchingManual: boolean;
  handleUploadManual: () => Promise<ManualInfo | undefined>;
  handleFindManual: () => Promise<ManualInfo | undefined>;
}

export function useManualSearch({ brand, model, serialNumber, name }: UseManualSearchOptions): UseManualSearchResult {
  const [isSearchingManual, setIsSearchingManual] = useState(false);

  const handleUploadManual = useCallback(async (): Promise<ManualInfo | undefined> => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        console.log('[useManualSearch] Manual image uploaded');
        return {
          type: 'upload',
          uri: result.assets[0].uri,
          title: `${brand} ${model} Manual`,
          foundVia: 'user',
        };
      }
    } catch (err) {
      console.log('[useManualSearch] Manual upload error:', err);
      Alert.alert('Error', 'Could not upload manual.');
    }
    return undefined;
  }, [brand, model]);

  const handleFindManual = useCallback(async (): Promise<ManualInfo | undefined> => {
    if (!brand.trim() && !model.trim() && !serialNumber.trim()) {
      Alert.alert('Missing Info', 'Please add brand and model info first.');
      return undefined;
    }
    setIsSearchingManual(true);
    try {
      console.log('[useManualSearch] Searching for manual:', brand, model, serialNumber);
      const searchQuery = [brand, model, serialNumber ? `serial ${serialNumber}` : '', name]
        .filter(Boolean)
        .join(' ');

      const response = await generateText({
        messages: [
          {
            role: 'user',
            content: `Find the official user manual or product manual PDF download link for this appliance:\n\nBrand: ${brand}\nModel: ${model}\nSerial Number: ${serialNumber || 'N/A'}\nProduct Name: ${name}\n\nSearch for "${searchQuery} user manual PDF" and return ONLY a valid URL to the manual PDF or product support page. The URL must be a real, working link from the manufacturer's website or a reputable manual hosting site like manualslib.com, manualzz.com, or the brand's official support page.\n\nReturn ONLY the URL, nothing else.`,
          },
        ],
      });

      const urlMatch = response.match(/https?:\/\/[^\s"'<>]+/i);
      if (urlMatch) {
        const manualUrl = urlMatch[0].replace(/[.,;)\]]+$/, '');
        console.log('[useManualSearch] Found manual URL:', manualUrl);
        successNotification();
        return {
          type: 'link',
          uri: manualUrl,
          title: `${brand} ${model} Manual`,
          foundVia: 'search',
        };
      } else {
        console.log('[useManualSearch] No URL found in response:', response);
        Alert.alert('No Manual Found', 'Could not find a manual. Try uploading one.');
      }
    } catch (err) {
      console.log('[useManualSearch] Manual search error:', err);
      Alert.alert('Search Failed', 'Could not search for manual.');
    } finally {
      setIsSearchingManual(false);
    }
    return undefined;
  }, [brand, model, serialNumber, name]);

  return { isSearchingManual, handleUploadManual, handleFindManual };
}
