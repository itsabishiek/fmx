import { Platform } from 'react-native';

export { palette, gradients } from './colors';
export type { Palette } from './colors';

/** 4-pt based spacing scale. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

export const typography = {
  largeTitle: { fontSize: 34, fontWeight: '800' as const, letterSpacing: 0.3 },
  title1: { fontSize: 28, fontWeight: '800' as const, letterSpacing: 0.2 },
  title2: { fontSize: 22, fontWeight: '700' as const },
  title3: { fontSize: 18, fontWeight: '700' as const },
  headline: { fontSize: 16, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '500' as const },
  callout: { fontSize: 14, fontWeight: '600' as const },
  subhead: { fontSize: 13, fontWeight: '500' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
  micro: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.4 },
} as const;

/** System font families (rounded matches Apple Music's feel on iOS). */
export const fonts = Platform.select({
  ios: { sans: 'system-ui', rounded: 'ui-rounded' },
  default: { sans: 'normal', rounded: 'normal' },
})!;

/** Layout constants used to lay out the persistent mini-player above the tab bar. */
export const layout = {
  miniPlayerHeight: 60,
  tabBarHeight: 56,
  /** Padding to add at the bottom of scroll views so content clears the floating tab bar + mini-player. */
  scrollBottomPad: 150,
  artworkShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
} as const;
