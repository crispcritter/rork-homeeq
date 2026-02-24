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

export const LightColors: ColorScheme = {
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

export const DarkColors: ColorScheme = {
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

const Colors = LightColors;

export default Colors;
