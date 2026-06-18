import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AppSong } from '@/api/types';
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
  // Each data source is independent — the screen renders immediately and sections fill in as they
  // resolve, instead of one slow query (the curated feed) gating the whole page.
  const feed = useHomeFeed();
  const recentlyPlayed = useHistoryStore((s) => s.recentlyPlayed);
  const { madeForYou, shelves } = useRecommendations();
  const topArtist = useHistoryStore((s) => s.topArtists)(1)[0];
  const { data: artist } = useArtist(topArtist?.id);
  const moreFromArtist = artist ? playableSongs(artist.topSongs) : [];

  // Cross-section de-dup: reserve songs for the most specific shelf first (an artist's own shelf,
  // then per-seed radios), so "Made For You" never repeats what's already shown elsewhere.
  const seen = new Set<string>();
  const dedupe = (songs: AppSong[]) => {
    const out: AppSong[] = [];
    for (const s of songs) {
      if (seen.has(s.id)) continue;
      seen.add(s.id);
      out.push(s);
    }
    return out;
  };
  const moreFrom = dedupe(moreFromArtist);
  const becauseShelves = shelves
    .map((sh) => ({ seed: sh.seed, songs: dedupe(sh.songs) }))
    .filter((sh) => sh.songs.length >= 4);
  const made = dedupe(madeForYou);

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

      {made.length > 0 ? (
        <SongShelf title="Made For You" subtitle="Based on your listening" songs={made} />
      ) : null}

      {becauseShelves.map((shelf) => (
        <SongShelf
          key={shelf.seed.id}
          title={`Because you listened to ${shelf.seed.title}`}
          songs={shelf.songs}
        />
      ))}

      {moreFrom.length > 0 ? (
        <SongShelf title={`More from ${topArtist.name}`} songs={moreFrom} />
      ) : null}

      {/* Curated feed — fills in independently; its slowness no longer blocks the page. */}
      {feed.data ? (
        <>
          <HorizontalShelf title="Top Picks" items={feed.data.hero} cardSize={220} />
          {feed.data.sections.map((section) => (
            <HorizontalShelf key={section.key} title={section.title} items={section.items} />
          ))}
        </>
      ) : feed.isLoading ? (
        <View style={styles.feedState}>
          <Loading label="Loading your music…" />
        </View>
      ) : feed.isError ? (
        <View style={styles.feedState}>
          <ErrorState onRetry={feed.refetch} />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.base, marginBottom: spacing.lg },
  feedState: { height: 260 },
});
