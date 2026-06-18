import { Alert, FlatList, Platform, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { BackButton, CollectionHeader } from '@/components/CollectionHeader';
import { SongRow } from '@/components/SongRow';
import { EmptyState } from '@/components/states';
import { playSongList } from '@/player/controls';
import { useLibraryStore } from '@/store/libraryStore';
import { layout, palette } from '@/theme';

export default function LocalPlaylistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const playlist = useLibraryStore((s) => s.playlists.find((p) => p.id === id));
  const { renamePlaylist, deletePlaylist } = useLibraryStore();

  if (!playlist) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.background }}>
        <BackButton />
        <EmptyState title="Playlist not found" />
      </View>
    );
  }

  const handleRename = () => {
    if (Platform.OS === 'ios' && (Alert as any).prompt) {
      (Alert as any).prompt(
        'Rename Playlist',
        undefined,
        (text: string) => text && renamePlaylist(playlist.id, text),
        'plain-text',
        playlist.name,
      );
    }
  };

  const handleMore = () => {
    Alert.alert(playlist.name, undefined, [
      ...(Platform.OS === 'ios' ? [{ text: 'Rename', onPress: handleRename }] : []),
      {
        text: 'Delete Playlist',
        style: 'destructive' as const,
        onPress: () => {
          deletePlaylist(playlist.id);
          router.back();
        },
      },
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const cover = playlist.songs[0]?.artwork ?? '';

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <BackButton onMore={handleMore} />
      <FlatList
        data={playlist.songs}
        keyExtractor={(item, i) => `${item.id}-${i}`}
        contentContainerStyle={{ paddingBottom: layout.scrollBottomPad }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <CollectionHeader
            image={cover}
            title={playlist.name}
            meta={`${playlist.songs.length} ${playlist.songs.length === 1 ? 'song' : 'songs'}`}
            onPlay={() => playSongList(playlist.songs, 0)}
            onShuffle={() => playSongList(playlist.songs, 0, { shuffle: true })}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="musical-notes-outline"
            title="No songs yet"
            subtitle="Add songs from anywhere using the “…” menu."
          />
        }
        renderItem={({ item, index }) => (
          <SongRow
            song={item}
            playlistId={playlist.id}
            onPress={() => playSongList(playlist.songs, index)}
          />
        )}
      />
    </View>
  );
}
