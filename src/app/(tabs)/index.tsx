import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { HorizontalShelf } from '@/components/HorizontalShelf';
import { SongShelf } from '@/components/SongShelf';
import { Loading, ErrorState } from '@/components/states';
import { useArtist, useHomeFeed } from '@/hooks/queries';
import { useRecommendations } from '@/hooks/useRecommendations';
import { playableSongs } from '@/player/track';
import { useHistoryStore } from '@/store/historyStore';
import { layout, palette, spacing } from '@/theme';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, refetch } = useHomeFeed();
  const recentlyPlayed = useHistoryStore((s) => s.recentlyPlayed);

  // Client-only recommendations (multi-seed radio) + the user's top artist.
  const { madeForYou, shelves } = useRecommendations();
  const topArtist = useHistoryStore((s) => s.topArtists)(1)[0];
  const { data: artist } = useArtist(topArtist?.id);
  const moreFromArtist = artist ? playableSongs(artist.topSongs) : [];

  if (isLoading) return <Loading label="Loading your music…" />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingBottom: layout.scrollBottomPad }}
      showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <AppText variant="caption" color="secondary">
          {greeting()}
        </AppText>
        <AppText variant="largeTitle">Listen Now</AppText>
      </View>

      {recentlyPlayed.length > 0 ? (
        <SongShelf title="Recently Played" songs={recentlyPlayed} />
      ) : null}

      {madeForYou.length > 0 ? (
        <SongShelf title="Made For You" subtitle="Based on your listening" songs={madeForYou} />
      ) : null}

      {shelves.map((shelf) => (
        <SongShelf
          key={shelf.seed.id}
          title={`Because you listened to ${shelf.seed.title}`}
          songs={shelf.songs}
        />
      ))}

      {moreFromArtist.length > 0 ? (
        <SongShelf title={`More from ${topArtist.name}`} songs={moreFromArtist} />
      ) : null}

      <HorizontalShelf title="Top Picks" items={data.hero} cardSize={220} />

      {data.sections.map((section) => (
        <HorizontalShelf key={section.key} title={section.title} items={section.items} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.base, marginBottom: spacing.lg },
});
