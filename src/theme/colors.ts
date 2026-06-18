/**
 * FMX color palette — a true-black dark theme built around the accent #fd356d.
 * Tuned so the hot-pink accent pops against deep neutral surfaces.
 */
export const palette = {
  // Accent
  accent: '#fd356d',
  accentSoft: '#ff5e8a',
  accentDeep: '#c41d4e',
  accentGlow: 'rgba(253, 53, 109, 0.25)',
  accentMuted: 'rgba(253, 53, 109, 0.14)',

  // Backgrounds / surfaces (deep neutrals with a faint warm tint)
  background: '#000000',
  elevated: '#0e0e10',
  surface: '#161618',
  surfaceAlt: '#1f1f22',
  card: '#161618',
  overlay: 'rgba(0, 0, 0, 0.6)',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#9a9aa2',
  textTertiary: '#6c6c74',
  textOnAccent: '#ffffff',

  // Lines & misc
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',
  shimmer: 'rgba(255, 255, 255, 0.06)',
  shimmerHighlight: 'rgba(255, 255, 255, 0.12)',

  white: '#ffffff',
  black: '#000000',
} as const;

export type Palette = typeof palette;

/** Gradient presets used across headers, buttons and the now-playing backdrop. */
export const gradients = {
  accent: ['#fd356d', '#ff5e8a'] as const,
  accentDeep: ['#fd356d', '#c41d4e'] as const,
  /** Fades artwork-region colour down into the page background. */
  fadeToBg: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)', '#000000'] as const,
  /** Subtle top sheen for cards. */
  cardSheen: ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0)'] as const,
};
