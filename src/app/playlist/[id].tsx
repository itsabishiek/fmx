import { useLocalSearchParams } from 'expo-router';
import { FlatList, View } from 'react-native';
import type { AppCard } from '@/api/types';
import { BackButton, CollectionHeader } from '@/components/CollectionHeader';
import { SongRow } from '@/components/SongRow';
import { Loading, ErrorState } from '@/components/states';
import { usePlaylist } from '@/hooks/queries';
import { playSongList } from '@/player/controls';
import { useLibraryStore } from '@/store/libraryStore';
import { layout, palette } from '@/theme';

export default function PlaylistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: playlist, isLoading, isError, refetch } = usePlaylist(id);
  const { isSaved, toggleSaved } = useLibraryStore();

  if (isLoading) return <Loading />;
  if (isError || !playlist) return <ErrorState onRetry={refetch} />;

  const card: AppCard = {
    id: playlist.id,
    type: 'playlist',
    title: playlist.title,
    image: playlist.image,
  };
  const meta = playlist.songCount ? `${playlist.songCount} songs` : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <BackButton />
      <FlatList
        data={playlist.songs}
        keyExtractor={(item, i) => `${item.id}-${i}`}
        contentContainerStyle={{ paddingBottom: layout.scrollBottomPad }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <CollectionHeader
            image={playlist.image}
            title={playlist.title}
            subtitle={playlist.description}
            meta={meta}
            onPlay={() => playSongList(playlist.songs, 0)}
            onShuffle={() => playSongList(playlist.songs, 0, { shuffle: true })}
            saved={isSaved(playlist.id)}
            onToggleSave={() => toggleSaved(card)}
          />
        }
        renderItem={({ item, index }) => (
          <SongRow song={item} onPress={() => playSongList(playlist.songs, index)} />
        )}
      />
    </View>
  );
}
