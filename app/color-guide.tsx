import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { LightColors, DarkColors, ColorScheme } from '@/constants/colors';

interface SwatchProps {
  name: string;
  color: string;
  textOnColor?: string;
}

function Swatch({ name, color, textOnColor }: SwatchProps) {
  const { colors: c } = useTheme();
  const isTransparent = color.startsWith('rgba');
  const labelColor = textOnColor ?? (isLight(color) ? '#2D2926' : '#FFFFFF');

  return (
    <View style={[styles.swatchContainer, { borderColor: c.border }]}>
      <View style={[styles.swatchColor, { backgroundColor: color }]}>
        <Text style={[styles.swatchHex, { color: labelColor }]}>{color}</Text>
      </View>
      <View style={[styles.swatchLabel, { backgroundColor: c.surface }]}>
        <Text style={[styles.swatchName, { color: c.text }]}>{name}</Text>
      </View>
    </View>
  );
}

function isLight(hex: string): boolean {
  if (hex.startsWith('rgba')) return true;
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return false;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

interface ColorGroupProps {
  title: string;
  items: { name: string; color: string }[];
}

function ColorGroup({ title, items }: ColorGroupProps) {
  const { colors: c } = useTheme();

  return (
    <View style={styles.groupContainer}>
      <Text style={[styles.groupTitle, { color: c.text }]}>{title}</Text>
      <View style={styles.swatchGrid}>
        {items.map((item) => (
          <Swatch key={item.name} name={item.name} color={item.color} />
        ))}
      </View>
    </View>
  );
}

function PaletteSection({ label, scheme }: { label: string; scheme: ColorScheme }) {
  const { colors: c } = useTheme();

  const groups: ColorGroupProps[] = [
    {
      title: 'Primary',
      items: [
        { name: 'primary', color: scheme.primary },
        { name: 'primaryLight', color: scheme.primaryLight },
        { name: 'primaryDark', color: scheme.primaryDark },
      ],
    },
    {
      title: 'Accent',
      items: [
        { name: 'accent', color: scheme.accent },
        { name: 'accentLight', color: scheme.accentLight },
        { name: 'accentDark', color: scheme.accentDark },
      ],
    },
    {
      title: 'Backgrounds & Surfaces',
      items: [
        { name: 'background', color: scheme.background },
        { name: 'surface', color: scheme.surface },
        { name: 'surfaceAlt', color: scheme.surfaceAlt },
      ],
    },
    {
      title: 'Text',
      items: [
        { name: 'text', color: scheme.text },
        { name: 'textSecondary', color: scheme.textSecondary },
        { name: 'textTertiary', color: scheme.textTertiary },
      ],
    },
    {
      title: 'Borders',
      items: [
        { name: 'border', color: scheme.border },
        { name: 'borderLight', color: scheme.borderLight },
      ],
    },
    {
      title: 'Semantic',
      items: [
        { name: 'success', color: scheme.success },
        { name: 'successLight', color: scheme.successLight },
        { name: 'warning', color: scheme.warning },
        { name: 'warningLight', color: scheme.warningLight },
        { name: 'danger', color: scheme.danger },
        { name: 'dangerLight', color: scheme.dangerLight },
      ],
    },
    {
      title: 'Categories',
      items: [
        { name: 'Maintenance', color: scheme.categoryMaintenance },
        { name: 'Repair', color: scheme.categoryRepair },
        { name: 'Upgrade', color: scheme.categoryUpgrade },
        { name: 'Emergency', color: scheme.categoryEmergency },
        { name: 'Inspection', color: scheme.categoryInspection },
      ],
    },
    {
      title: 'Utility',
      items: [
        { name: 'white', color: scheme.white },
        { name: 'black', color: scheme.black },
        { name: 'overlay', color: scheme.overlay },
        { name: 'cardShadow', color: scheme.cardShadow },
      ],
    },
  ];

  return (
    <View style={styles.paletteSection}>
      <View style={[styles.paletteBadge, { backgroundColor: c.primaryLight }]}>
        <Text style={[styles.paletteBadgeText, { color: c.primary }]}>{label}</Text>
      </View>
      {groups.map((group) => (
        <ColorGroup key={group.title} title={group.title} items={group.items} />
      ))}
    </View>
  );
}

export default function ColorGuideScreen() {
  const { colors: c, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Stack.Screen options={{ title: 'Color Guide' }} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, { color: c.text }]}>Color Palette</Text>
        <Text style={[styles.pageSubtitle, { color: c.textSecondary }]}>
          All colors used throughout the application
        </Text>

        <PaletteSection
          label={isDark ? 'Dark Mode (Active)' : 'Light Mode (Active)'}
          scheme={isDark ? DarkColors : LightColors}
        />

        <View style={[styles.divider, { backgroundColor: c.border }]} />

        <PaletteSection
          label={isDark ? 'Light Mode' : 'Dark Mode'}
          scheme={isDark ? LightColors : DarkColors}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 15,
    marginBottom: 28,
  },
  paletteSection: {
    marginBottom: 24,
  },
  paletteBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 20,
  },
  paletteBadgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  groupContainer: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 10,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatchContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    width: Platform.OS === 'web' ? 160 : '47%' as any,
    minWidth: 140,
  },
  swatchColor: {
    height: 64,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: 8,
  },
  swatchHex: {
    fontSize: 11,
    fontWeight: '500' as const,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  swatchLabel: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  swatchName: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
});
