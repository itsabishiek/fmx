import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSongSuggestions, searchSongs } from '@/api/endpoints';
import type { AppSong } from '@/api/types';
import { playableSongs } from '@/player/track';
import { useHistoryStore } from '@/store/historyStore';
import { useLibraryStore } from '@/store/libraryStore';

const STALE = 1000 * 60 * 10; // 10 min
const MAX_SEEDS = 5;
const SUGGESTIONS_PER_SEED = 15;

export interface BecauseShelf {
  seed: AppSong;
  songs: AppSong[];
}

export interface Recommendations {
  /** Aggregated, de-duplicated, freshly-ranked picks. */
  madeForYou: AppSong[];
  /** Per-seed "Because you listened to {seed.title}" shelves (top seeds). */
  shelves: BecauseShelf[];
}

/**
 * Choose up to {@link MAX_SEEDS} seed songs with **distinct primary artists** for diversity.
 * Priority: explicit favorites first, then recently-played ordered by how much the user plays
 * that artist (affinity), so the strongest tastes seed the radio.
 */
export function pickSeeds(
  favorites: AppSong[],
  recentlyPlayed: AppSong[],
  artistPlays: Record<string, { name: string; count: number }>,
  max = MAX_SEEDS,
): AppSong[] {
  const affinity = (s: AppSong) => (s.artistId ? (artistPlays[s.artistId]?.count ?? 0) : 0);
  const recentsByAffinity = [...recentlyPlayed].sort((a, b) => affinity(b) - affinity(a));

  const ordered: AppSong[] = [];
  const seenSong = new Set<string>();
  for (const s of [...favorites, ...recentsByAffinity]) {
    if (seenSong.has(s.id)) continue;
    seenSong.add(s.id);
    ordered.push(s);
  }

  const seeds: AppSong[] = [];
  const seenArtist = new Set<string>();
  for (const s of ordered) {
    const key = s.artistId ?? s.id; // songs without an artist id stay individually distinct
    if (seenArtist.has(key)) continue;
    seenArtist.add(key);
    seeds.push(s);
    if (seeds.length >= max) break;
  }
  return seeds;
}

/**
 * Merge per-seed suggestion lists into one ranked list. A song suggested by more seeds ranks higher
 * (agreement = stronger signal); a small boost is added when it matches the user's dominant language.
 * Anything in `exclude` (already played / liked / a seed) is dropped, as are songs with no stream URL.
 */
export function aggregateSuggestions(
  lists: AppSong[][],
  exclude: Set<string>,
  dominantLanguage?: string,
): AppSong[] {
  const map = new Map<string, { song: AppSong; count: number }>();
  for (const list of lists) {
    const seenInList = new Set<string>();
    for (const song of list) {
      if (exclude.has(song.id) || seenInList.has(song.id)) continue;
      seenInList.add(song.id);
      const entry = map.get(song.id);
      if (entry) entry.count += 1;
      else map.set(song.id, { song, count: 1 });
    }
  }
  const scored = [...map.values()]
    .map(({ song, count }) => ({
      song,
      score: count + (dominantLanguage && song.language === dominantLanguage ? 0.5 : 0),
    }))
    .sort((a, b) => b.score - a.score);
  return playableSongs(scored.map((x) => x.song));
}

/**
 * Resilient fallback for when the `/suggestions` radio is unavailable (e.g. the endpoint
 * 500s, as it sometimes does upstream). A single dominant-language `/search` keeps "Made For
 * You" full with varied artists — fast and robust on flaky networks, and naturally distinct
 * from the "More from {top artist}" shelf (which covers the user's #1 artist separately).
 */
async function fallbackRecommendations(
  query: string | undefined,
  exclude: Set<string>,
  signal?: AbortSignal,
): Promise<AppSong[]> {
  if (!query) return [];
  try {
    const { items } = await searchSongs(query, 0, 30, signal);
    const seen = new Set<string>();
    return playableSongs(items).filter((s) => {
      if (exclude.has(s.id) || seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  } catch {
    return [];
  }
}

/**
 * Client-only recommendations built on the saavn `/songs/{id}/suggestions` radio:
 * multi-seed → aggregate → personalize, with a graceful fallback to /artists + /search when
 * the radio is unavailable. Disabled (returns empty) until the user has listening history.
 */
export function useRecommendations(): Recommendations & { isLoading: boolean } {
  const favorites = useLibraryStore((s) => s.favorites);
  const recentlyPlayed = useHistoryStore((s) => s.recentlyPlayed);
  const artistPlays = useHistoryStore((s) => s.artistPlays);
  const dominantLanguage = useHistoryStore((s) => s.dominantLanguage)();
  const topArtists = useHistoryStore((s) => s.topArtists)(3);

  const seeds = useMemo(
    () => pickSeeds(favorites, recentlyPlayed, artistPlays),
    [favorites, recentlyPlayed, artistPlays],
  );
  const seedIds = seeds.map((s) => s.id);

  const query = useQuery<Recommendations>({
    queryKey: ['recommendations', seedIds, dominantLanguage, topArtists.map((a) => a.id)],
    enabled: seeds.length > 0,
    staleTime: STALE,
    queryFn: async ({ signal }) => {
      const lists = await Promise.all(
        seeds.map((s) => getSongSuggestions(s.id, SUGGESTIONS_PER_SEED, signal)),
      );
      const exclude = new Set<string>([
        ...recentlyPlayed.map((s) => s.id),
        ...favorites.map((s) => s.id),
        ...seedIds,
      ]);
      let madeForYou = aggregateSuggestions(lists, exclude, dominantLanguage).slice(0, 20);
      const shelves: BecauseShelf[] = seeds
        .slice(0, 2)
        .map((seed, i) => ({
          seed,
          songs: playableSongs(lists[i].filter((x) => !exclude.has(x.id))).slice(0, 20),
        }))
        .filter((sh) => sh.songs.length >= 4);

      // The radio gave us little/nothing — fall back to healthy endpoints so the shelf still fills.
      if (madeForYou.length < 4) {
        const query = dominantLanguage ?? topArtists[0]?.name;
        madeForYou = (await fallbackRecommendations(query, exclude, signal)).slice(0, 20);
      }
      return { madeForYou, shelves };
    },
  });

  return {
    madeForYou: query.data?.madeForYou ?? [],
    shelves: query.data?.shelves ?? [],
    isLoading: query.isLoading,
  };
}
