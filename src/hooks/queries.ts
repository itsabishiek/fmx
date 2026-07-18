import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  getAlbum,
  getArtist,
  getHome,
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
import type { AppCard, AppSong } from '@/api/types';

const STALE = 1000 * 60 * 10; // 10 min

// ---- Home feed -----------------------------------------------------------

export interface HomeFeed {
  hero: AppCard[];
  trending: AppSong[];
  sections: { key: string; title: string; items: AppCard[] }[];
}

export function useHomeFeed() {
  return useQuery<HomeFeed>({
    queryKey: ['home-feed'],
    staleTime: STALE,
    queryFn: ({ signal }) => getHome(signal),
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

export function useLyrics(song?: AppSong | null, enabled = true) {
  return useQuery({
    queryKey: ['lyrics', song?.id],
    enabled: !!song && enabled,
    staleTime: STALE,
    queryFn: ({ signal }) =>
      getLyrics({ title: song!.title, artist: song!.artistName, duration: song!.duration }, signal),
  });
}
