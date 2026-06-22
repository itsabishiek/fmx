import { memo, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Ionicons } from '@expo/vector-icons';
import type { AppSong } from '@/api/types';
import { palette, spacing } from '@/theme';
import { addToQueue, playNext } from '@/player/controls';
import { useCurrentSong, useIsPlaying } from '@/player/usePlayer';
import { useUIStore } from '@/store/uiStore';
import { AppText } from './AppText';
import { Artwork } from './Artwork';

interface SongRowProps {
  song: AppSong;
  /** Called when the row body is tapped (usually plays the song / list). */
  onPress: () => void;
  /** Show a leading index number instead of artwork (album track lists). */
  index?: number;
  /** Local playlist context, passed to the action sheet for "remove from playlist". */
  playlistId?: string;
  showArtwork?: boolean;
}

function SwipeAction({
  icon,
  label,
  bg,
  align,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  bg: string;
  align: 'flex-start' | 'flex-end';
}) {
  return (
    <View style={[styles.action, { backgroundColor: bg, alignItems: align }]}>
      <View style={styles.actionInner}>
        <Ionicons name={icon} size={20} color={palette.white} />
        <AppText variant="micro" style={{ color: palette.white, marginTop: 2 }}>
          {label}
        </AppText>
      </View>
    </View>
  );
}

function SongRowBase({ song, onPress, index, playlistId, showArtwork = true }: SongRowProps) {
  const current = useCurrentSong();
  const { playing } = useIsPlaying();
  const isCurrent = current?.id === song.id;
  const openActions = useUIStore((s) => s.openSongActions);
  const swipeRef = useRef<SwipeableMethods>(null);

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      friction={2}
      leftThreshold={56}
      rightThreshold={56}
      overshootLeft={false}
      overshootRight={false}
      // `direction` is the swipe direction: swipe right → Add to Queue, swipe left → Play Next.
      renderLeftActions={() => (
        <SwipeAction icon="list" label="Queue" bg={palette.accent} align="flex-start" />
      )}
      renderRightActions={() => (
        <SwipeAction
          icon="play-skip-forward"
          label="Play Next"
          bg={palette.surfaceAlt}
          align="flex-end"
        />
      )}
      onSwipeableWillOpen={(direction) => {
        if (direction === 'right') addToQueue(song);
        else playNext(song);
        swipeRef.current?.close();
      }}>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        onPress={onPress}
        onLongPress={() => openActions(song, playlistId)}>
        {showArtwork ? (
          <Artwork uri={song.artworkSmall} size={48} rounded="sm" />
        ) : (
          <View style={styles.indexBox}>
            {isCurrent ? (
              <Ionicons name={playing ? 'volume-high' : 'pause'} size={16} color={palette.accent} />
            ) : (
              <AppText variant="callout" color="secondary">
                {(index ?? 0) + 1}
              </AppText>
            )}
          </View>
        )}

        <View style={styles.meta}>
          <AppText variant="body" numberOfLines={1} color={isCurrent ? 'accent' : 'primary'}>
            {song.title}
          </AppText>
          <AppText variant="subhead" color="secondary" numberOfLines={1} style={{ marginTop: 2 }}>
            {song.artistName}
          </AppText>
        </View>

        <Pressable hitSlop={10} onPress={() => openActions(song, playlistId)} style={styles.more}>
          <Ionicons name="ellipsis-horizontal" size={20} color={palette.textSecondary} />
        </Pressable>
      </Pressable>
    </ReanimatedSwipeable>
  );
}

export const SongRow = memo(SongRowBase);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    backgroundColor: palette.background, // opaque so the swipe action sits behind, not bleeding through
  },
  pressed: { backgroundColor: palette.surface },
  indexBox: { width: 48, alignItems: 'center', justifyContent: 'center' },
  meta: { flex: 1, marginLeft: spacing.md },
  more: { padding: spacing.sm },
  action: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg },
  actionInner: { alignItems: 'center', width: 64 },
});
