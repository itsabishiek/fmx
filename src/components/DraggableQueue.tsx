import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { AppSong } from '@/api/types';
import { palette, spacing } from '@/theme';
import { AppText } from './AppText';
import { Artwork } from './Artwork';

const ROW_H = 64;
const SPRING = { damping: 22, stiffness: 240 } as const;

type Positions = Record<string, number>;

// Identity is the row's *slot index*, not song.id — the queue can legitimately hold the same
// song twice (duplicate ids would collide and collapse two rows onto one slot).
function buildPositions(songs: AppSong[]): Positions {
  const p: Positions = {};
  songs.forEach((_, i) => (p[i] = i));
  return p;
}

/** Re-index `positions` after moving an item from slot `from` to slot `to`. */
function objectMove(positions: Positions, from: number, to: number): Positions {
  'worklet';
  const next: Positions = Object.assign({}, positions);
  for (const id in positions) {
    const pos = positions[id];
    if (pos === from) next[id] = to;
    else if (from < to && pos > from && pos <= to) next[id] = pos - 1;
    else if (from > to && pos >= to && pos < from) next[id] = pos + 1;
  }
  return next;
}

function clamp(v: number, min: number, max: number) {
  'worklet';
  return Math.max(min, Math.min(v, max));
}

interface Props {
  /** Upcoming songs (the part of the queue after the current track). */
  songs: AppSong[];
  /** Absolute queue index of `songs[0]` (= currentIndex + 1). */
  startIndex: number;
  onReorder: (fromAbsolute: number, toAbsolute: number) => void;
  onJump: (absoluteIndex: number) => void;
  onRemove: (absoluteIndex: number) => void;
}

/** Long-press a row to lift it, then drag to reorder. Other rows reflow live. */
export function DraggableQueue({ songs, startIndex, onReorder, onJump, onRemove }: Props) {
  const positions = useSharedValue<Positions>(buildPositions(songs));

  useEffect(() => {
    positions.value = buildPositions(songs);
  }, [songs, positions]);

  return (
    <View style={{ height: songs.length * ROW_H }}>
      {songs.map((song, i) => (
        <QueueItem
          key={`${i}-${song.id}`}
          song={song}
          index={i}
          positions={positions}
          count={songs.length}
          startIndex={startIndex}
          onReorder={onReorder}
          onJump={onJump}
          onRemove={onRemove}
        />
      ))}
    </View>
  );
}

function QueueItem({
  song,
  index,
  positions,
  count,
  startIndex,
  onReorder,
  onJump,
  onRemove,
}: {
  song: AppSong;
  index: number;
  positions: SharedValue<Positions>;
  count: number;
  startIndex: number;
} & Pick<Props, 'onReorder' | 'onJump' | 'onRemove'>) {
  const active = useSharedValue(false);
  // Initialise from the render-time slot (`index`); never read positions.value during render.
  const top = useSharedValue(index * ROW_H);
  const startPos = useSharedValue(0);

  // Follow our slot whenever positions change and we're not the one being dragged.
  useAnimatedReaction(
    () => positions.value[index],
    (pos) => {
      if (!active.value && pos != null) top.value = withSpring(pos * ROW_H, SPRING);
    },
  );

  const pan = Gesture.Pan()
    .activateAfterLongPress(220)
    .onStart(() => {
      active.value = true;
      startPos.value = positions.value[index] ?? 0;
    })
    .onUpdate((e) => {
      const y = startPos.value * ROW_H + e.translationY;
      top.value = y;
      const newPos = clamp(Math.round(y / ROW_H), 0, count - 1);
      const curPos = positions.value[index];
      if (newPos !== curPos) positions.value = objectMove(positions.value, curPos, newPos);
    })
    .onEnd(() => {
      const finalPos = positions.value[index] ?? startPos.value;
      top.value = withSpring(finalPos * ROW_H, SPRING);
    })
    .onFinalize(() => {
      if (!active.value) return;
      active.value = false;
      const finalPos = positions.value[index] ?? startPos.value;
      if (finalPos !== startPos.value) {
        runOnJS(onReorder)(startIndex + startPos.value, startIndex + finalPos);
      }
    });

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: 0,
    right: 0,
    height: ROW_H,
    top: top.value,
    zIndex: active.value ? 10 : 0,
    transform: [{ scale: withSpring(active.value ? 1.03 : 1, SPRING) }],
    backgroundColor: active.value ? palette.surface : palette.background,
    shadowColor: '#000',
    shadowOpacity: active.value ? 0.35 : 0,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: active.value ? 8 : 0,
  }));

  const absoluteIndex = startIndex + index;

  return (
    <Animated.View style={style}>
      <View style={styles.row}>
        <GestureDetector gesture={pan}>
          <View style={styles.handle}>
            <Ionicons name="reorder-three" size={24} color={palette.textSecondary} />
          </View>
        </GestureDetector>
        <Pressable style={styles.body} onPress={() => onJump(absoluteIndex)}>
          <Artwork uri={song.artworkSmall} size={44} rounded="sm" />
          <View style={styles.meta}>
            <AppText variant="body" numberOfLines={1}>
              {song.title}
            </AppText>
            <AppText variant="subhead" color="secondary" numberOfLines={1}>
              {song.artistName}
            </AppText>
          </View>
        </Pressable>
        <Pressable hitSlop={8} onPress={() => onRemove(absoluteIndex)} style={styles.remove}>
          <Ionicons name="remove-circle-outline" size={22} color={palette.textSecondary} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.base,
  },
  handle: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, justifyContent: 'center' },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  meta: { flex: 1, marginLeft: spacing.md },
  remove: { padding: spacing.sm },
});
