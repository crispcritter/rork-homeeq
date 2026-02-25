import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {
  Download,
  ChevronDown,
  ChevronUp,
  Mail,
  FileDown,
  Share2,
  Printer,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { ColorScheme } from '@/constants/colors';
import { lightImpact } from '@/utils/haptics';
import {
  handleExportEmail,
  handleExportPDF,
  handleExportCSV,
  handleExportPrint,
} from '@/utils/export';

interface ExportSectionProps {
  getCSV: () => string;
  getHTML: () => string;
  filePrefix: string;
  entityName: string;
  entityCount: number;
  emailSubject: string;
  emailBodyHtml: string;
  subtitle?: string;
  testIDPrefix?: string;
}

function ExportSection({
  getCSV,
  getHTML,
  filePrefix,
  entityName,
  entityCount,
  emailSubject,
  emailBodyHtml,
  subtitle,
  testIDPrefix = 'export',
}: ExportSectionProps) {
  const { colors: c } = useTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const [expanded, setExpanded] = useState(false);
  const exportAnim = useRef(new Animated.Value(0)).current;

  const toggleExport = useCallback(() => {
    lightImpact();
    const toValue = expanded ? 0 : 1;
    setExpanded(!expanded);
    Animated.timing(exportAnim, {
      toValue,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [expanded, exportAnim]);

  const actions = useMemo(() => ({
    getCSV,
    getHTML,
    filePrefix,
    entityName,
    entityCount,
    emailSubject,
    emailBodyHtml,
  }), [getCSV, getHTML, filePrefix, entityName, entityCount, emailSubject, emailBodyHtml]);

  return (
    <View style={styles.exportSection}>
      <TouchableOpacity
        style={styles.exportHeader}
        onPress={toggleExport}
        activeOpacity={0.7}
        testID={`${testIDPrefix}-toggle`}
      >
        <View style={styles.exportHeaderLeft}>
          <View style={[styles.exportHeaderIcon, { backgroundColor: c.primaryLight }]}>
            <Download size={18} color={c.primary} />
          </View>
          <View>
            <Text style={styles.exportHeaderTitle}>Export</Text>
            <Text style={styles.exportHeaderSubtitle}>
              {subtitle ?? 'Download your data'}
            </Text>
          </View>
        </View>
        {expanded ? (
          <ChevronUp size={20} color={c.textTertiary} />
        ) : (
          <ChevronDown size={20} color={c.textTertiary} />
        )}
      </TouchableOpacity>

      {expanded && (
        <View style={styles.exportGrid}>
          <TouchableOpacity
            style={styles.exportGridItem}
            onPress={() => handleExportEmail(actions)}
            activeOpacity={0.7}
            testID={`${testIDPrefix}-email`}
          >
            <View style={[styles.exportGridIcon, { backgroundColor: '#EEF2FF' }]}>
              <Mail size={22} color="#4F46E5" />
            </View>
            <Text style={styles.exportGridTitle}>Email</Text>
            <Text style={styles.exportGridDesc}>Send as attachment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exportGridItem}
            onPress={() => handleExportPDF(actions)}
            activeOpacity={0.7}
            testID={`${testIDPrefix}-pdf`}
          >
            <View style={[styles.exportGridIcon, { backgroundColor: '#FEF2F2' }]}>
              <FileDown size={22} color="#DC2626" />
            </View>
            <Text style={styles.exportGridTitle}>PDF</Text>
            <Text style={styles.exportGridDesc}>Save or share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exportGridItem}
            onPress={() => handleExportCSV(actions)}
            activeOpacity={0.7}
            testID={`${testIDPrefix}-csv`}
          >
            <View style={[styles.exportGridIcon, { backgroundColor: '#FFF7ED' }]}>
              <Share2 size={22} color="#EA580C" />
            </View>
            <Text style={styles.exportGridTitle}>CSV</Text>
            <Text style={styles.exportGridDesc}>Spreadsheet data</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exportGridItem}
            onPress={() => handleExportPrint(actions)}
            activeOpacity={0.7}
            testID={`${testIDPrefix}-print`}
          >
            <View style={[styles.exportGridIcon, { backgroundColor: '#F0FDF4' }]}>
              <Printer size={22} color="#16A34A" />
            </View>
            <Text style={styles.exportGridTitle}>Print</Text>
            <Text style={styles.exportGridDesc}>AirPrint</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const createStyles = (c: ColorScheme) => StyleSheet.create({
  exportSection: {
    marginTop: 16,
    marginBottom: 8,
  },
  exportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: c.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 1,
  },
  exportHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  exportHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportHeaderTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: c.text,
    lineHeight: 21,
  },
  exportHeaderSubtitle: {
    fontSize: 12,
    color: c.textTertiary,
    lineHeight: 16,
    marginTop: 1,
  },
  exportGrid: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  exportGridItem: {
    width: '48%' as any,
    backgroundColor: c.surface,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: c.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  exportGridIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  exportGridTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: c.text,
    lineHeight: 18,
    textAlign: 'center' as const,
  },
  exportGridDesc: {
    fontSize: 11,
    color: c.textTertiary,
    lineHeight: 15,
    marginTop: 2,
    textAlign: 'center' as const,
  },
});

export default React.memo(ExportSection);
