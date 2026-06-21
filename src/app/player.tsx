import { useState } from 'react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RepeatMode } from 'react-native-track-player';
import { AppText } from '@/components/AppText';
import { Artwork } from '@/components/Artwork';
import { Seekbar } from '@/components/Seekbar';
import { EmptyState } from '@/components/states';
import {
  cycleRepeatMode,
  seekTo,
  skipToNext,
  skipToPrevious,
  togglePlayback,
  toggleShuffle,
} from '@/player/controls';
import {
  formatTime,
  useCurrentSong,
  useIsPlaying,
  useProgress,
  useRepeatMode,
  useShuffle,
} from '@/player/usePlayer';
import { useLyrics } from '@/hooks/queries';
import { decodeEntities } from '@/api/normalize';
import { useLibraryStore } from '@/store/libraryStore';
import { useUIStore } from '@/store/uiStore';
import { layout, palette, spacing } from '@/theme';

export default function PlayerScreen() {
  const insets = useSafeAreaInsets();
  const song = useCurrentSong();
  const { playing } = useIsPlaying();
  const { position, duration } = useProgress(500);
  const shuffle = useShuffle();
  const [repeatMode, refreshRepeat] = useRepeatMode();
  const { isFavorite, toggleFavorite } = useLibraryStore();
  const openSongActions = useUIStore((s) => s.openSongActions);
  const [showLyrics, setShowLyrics] = useState(false);
  // hasLyrics from the API is unreliable, so fetch whenever the lyrics tab is open and let the
  // result decide what to show (lyrics vs. a graceful "not available" message).
  const lyrics = useLyrics(song?.id, showLyrics);

  // Swipe-down-to-dismiss (Android has no native modal swipe). Declared before the early return
  // so hook order stays stable.
  const translateY = useSharedValue(0);
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const dismissGesture = Gesture.Pan()
    .activeOffsetY([16, 9999]) // only downward drags; horizontal/upward are ignored
    .failOffsetX([-24, 24]) // let the Seekbar own horizontal gestures
    .onUpdate((e) => {
      translateY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > 120 || e.velocityY > 900) {
        runOnJS(router.back)();
      } else {
        translateY.value = withSpring(0, { damping: 22, stiffness: 220 });
      }
    });

  if (!song) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.background }}>
        <EmptyState icon="musical-notes-outline" title="Nothing playing" />
      </View>
    );
  }

  const liked = isFavorite(song.id);
  const remaining = Math.max(0, duration - position);

  const repeatColor = repeatMode === RepeatMode.Off ? palette.textSecondary : palette.accent;

  return (
    <GestureDetector gesture={dismissGesture}>
      <Animated.View style={[{ flex: 1, backgroundColor: palette.background }, cardStyle]}>
      <Image source={{ uri: song.artwork }} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={80} />
      <LinearGradient
        colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.92)']}
        style={StyleSheet.absoluteFill}
      />

      <View style={{ flex: 1, paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.lg }}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="chevron-down" size={28} color={palette.textPrimary} />
          </Pressable>
          <AppText variant="micro" color="secondary">
            {showLyrics ? 'LYRICS' : 'NOW PLAYING'}
          </AppText>
          <Pressable onPress={() => openSongActions(song)} hitSlop={10}>
            <Ionicons name="ellipsis-horizontal" size={26} color={palette.textPrimary} />
          </Pressable>
        </View>

        {showLyrics ? (
          <ScrollView contentContainerStyle={styles.lyricsBox}>
            {lyrics.isLoading ? (
              <AppText color="secondary">Loading lyrics…</AppText>
            ) : lyrics.data?.lyrics ? (
              <AppText variant="title3" style={styles.lyricsText}>
                {decodeEntities(lyrics.data.lyrics.replace(/<br\s*\/?>/gi, '\n'))}
              </AppText>
            ) : (
              <AppText color="secondary" style={{ textAlign: 'center', lineHeight: 22 }}>
                Lyrics aren’t available for this track.
              </AppText>
            )}
          </ScrollView>
        ) : (
          <View style={styles.artWrap}>
            <View style={layout.artworkShadow}>
              <Artwork uri={song.artwork} size={320} rounded="xl" />
            </View>
          </View>
        )}

        {/* Meta + like */}
        <View style={styles.metaRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="title2" numberOfLines={1}>
              {song.title}
            </AppText>
            <Pressable
              onPress={() => {
                if (song.artistId) {
                  router.back();
                  router.push(`/artist/${song.artistId}`);
                }
              }}>
              <AppText variant="headline" color="accent" numberOfLines={1} style={{ marginTop: 2 }}>
                {song.artistName}
              </AppText>
            </Pressable>
          </View>
          <Pressable onPress={() => toggleFavorite(song)} hitSlop={10}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={28}
              color={liked ? palette.accent : palette.textPrimary}
            />
          </Pressable>
        </View>

        {/* Seekbar */}
        <View style={styles.seekWrap}>
          <Seekbar position={position} duration={duration} onSeek={seekTo} />
          <View style={styles.times}>
            <AppText variant="caption" color="secondary">
              {formatTime(position)}
            </AppText>
            <AppText variant="caption" color="secondary">
              -{formatTime(remaining)}
            </AppText>
          </View>
        </View>

        {/* Transport controls */}
        <View style={styles.controls}>
          <Pressable onPress={() => toggleShuffle()} hitSlop={8}>
            <Ionicons name="shuffle" size={26} color={shuffle ? palette.accent : palette.textSecondary} />
          </Pressable>
          <Pressable onPress={() => skipToPrevious()} hitSlop={8}>
            <Ionicons name="play-skip-back" size={36} color={palette.textPrimary} />
          </Pressable>
          <Pressable onPress={togglePlayback} style={styles.playBtn}>
            <Ionicons name={playing ? 'pause' : 'play'} size={40} color={palette.textOnAccent} />
          </Pressable>
          <Pressable onPress={() => skipToNext()} hitSlop={8}>
            <Ionicons name="play-skip-forward" size={36} color={palette.textPrimary} />
          </Pressable>
          <Pressable
            onPress={async () => {
              await cycleRepeatMode();
              refreshRepeat();
            }}
            hitSlop={8}>
            <View>
              <Ionicons name="repeat" size={26} color={repeatColor} />
              {repeatMode === RepeatMode.Track ? <View style={styles.repeatDot} /> : null}
            </View>
          </Pressable>
        </View>

        {/* Bottom actions */}
        <View style={styles.bottomBar}>
          <Pressable style={styles.bottomBtn} onPress={() => setShowLyrics((v) => !v)}>
            <Ionicons
              name="chatbox-ellipses-outline"
              size={22}
              color={showLyrics ? palette.accent : palette.textPrimary}
            />
            <AppText variant="caption" style={{ color: showLyrics ? palette.accent : palette.textSecondary }}>
              Lyrics
            </AppText>
          </Pressable>
          <Pressable style={styles.bottomBtn} onPress={() => router.push('/queue')}>
            <Ionicons name="list" size={22} color={palette.textPrimary} />
            <AppText variant="caption" color="secondary">
              Up Next
            </AppText>
          </Pressable>
        </View>
      </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  artWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  lyricsBox: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  lyricsText: { lineHeight: 32, textAlign: 'center' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  seekWrap: { paddingHorizontal: spacing.xl, marginTop: spacing.sm },
  times: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -6 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.lg,
  },
  playBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatDot: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.accent,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xxl,
  },
  bottomBtn: { alignItems: 'center', gap: 3 },
});
