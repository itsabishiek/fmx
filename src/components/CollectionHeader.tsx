import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { layout, palette, radius, spacing } from '@/theme';
import { AppText } from './AppText';
import { Artwork } from './Artwork';

interface CollectionHeaderProps {
  image: string;
  title: string;
  subtitle?: string;
  meta?: string;
  round?: boolean;
  onPlay: () => void;
  onShuffle: () => void;
  saved?: boolean;
  onToggleSave?: () => void;
  onMore?: () => void;
}

/** Floating circular back button used by all detail screens. */
export function BackButton({ onMore }: { onMore?: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.topBar, { top: insets.top + 4 }]} pointerEvents="box-none">
      <Pressable style={styles.circleBtn} onPress={() => router.back()} hitSlop={8}>
        <Ionicons name="chevron-back" size={24} color={palette.textPrimary} />
      </Pressable>
      {onMore ? (
        <Pressable style={styles.circleBtn} onPress={onMore} hitSlop={8}>
          <Ionicons name="ellipsis-horizontal" size={22} color={palette.textPrimary} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function CollectionHeader({
  image,
  title,
  subtitle,
  meta,
  round,
  onPlay,
  onShuffle,
  saved,
  onToggleSave,
}: CollectionHeaderProps) {
  return (
    <View style={styles.wrap}>
      {/* Artwork-derived gradient backdrop */}
      <Image source={{ uri: image }} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={60} />
      <LinearGradient
        colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.6)', palette.background]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <View style={layout.artworkShadow}>
          <Artwork uri={image} size={200} round={round} rounded="lg" />
        </View>
        <AppText
          variant="title1"
          numberOfLines={2}
          style={{ marginTop: spacing.lg, textAlign: 'center' }}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="headline" color="accent" style={{ marginTop: 4, textAlign: 'center' }}>
            {subtitle}
          </AppText>
        ) : null}
        {meta ? (
          <AppText variant="caption" color="secondary" style={{ marginTop: 4 }}>
            {meta}
          </AppText>
        ) : null}

        <View style={styles.actions}>
          <Pressable style={styles.playBtn} onPress={onPlay}>
            <Ionicons name="play" size={20} color={palette.textOnAccent} />
            <AppText variant="headline" style={{ color: palette.textOnAccent }}>
              Play
            </AppText>
          </Pressable>
          <Pressable style={styles.shuffleBtn} onPress={onShuffle}>
            <Ionicons name="shuffle" size={20} color={palette.accent} />
            <AppText variant="headline" color="accent">
              Shuffle
            </AppText>
          </Pressable>
          {onToggleSave ? (
            <Pressable style={styles.iconBtn} onPress={onToggleSave} hitSlop={8}>
              <Ionicons
                name={saved ? 'checkmark-circle' : 'add-circle-outline'}
                size={30}
                color={saved ? palette.accent : palette.textPrimary}
              />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 90, paddingBottom: spacing.lg, overflow: 'hidden' },
  content: { alignItems: 'center', paddingHorizontal: spacing.base },
  topBar: {
    position: 'absolute',
    left: spacing.base,
    right: spacing.base,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  shuffleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.accentMuted,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  iconBtn: { padding: spacing.xs },
});
