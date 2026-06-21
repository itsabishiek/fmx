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
import type { AppCard, AppSong } from '@/api/types';
import { AppText } from '@/components/AppText';
import { Artwork } from '@/components/Artwork';
import { HorizontalShelf } from '@/components/HorizontalShelf';
import { MediaCard, navigateToCard } from '@/components/MediaCard';
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
import { useHistoryStore, type RecentSearchItem } from '@/store/historyStore';
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
  const addSearch = useHistoryStore((s) => s.addSearch);
  const recentSearchItems = useHistoryStore((s) => s.recentSearchItems);
  const clearSearchItems = useHistoryStore((s) => s.clearSearchItems);

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
        <RecentTaps items={recentSearchItems} onClear={clearSearchItems} />
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

const TYPE_LABEL: Record<AppCard['type'], string> = {
  song: 'Song',
  album: 'Album',
  artist: 'Artist',
  playlist: 'Playlist',
};

/** Search landing: the songs/albums/artists/playlists the user recently opened from Search. */
function RecentTaps({ items, onClear }: { items: RecentSearchItem[]; onClear: () => void }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon="search-outline"
        title="Find your next favorite"
        subtitle="Search for songs, artists, albums and playlists — what you open shows up here."
      />
    );
  }
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: layout.scrollBottomPad }}>
      <View style={styles.recentHeader}>
        <AppText variant="title3">Recently Opened</AppText>
        <Pressable onPress={onClear} hitSlop={8}>
          <AppText variant="callout" color="accent">
            Clear
          </AppText>
        </Pressable>
      </View>
      {items.map((it) =>
        it.kind === 'song' ? (
          <SongRow key={`song-${it.song.id}`} song={it.song} onPress={() => playSong(it.song)} />
        ) : (
          <Pressable
            key={`${it.card.type}-${it.card.id}`}
            style={styles.itemRow}
            onPress={() => navigateToCard(it.card)}>
            <Artwork uri={it.card.image} size={48} round={it.card.round} rounded="sm" />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <AppText variant="body" numberOfLines={1}>
                {it.card.title}
              </AppText>
              <AppText variant="subhead" color="secondary" numberOfLines={1}>
                {it.card.subtitle || TYPE_LABEL[it.card.type]}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.textTertiary} />
          </Pressable>
        ),
      )}
    </ScrollView>
  );
}

function TopResults({ query }: { query: string }) {
  const songs = useSearchSongs(query);
  const global = useGlobalSearch(query);
  const addSearchItem = useHistoryStore((s) => s.addSearchItem);
  const recordCard = (card: AppCard) => addSearchItem({ kind: 'card', card });
  const songItems: AppSong[] = useMemo(
    () => (songs.data?.pages.flatMap((p) => p.items) ?? []).slice(0, 12),
    [songs.data],
  );

  if (songs.isLoading && global.isLoading) return <Loading />;

  return (
    <ScrollView contentContainerStyle={{ paddingTop: spacing.base, paddingBottom: layout.scrollBottomPad }}>
      <SongShelf
        title="Songs"
        songs={songItems}
        playSingle
        onItemPress={(song) => addSearchItem({ kind: 'song', song })}
      />
      <HorizontalShelf title="Artists" items={global.data?.artists ?? []} cardSize={130} onItemPress={recordCard} />
      <HorizontalShelf title="Albums" items={global.data?.albums ?? []} onItemPress={recordCard} />
      <HorizontalShelf title="Playlists" items={global.data?.playlists ?? []} onItemPress={recordCard} />
    </ScrollView>
  );
}

function SongResults({ query }: { query: string }) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useSearchSongs(query);
  const addSearchItem = useHistoryStore((s) => s.addSearchItem);
  const items = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);

  if (isLoading) return <Loading />;
  if (items.length === 0) return <EmptyState title="No songs found" />;

  return (
    <FlatList
      data={items}
      keyExtractor={(item, i) => `${item.id}-${i}`}
      contentContainerStyle={{ paddingBottom: layout.scrollBottomPad }}
      renderItem={({ item }) => (
        <SongRow
          song={item}
          onPress={() => {
            addSearchItem({ kind: 'song', song: item });
            playSong(item);
          }}
        />
      )}
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
  const addSearchItem = useHistoryStore((s) => s.addSearchItem);
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
      renderItem={({ item }) => (
        <MediaCard
          item={item}
          size={CARD}
          onPress={() => {
            addSearchItem({ kind: 'card', card: item });
            navigateToCard(item);
          }}
        />
      )}
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
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
});
