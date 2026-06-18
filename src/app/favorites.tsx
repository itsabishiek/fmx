import { FlatList, View } from 'react-native';
import { BackButton, CollectionHeader } from '@/components/CollectionHeader';
import { SongRow } from '@/components/SongRow';
import { EmptyState } from '@/components/states';
import { playSongList } from '@/player/controls';
import { useLibraryStore } from '@/store/libraryStore';
import { layout, palette } from '@/theme';

export default function FavoritesScreen() {
  const favorites = useLibraryStore((s) => s.favorites);
  const cover = favorites[0]?.artwork ?? '';

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <BackButton />
      <FlatList
        data={favorites}
        keyExtractor={(item, i) => `${item.id}-${i}`}
        contentContainerStyle={{ paddingBottom: layout.scrollBottomPad }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <CollectionHeader
            image={cover}
            title="Liked Songs"
            meta={`${favorites.length} ${favorites.length === 1 ? 'song' : 'songs'}`}
            onPlay={() => playSongList(favorites, 0)}
            onShuffle={() => playSongList(favorites, 0, { shuffle: true })}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="heart-outline"
            title="No liked songs yet"
            subtitle="Tap the heart on any song to save it here."
          />
        }
        renderItem={({ item, index }) => (
          <SongRow song={item} onPress={() => playSongList(favorites, index)} />
        )}
      />
    </View>
  );
}
