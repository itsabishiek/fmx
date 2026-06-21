import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import type { AppSong } from '@/api/types';
import { spacing } from '@/theme';
import { playSong, playSongList } from '@/player/controls';
import { useUIStore } from '@/store/uiStore';
import { AppText } from './AppText';
import { Artwork } from './Artwork';
import { SectionHeader } from './HorizontalShelf';

interface SongShelfProps {
  title: string;
  subtitle?: string;
  songs: AppSong[];
  size?: number;
  /** When true, tapping plays just that song (queue = that song) instead of the whole shelf.
   *  Used for search results, which aren't a coherent collection. */
  playSingle?: boolean;
  /** Side-effect fired on tap (e.g. record the search interaction); playback still happens. */
  onItemPress?: (song: AppSong) => void;
}

/** Horizontal shelf of songs; tapping plays the whole shelf starting at that song. */
export function SongShelf({ title, subtitle, songs, size = 150, playSingle, onItemPress }: SongShelfProps) {
  const openActions = useUIStore((s) => s.openSongActions);
  if (!songs.length) return null;

  return (
    <View style={styles.wrap}>
      <SectionHeader title={title} subtitle={subtitle} />
      <FlatList
        horizontal
        data={songs}
        keyExtractor={(item, i) => `${item.id}-${i}`}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ width: spacing.base }} />}
        renderItem={({ item, index }) => (
          <Pressable
            style={{ width: size }}
            onPress={() => {
              onItemPress?.(item);
              if (playSingle) playSong(item);
              else playSongList(songs, index);
            }}
            onLongPress={() => openActions(item)}>
            <Artwork uri={item.artwork} size={size} rounded="md" />
            <AppText variant="callout" numberOfLines={1} style={{ marginTop: spacing.sm }}>
              {item.title}
            </AppText>
            <AppText variant="caption" color="secondary" numberOfLines={1} style={{ marginTop: 2 }}>
              {item.artistName}
            </AppText>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.xl },
  list: { paddingHorizontal: spacing.base },
});
