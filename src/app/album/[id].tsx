import { useLocalSearchParams } from 'expo-router';
import { FlatList, View } from 'react-native';
import type { AppCard } from '@/api/types';
import { BackButton, CollectionHeader } from '@/components/CollectionHeader';
import { SongRow } from '@/components/SongRow';
import { Loading, ErrorState } from '@/components/states';
import { useAlbum } from '@/hooks/queries';
import { playSongList } from '@/player/controls';
import { useLibraryStore } from '@/store/libraryStore';
import { layout, palette } from '@/theme';

export default function AlbumScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: album, isLoading, isError, refetch } = useAlbum(id);
  const { isSaved, toggleSaved } = useLibraryStore();

  if (isLoading) return <Loading />;
  if (isError || !album) return <ErrorState onRetry={refetch} />;

  const card: AppCard = {
    id: album.id,
    type: 'album',
    title: album.title,
    subtitle: album.subtitle,
    image: album.image,
  };
  const meta = [album.year, album.songCount ? `${album.songCount} songs` : null]
    .filter(Boolean)
    .join('  ·  ');

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <BackButton />
      <FlatList
        data={album.songs}
        keyExtractor={(item, i) => `${item.id}-${i}`}
        contentContainerStyle={{ paddingBottom: layout.scrollBottomPad }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <CollectionHeader
            image={album.image}
            title={album.title}
            subtitle={album.subtitle}
            meta={meta || undefined}
            onPlay={() => playSongList(album.songs, 0)}
            onShuffle={() => playSongList(album.songs, 0, { shuffle: true })}
            saved={isSaved(album.id)}
            onToggleSave={() => toggleSaved(card)}
          />
        }
        renderItem={({ item, index }) => (
          <SongRow
            song={item}
            index={index}
            showArtwork={false}
            onPress={() => playSongList(album.songs, index)}
          />
        )}
      />
    </View>
  );
}
