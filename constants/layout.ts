export const Radius = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  card: 16,
  cardLg: 18,
  cardXl: 20,
  pill: 22,
  sheet: 24,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  xxxxl: 32,
} as const;

type ShadowColor = { cardShadow: string };

export const cardShadowSubtle = (c: ShadowColor) => ({
  shadowColor: c.cardShadow,
  shadowOffset: { width: 0, height: 1 } as const,
  shadowOpacity: 1,
  shadowRadius: Spacing.xs,
  elevation: 1 as const,
});

export const cardShadowXs = (c: ShadowColor) => ({
  shadowColor: c.cardShadow,
  shadowOffset: { width: 0, height: 2 } as const,
  shadowOpacity: 1,
  shadowRadius: Spacing.xs,
  elevation: 1 as const,
});

export const cardShadowSm = (c: ShadowColor) => ({
  shadowColor: c.cardShadow,
  shadowOffset: { width: 0, height: 2 } as const,
  shadowOpacity: 1,
  shadowRadius: Spacing.sm,
  elevation: 1 as const,
});

export const cardShadowMd = (c: ShadowColor) => ({
  shadowColor: c.cardShadow,
  shadowOffset: { width: 0, height: 4 } as const,
  shadowOpacity: 1,
  shadowRadius: Spacing.md,
  elevation: 2 as const,
});

export const cardShadowLg = (c: ShadowColor) => ({
  shadowColor: c.cardShadow,
  shadowOffset: { width: 0, height: 4 } as const,
  shadowOpacity: 1,
  shadowRadius: Spacing.lg,
  elevation: 3 as const,
});
