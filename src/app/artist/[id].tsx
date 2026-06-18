import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { AppCard } from '@/api/types';
import { AppText } from '@/components/AppText';
import { BackButton, CollectionHeader } from '@/components/CollectionHeader';
import { HorizontalShelf, SectionHeader } from '@/components/HorizontalShelf';
import { SongRow } from '@/components/SongRow';
import { Loading, ErrorState } from '@/components/states';
import { useArtist } from '@/hooks/queries';
import { playSongList } from '@/player/controls';
import { useLibraryStore } from '@/store/libraryStore';
import { layout, palette, spacing } from '@/theme';

function formatFollowers(n?: number) {
  if (!n) return undefined;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M followers`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K followers`;
  return `${n} followers`;
}

export default function ArtistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: artist, isLoading, isError, refetch } = useArtist(id);
  const { isSaved, toggleSaved } = useLibraryStore();

  if (isLoading) return <Loading />;
  if (isError || !artist) return <ErrorState onRetry={refetch} />;

  const card: AppCard = {
    id: artist.id,
    type: 'artist',
    title: artist.name,
    image: artist.image,
    round: true,
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <BackButton />
      <ScrollView
        contentContainerStyle={{ paddingBottom: layout.scrollBottomPad }}
        showsVerticalScrollIndicator={false}>
        <CollectionHeader
          image={artist.image}
          title={artist.name}
          round
          meta={formatFollowers(artist.followerCount)}
          onPlay={() => playSongList(artist.topSongs, 0)}
          onShuffle={() => playSongList(artist.topSongs, 0, { shuffle: true })}
          saved={isSaved(artist.id)}
          onToggleSave={() => toggleSaved(card)}
        />

        {artist.topSongs.length > 0 ? (
          <View style={{ marginBottom: spacing.xl }}>
            <SectionHeader title="Top Songs" />
            {artist.topSongs.slice(0, 10).map((song, index) => (
              <SongRow
                key={song.id}
                song={song}
                onPress={() => playSongList(artist.topSongs, index)}
              />
            ))}
          </View>
        ) : null}

        <HorizontalShelf title="Albums" items={artist.topAlbums} />
        <HorizontalShelf title="Singles" items={artist.singles} cardSize={140} />

        {artist.bio ? (
          <View style={styles.bio}>
            <SectionHeader title="About" />
            <AppText variant="body" color="secondary" style={{ paddingHorizontal: spacing.base, lineHeight: 22 }}>
              {artist.bio}
            </AppText>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bio: { marginTop: spacing.sm },
});
