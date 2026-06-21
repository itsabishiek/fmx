import TrackPlayer from 'react-native-track-player';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { Artwork } from '@/components/Artwork';
import { DraggableQueue } from '@/components/DraggableQueue';
import { EmptyState } from '@/components/states';
import { SectionHeader } from '@/components/HorizontalShelf';
import { clearQueue, moveInQueue, removeFromQueue } from '@/player/controls';
import { useActiveIndex, useCurrentSong, useQueueSongs } from '@/player/usePlayer';
import { layout, palette, spacing } from '@/theme';

export default function QueueScreen() {
  const insets = useSafeAreaInsets();
  const queue = useQueueSongs();
  const current = useCurrentSong();

  // Use the real active *index* (not findIndex-by-id) so duplicate songs in the queue don't
  // resolve to the wrong row — which would mis-slice "upcoming" and break reorder/remove.
  const activeIndex = useActiveIndex();
  const currentIndex = activeIndex >= 0 && activeIndex < queue.length ? activeIndex : -1;
  const upcoming = currentIndex >= 0 ? queue.slice(currentIndex + 1) : queue;

  const jumpTo = async (absoluteIndex: number) => {
    await TrackPlayer.skip(absoluteIndex);
    await TrackPlayer.play();
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.background, paddingTop: insets.top + spacing.sm }}>
      <View style={styles.header}>
        <AppText variant="title2">Queue</AppText>
        <View style={{ flexDirection: 'row', gap: spacing.lg, alignItems: 'center' }}>
          <Pressable onPress={() => clearQueue()} hitSlop={8}>
            <AppText variant="callout" color="accent">
              Clear
            </AppText>
          </Pressable>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="close" size={26} color={palette.textPrimary} />
          </Pressable>
        </View>
      </View>

      {queue.length === 0 ? (
        <EmptyState icon="list-outline" title="Queue is empty" subtitle="Play something to build a queue." />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: layout.scrollBottomPad }}>
          {current ? (
            <>
              <SectionHeader title="Now Playing" />
              <View style={[styles.row, styles.currentRow]}>
                <Artwork uri={current.artworkSmall} size={48} rounded="sm" />
                <View style={styles.meta}>
                  <AppText variant="body" color="accent" numberOfLines={1}>
                    {current.title}
                  </AppText>
                  <AppText variant="subhead" color="secondary" numberOfLines={1}>
                    {current.artistName}
                  </AppText>
                </View>
                <Ionicons name="musical-note" size={18} color={palette.accent} />
              </View>
            </>
          ) : null}

          {upcoming.length > 0 ? (
            <View style={{ marginTop: spacing.base }}>
              <SectionHeader title="Up Next" subtitle="Long-press a row to drag & reorder" />
              <DraggableQueue
                songs={upcoming}
                startIndex={currentIndex + 1}
                onReorder={moveInQueue}
                onJump={jumpTo}
                onRemove={removeFromQueue}
              />
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  currentRow: { backgroundColor: palette.surface },
  meta: { flex: 1, marginLeft: spacing.md },
  ctrl: { paddingHorizontal: spacing.xs, paddingVertical: spacing.sm },
});
