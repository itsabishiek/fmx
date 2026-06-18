import { BlurView } from 'expo-blur';
import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { layout, palette, spacing } from '@/theme';
import { useCurrentSong, useIsPlaying, useProgress } from '@/player/usePlayer';
import { togglePlayback, skipToNext } from '@/player/controls';
import { AppText } from './AppText';
import { Artwork } from './Artwork';

export function MiniPlayer() {
  const song = useCurrentSong();
  const { playing } = useIsPlaying();
  const { position, duration } = useProgress(500);

  if (!song) return null;

  const pct = duration > 0 ? Math.min(1, position / duration) : 0;

  return (
    <View style={styles.container}>
      <BlurView intensity={70} tint="dark" style={styles.blur}>
        <Pressable style={styles.inner} onPress={() => router.push('/player')}>
          <Artwork uri={song.artworkSmall} size={44} rounded="sm" />
          <View style={styles.meta}>
            <AppText variant="callout" numberOfLines={1}>
              {song.title}
            </AppText>
            <AppText variant="caption" color="secondary" numberOfLines={1}>
              {song.artistName}
            </AppText>
          </View>
          <Pressable hitSlop={12} onPress={togglePlayback} style={styles.btn}>
            <Ionicons name={playing ? 'pause' : 'play'} size={26} color={palette.textPrimary} />
          </Pressable>
          <Pressable hitSlop={12} onPress={() => skipToNext()} style={styles.btn}>
            <Ionicons name="play-skip-forward" size={22} color={palette.textPrimary} />
          </Pressable>
        </Pressable>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
        </View>
      </BlurView>
    </View>
  );
}

/**
 * The tab screens get their mini-player from the custom TabBar (stacked above the tabs).
 * Pushed screens (album/artist/playlist/favorites/category) and the queue modal have no
 * tab bar, so this overlay renders the mini-player there instead. Hidden on the tab routes
 * (handled by TabBar) and on the full-screen player.
 */
const TAB_ROUTES = ['/', '/browse', '/search', '/library'];
const HIDE_ON = [...TAB_ROUTES, '/player'];

export function GlobalMiniPlayer() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const song = useCurrentSong();

  if (!song || HIDE_ON.includes(pathname)) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.overlay, { bottom: (insets.bottom || spacing.sm) + spacing.sm }]}>
      <MiniPlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', left: 0, right: 0 },
  container: {
    borderRadius: 14,
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
  blur: { backgroundColor: 'rgba(28,28,31,0.6)' },
  inner: {
    height: layout.miniPlayerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  meta: { flex: 1, marginLeft: spacing.md },
  btn: { paddingHorizontal: spacing.sm },
  progressTrack: {
    height: 2,
    backgroundColor: palette.border,
    marginHorizontal: spacing.md,
    marginBottom: 4,
    borderRadius: 2,
  },
  progressFill: { height: 2, backgroundColor: palette.accent, borderRadius: 2 },
});
