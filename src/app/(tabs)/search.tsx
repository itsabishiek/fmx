import { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { AppSong } from '@/api/types';
import { AppText } from '@/components/AppText';
import { HorizontalShelf } from '@/components/HorizontalShelf';
import { MediaCard } from '@/components/MediaCard';
import { SongRow } from '@/components/SongRow';
import { SongShelf } from '@/components/SongShelf';
import { Loading, EmptyState } from '@/components/states';
import {
  useGlobalSearch,
  useSearchAlbums,
  useSearchArtists,
  useSearchPlaylists,
  useSearchSongs,
} from '@/hooks/queries';
import { playSong } from '@/player/controls';
import { useHistoryStore } from '@/store/historyStore';
import { layout, palette, radius, spacing } from '@/theme';

type Tab = 'top' | 'songs' | 'albums' | 'artists' | 'playlists';
const TABS: { key: Tab; label: string }[] = [
  { key: 'top', label: 'Top' },
  { key: 'songs', label: 'Songs' },
  { key: 'albums', label: 'Albums' },
  { key: 'artists', label: 'Artists' },
  { key: 'playlists', label: 'Playlists' },
];

const GAP = spacing.base;
const CARD = (Dimensions.get('window').width - spacing.base * 2 - GAP) / 2;
const PAD_TOP = 8;

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [tab, setTab] = useState<Tab>('top');
  const { recentSearches, addSearch, clearSearches } = useHistoryStore();

  useEffect(() => {
    const t = setTimeout(() => {
      const q = query.trim();
      setDebounced(q);
      if (q.length > 1) addSearch(q);
    }, 400);
    return () => clearTimeout(t);
  }, [query, addSearch]);

  const showResults = debounced.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: palette.background, paddingTop: insets.top + PAD_TOP }}>
      <View style={styles.headerWrap}>
        <AppText variant="largeTitle" style={{ paddingHorizontal: spacing.base }}>
          Search
        </AppText>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={palette.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Songs, artists, albums…"
            placeholderTextColor={palette.textTertiary}
            style={styles.input}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={palette.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        {showResults ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabs}>
            {TABS.map((t) => (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key)}
                style={[styles.tabPill, tab === t.key && styles.tabPillActive]}>
                <AppText
                  variant="callout"
                  style={{ color: tab === t.key ? palette.textOnAccent : palette.textSecondary }}>
                  {t.label}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
      </View>

      {!showResults ? (
        <RecentSearches recent={recentSearches} onPick={setQuery} onClear={clearSearches} />
      ) : tab === 'top' ? (
        <TopResults query={debounced} />
      ) : tab === 'songs' ? (
        <SongResults query={debounced} />
      ) : (
        <CardGrid query={debounced} kind={tab} />
      )}
    </View>
  );
}

function RecentSearches({
  recent,
  onPick,
  onClear,
}: {
  recent: string[];
  onPick: (q: string) => void;
  onClear: () => void;
}) {
  if (recent.length === 0) {
    return (
      <EmptyState
        icon="search-outline"
        title="Find your next favorite"
        subtitle="Search for songs, artists, albums and playlists."
      />
    );
  }
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: layout.scrollBottomPad }}>
      <View style={styles.recentHeader}>
        <AppText variant="title3">Recent Searches</AppText>
        <Pressable onPress={onClear} hitSlop={8}>
          <AppText variant="callout" color="accent">
            Clear
          </AppText>
        </Pressable>
      </View>
      {recent.map((q) => (
        <Pressable key={q} style={styles.recentRow} onPress={() => onPick(q)}>
          <Ionicons name="time-outline" size={20} color={palette.textSecondary} />
          <AppText variant="body" style={{ flex: 1 }}>
            {q}
          </AppText>
          <Ionicons name="arrow-up-outline" size={18} color={palette.textTertiary} style={styles.diagonal} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

function TopResults({ query }: { query: string }) {
  const songs = useSearchSongs(query);
  const global = useGlobalSearch(query);
  const songItems: AppSong[] = useMemo(
    () => (songs.data?.pages.flatMap((p) => p.items) ?? []).slice(0, 12),
    [songs.data],
  );

  if (songs.isLoading && global.isLoading) return <Loading />;

  return (
    <ScrollView contentContainerStyle={{ paddingTop: spacing.base, paddingBottom: layout.scrollBottomPad }}>
      <SongShelf title="Songs" songs={songItems} playSingle />
      <HorizontalShelf title="Artists" items={global.data?.artists ?? []} cardSize={130} />
      <HorizontalShelf title="Albums" items={global.data?.albums ?? []} />
      <HorizontalShelf title="Playlists" items={global.data?.playlists ?? []} />
    </ScrollView>
  );
}

function SongResults({ query }: { query: string }) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useSearchSongs(query);
  const items = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);

  if (isLoading) return <Loading />;
  if (items.length === 0) return <EmptyState title="No songs found" />;

  return (
    <FlatList
      data={items}
      keyExtractor={(item, i) => `${item.id}-${i}`}
      contentContainerStyle={{ paddingBottom: layout.scrollBottomPad }}
      renderItem={({ item }) => <SongRow song={item} onPress={() => playSong(item)} />}
      onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={false}
    />
  );
}

function CardGrid({ query, kind }: { query: string; kind: 'albums' | 'artists' | 'playlists' }) {
  const albums = useSearchAlbums(query);
  const artists = useSearchArtists(query);
  const playlists = useSearchPlaylists(query);
  const q = kind === 'albums' ? albums : kind === 'artists' ? artists : playlists;
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);

  if (q.isLoading) return <Loading />;
  if (items.length === 0) return <EmptyState title={`No ${kind} found`} />;

  return (
    <FlatList
      data={items}
      numColumns={2}
      keyExtractor={(item, i) => `${item.id}-${i}`}
      columnWrapperStyle={{ gap: GAP, paddingHorizontal: spacing.base }}
      contentContainerStyle={{ paddingTop: spacing.base, paddingBottom: layout.scrollBottomPad, gap: spacing.lg }}
      renderItem={({ item }) => <MediaCard item={item} size={CARD} />}
      onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  headerWrap: { paddingBottom: spacing.sm },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.surface,
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    height: 42,
  },
  input: { flex: 1, color: palette.textPrimary, fontSize: 16 },
  tabs: { gap: spacing.sm, paddingHorizontal: spacing.base, paddingTop: spacing.md },
  tabPill: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: palette.surface,
  },
  tabPillActive: { backgroundColor: palette.accent },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  diagonal: { transform: [{ rotate: '45deg' }] },
});
