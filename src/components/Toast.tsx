import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout, palette, radius, spacing } from '@/theme';
import { useUIStore } from '@/store/uiStore';
import { AppText } from './AppText';

/** Lightweight transient toast, driven by uiStore.showToast(). Mounted once in GlobalSheets. */
export function Toast() {
  const toast = useUIStore((s) => s.toast);
  const seq = useUIStore((s) => s.toastSeq);
  const insets = useSafeAreaInsets();

  if (!toast) return null;

  return (
    <Animated.View
      key={seq}
      entering={FadeInDown.duration(180)}
      exiting={FadeOutDown.duration(180)}
      pointerEvents="none"
      style={[
        styles.toast,
        { bottom: (insets.bottom || spacing.sm) + layout.miniPlayerHeight + layout.tabBarHeight },
      ]}>
      <AppText variant="callout" style={{ color: palette.textPrimary, textAlign: 'center' }}>
        {toast}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: '86%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.borderStrong,
    ...layout.artworkShadow,
  },
});
