import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  getAlbum,
  getArtist,
  getLyrics,
  getPlaylist,
  getSong,
  getSongSuggestions,
  searchAlbums,
  searchAll,
  searchArtists,
  searchPlaylists,
  searchSongs,
} from '@/api/endpoints';
import type { AppCard } from '@/api/types';
import { FEED_SECTIONS, HERO_PLAYLIST_IDS } from '@/constants/homeFeed';

const STALE = 1000 * 60 * 10; // 10 min

// ---- Home feed -----------------------------------------------------------

export interface HomeFeed {
  hero: AppCard[];
  sections: { key: string; title: string; items: AppCard[] }[];
}

async function fetchPlaylistCard(id: string): Promise<AppCard | null> {
  try {
    const p = await getPlaylist(id, 0, 1);
    return {
      id: p.id,
      type: 'playlist',
      title: p.title,
      // Note: fetched with limit=1 (just for title/artwork), so songCount isn't the true
      // total — omit it on home cards rather than show a misleading "1 songs".
      subtitle: undefined,
      image: p.image,
    };
  } catch {
    return null;
  }
}

export function useHomeFeed() {
  return useQuery<HomeFeed>({
    queryKey: ['home-feed'],
    staleTime: STALE,
    queryFn: async () => {
      const ids = Array.from(
        new Set([...HERO_PLAYLIST_IDS, ...FEED_SECTIONS.flatMap((s) => s.playlistIds)]),
      );
      const cards = await Promise.all(ids.map(fetchPlaylistCard));
      const byId = new Map<string, AppCard>();
      ids.forEach((id, i) => {
        const c = cards[i];
        if (c) byId.set(id, c);
      });
      const pick = (list: string[]) => list.map((id) => byId.get(id)).filter(Boolean) as AppCard[];
      return {
        hero: pick(HERO_PLAYLIST_IDS),
        sections: FEED_SECTIONS.map((s) => ({
          key: s.key,
          title: s.title,
          items: pick(s.playlistIds),
        })).filter((s) => s.items.length > 0),
      };
    },
  });
}

// ---- Search --------------------------------------------------------------

export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ['search-all', query],
    enabled: query.trim().length > 0,
    staleTime: STALE,
    queryFn: ({ signal }) => searchAll(query, signal),
  });
}

const LIMIT = 20;

function makeInfiniteSearch(
  key: string,
  fetcher: (q: string, page: number, limit: number, signal?: AbortSignal) => Promise<{ total: number; items: any[] }>,
) {
  return (query: string) =>
    useInfiniteQuery({
      queryKey: [key, query],
      enabled: query.trim().length > 0,
      staleTime: STALE,
      initialPageParam: 0,
      queryFn: ({ pageParam, signal }) => fetcher(query, pageParam as number, LIMIT, signal),
      getNextPageParam: (lastPage, pages) => {
        const loaded = pages.reduce((n, p) => n + p.items.length, 0);
        return loaded < lastPage.total ? pages.length : undefined;
      },
    });
}

export const useSearchSongs = makeInfiniteSearch('search-songs', searchSongs);
export const useSearchAlbums = makeInfiniteSearch('search-albums', searchAlbums);
export const useSearchArtists = makeInfiniteSearch('search-artists', searchArtists);
export const useSearchPlaylists = makeInfiniteSearch('search-playlists', searchPlaylists);

// ---- Detail --------------------------------------------------------------

export function useAlbum(id?: string) {
  return useQuery({
    queryKey: ['album', id],
    enabled: !!id,
    staleTime: STALE,
    queryFn: ({ signal }) => getAlbum(id!, signal),
  });
}

export function useArtist(id?: string) {
  return useQuery({
    queryKey: ['artist', id],
    enabled: !!id,
    staleTime: STALE,
    queryFn: ({ signal }) => getArtist(id!, signal),
  });
}

export function usePlaylist(id?: string) {
  return useQuery({
    queryKey: ['playlist', id],
    enabled: !!id,
    staleTime: STALE,
    queryFn: ({ signal }) => getPlaylist(id!, 0, 100, signal),
  });
}

export function useSong(id?: string) {
  return useQuery({
    queryKey: ['song', id],
    enabled: !!id,
    staleTime: STALE,
    queryFn: ({ signal }) => getSong(id!, signal),
  });
}

export function useSuggestions(id?: string) {
  return useQuery({
    queryKey: ['suggestions', id],
    enabled: !!id,
    staleTime: STALE,
    queryFn: ({ signal }) => getSongSuggestions(id!, 20, signal),
  });
}

export function useLyrics(id?: string, enabled = true) {
  return useQuery({
    queryKey: ['lyrics', id],
    enabled: !!id && enabled,
    staleTime: STALE,
    queryFn: ({ signal }) => getLyrics(id!, signal),
  });
}
