import { Text, TextProps, StyleSheet } from 'react-native';
import { palette, typography } from '@/theme';

type Variant = keyof typeof typography;
type ColorKey = 'primary' | 'secondary' | 'tertiary' | 'accent';

const COLORS: Record<ColorKey, string> = {
  primary: palette.textPrimary,
  secondary: palette.textSecondary,
  tertiary: palette.textTertiary,
  accent: palette.accent,
};

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: ColorKey;
}

/** Themed Text honouring the FMX typography scale and palette. */
export function AppText({
  variant = 'body',
  color = 'primary',
  style,
  ...rest
}: AppTextProps) {
  return <Text {...rest} style={[styles.base, typography[variant], { color: COLORS[color] }, style]} />;
}

const styles = StyleSheet.create({
  base: { color: palette.textPrimary },
});
