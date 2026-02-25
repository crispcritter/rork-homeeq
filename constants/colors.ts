export type ColorScheme = {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  borderLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  danger: string;
  dangerLight: string;
  white: string;
  black: string;
  overlay: string;
  cardShadow: string;
  categoryMaintenance: string;
  categoryRepair: string;
  categoryUpgrade: string;
  categoryEmergency: string;
  categoryInspection: string;
};

export type PaletteId = 'default' | 'richBlue' | 'deepGrey';

export interface PaletteOption {
  id: PaletteId;
  label: string;
  preview: string;
}

export const PALETTE_OPTIONS: PaletteOption[] = [
  { id: 'default', label: 'Sage', preview: '#5A8A60' },
  { id: 'richBlue', label: 'Ocean', preview: '#2E6B9C' },
  { id: 'deepGrey', label: 'Slate', preview: '#5A6272' },
];

const defaultLight: ColorScheme = {
  primary: '#5A8A60',
  primaryLight: '#EDF3EE',
  primaryDark: '#3D6B43',
  accent: '#C4826D',
  accentLight: '#FBF0EC',
  accentDark: '#A8654F',
  background: '#FAF8F5',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F2EF',
  text: '#2D2926',
  textSecondary: '#7A7067',
  textTertiary: '#AEA69D',
  border: '#E8E3DE',
  borderLight: '#F0ECE8',
  success: '#5A8A60',
  successLight: '#EDF3EE',
  warning: '#C9943A',
  warningLight: '#FBF4E4',
  danger: '#BF5E5E',
  dangerLight: '#FAECEC',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(45,41,38,0.5)',
  cardShadow: 'rgba(45,41,38,0.08)',
  categoryMaintenance: '#5A8A60',
  categoryRepair: '#C4826D',
  categoryUpgrade: '#B08D57',
  categoryEmergency: '#BF5E5E',
  categoryInspection: '#A08670',
};

const defaultDark: ColorScheme = {
  primary: '#6FA876',
  primaryLight: '#1E2E20',
  primaryDark: '#8CC494',
  accent: '#D49A87',
  accentLight: '#2C1F1A',
  accentDark: '#E4B8A8',
  background: '#141211',
  surface: '#1E1C1A',
  surfaceAlt: '#282523',
  text: '#EDE8E3',
  textSecondary: '#9E9790',
  textTertiary: '#6B655F',
  border: '#33302D',
  borderLight: '#282523',
  success: '#6FA876',
  successLight: '#1E2E20',
  warning: '#D4A84E',
  warningLight: '#2E2515',
  danger: '#D47272',
  dangerLight: '#2E1A1A',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.6)',
  cardShadow: 'rgba(0,0,0,0.3)',
  categoryMaintenance: '#6FA876',
  categoryRepair: '#D49A87',
  categoryUpgrade: '#C9A56A',
  categoryEmergency: '#D47272',
  categoryInspection: '#B8A08A',
};

const richBlueLight: ColorScheme = {
  primary: '#2E6B9C',
  primaryLight: '#E8F1F8',
  primaryDark: '#1B4F78',
  accent: '#C47D5C',
  accentLight: '#FBF0E8',
  accentDark: '#A86240',
  background: '#F5F8FB',
  surface: '#FFFFFF',
  surfaceAlt: '#EDF2F7',
  text: '#1A2433',
  textSecondary: '#5A6A7A',
  textTertiary: '#94A3B4',
  border: '#D8E2EC',
  borderLight: '#E8EEF4',
  success: '#3A8A5C',
  successLight: '#E8F5EE',
  warning: '#C48A3A',
  warningLight: '#FBF2E4',
  danger: '#BF5E5E',
  dangerLight: '#FAECEC',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(26,36,51,0.5)',
  cardShadow: 'rgba(26,36,51,0.08)',
  categoryMaintenance: '#2E6B9C',
  categoryRepair: '#C47D5C',
  categoryUpgrade: '#B08D57',
  categoryEmergency: '#BF5E5E',
  categoryInspection: '#7A8FA5',
};

const richBlueDark: ColorScheme = {
  primary: '#4D9AD4',
  primaryLight: '#162A3E',
  primaryDark: '#7BBAE8',
  accent: '#D4956E',
  accentLight: '#2C2018',
  accentDark: '#E4B8A0',
  background: '#0E1419',
  surface: '#171E26',
  surfaceAlt: '#1F2935',
  text: '#E3EAF2',
  textSecondary: '#8A9AAE',
  textTertiary: '#556678',
  border: '#283545',
  borderLight: '#1F2935',
  success: '#4FA87A',
  successLight: '#162E22',
  warning: '#D4A04E',
  warningLight: '#2E2515',
  danger: '#D47272',
  dangerLight: '#2E1A1A',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.6)',
  cardShadow: 'rgba(0,0,0,0.3)',
  categoryMaintenance: '#4D9AD4',
  categoryRepair: '#D4956E',
  categoryUpgrade: '#C9A56A',
  categoryEmergency: '#D47272',
  categoryInspection: '#8AA5BE',
};

const deepGreyLight: ColorScheme = {
  primary: '#5A6272',
  primaryLight: '#EDEEF1',
  primaryDark: '#3E4550',
  accent: '#B87A5C',
  accentLight: '#F8F0EA',
  accentDark: '#9A5F40',
  background: '#F6F6F8',
  surface: '#FFFFFF',
  surfaceAlt: '#EEEFF2',
  text: '#23262D',
  textSecondary: '#6B7080',
  textTertiary: '#A0A5B0',
  border: '#DCDEE4',
  borderLight: '#E8E9ED',
  success: '#4A8A5C',
  successLight: '#E8F3EC',
  warning: '#C49040',
  warningLight: '#FBF3E6',
  danger: '#BF5E5E',
  dangerLight: '#FAECEC',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(35,38,45,0.5)',
  cardShadow: 'rgba(35,38,45,0.08)',
  categoryMaintenance: '#5A6272',
  categoryRepair: '#B87A5C',
  categoryUpgrade: '#A89060',
  categoryEmergency: '#BF5E5E',
  categoryInspection: '#8A8E9A',
};

const deepGreyDark: ColorScheme = {
  primary: '#8892A4',
  primaryLight: '#1E2028',
  primaryDark: '#A8B2C4',
  accent: '#D49474',
  accentLight: '#2A1F18',
  accentDark: '#E4B4A0',
  background: '#111215',
  surface: '#1A1B20',
  surfaceAlt: '#24262C',
  text: '#E2E3E8',
  textSecondary: '#8E9098',
  textTertiary: '#585B64',
  border: '#2E3038',
  borderLight: '#24262C',
  success: '#6AA87A',
  successLight: '#1A2E20',
  warning: '#D4A858',
  warningLight: '#2E2618',
  danger: '#D47272',
  dangerLight: '#2E1A1A',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.6)',
  cardShadow: 'rgba(0,0,0,0.3)',
  categoryMaintenance: '#8892A4',
  categoryRepair: '#D49474',
  categoryUpgrade: '#C4AA6A',
  categoryEmergency: '#D47272',
  categoryInspection: '#9A9EAA',
};

export const palettes: Record<PaletteId, { light: ColorScheme; dark: ColorScheme }> = {
  default: { light: defaultLight, dark: defaultDark },
  richBlue: { light: richBlueLight, dark: richBlueDark },
  deepGrey: { light: deepGreyLight, dark: deepGreyDark },
};

export const LightColors = defaultLight;
export const DarkColors = defaultDark;

const Colors = LightColors;

export default Colors;
