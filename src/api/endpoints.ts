import { apiGet, apiGetFrom, API_BASE, FALLBACK_API_BASE } from './client';
import { CTX, SEARCH_FILTER, ytPost } from './innertube/client';
import { parseSongSearch } from './innertube/parsers';
import {
  decodeEntities,
  normalizeAlbum,
  normalizeAlbumCard,
  normalizeArtist,
  normalizeArtistCard,
  normalizePlaylist,
  normalizePlaylistCard,
  normalizeSong,
  normalizeSongs,
} from './normalize';
import type {
  AppAlbum,
  AppArtist,
  AppCard,
  AppPlaylist,
  AppSong,
  GlobalSearchResponse,
  RawAlbum,
  RawArtist,
  RawPlaylist,
  RawSong,
  SearchListResponse,
} from './types';

// ---- Search --------------------------------------------------------------

export interface GlobalSearch {
  topQuery: AppCard[];
  songs: AppCard[];
  albums: AppCard[];
  artists: AppCard[];
  playlists: AppCard[];
}

function globalItemToCard(item: GlobalSearchResponse['songs']['results'][number]): AppCard {
  const type = (item.type as AppCard['type']) ?? 'song';
  return {
    id: item.id,
    type,
    title: decodeEntities(item.title),
    subtitle: decodeEntities(item.description) || undefined,
    image: item.image?.[item.image.length - 1]?.url?.replace(/^http:/, 'https:') ?? '',
    round: type === 'artist',
  };
}

export async function searchAll(query: string, signal?: AbortSignal): Promise<GlobalSearch> {
  const data = await apiGet<GlobalSearchResponse>('/search', { query }, signal);
  return {
    topQuery: (data.topQuery?.results ?? []).map(globalItemToCard),
    songs: (data.songs?.results ?? []).map(globalItemToCard),
    albums: (data.albums?.results ?? []).map(globalItemToCard),
    artists: (data.artists?.results ?? []).map(globalItemToCard),
    playlists: (data.playlists?.results ?? []).map(globalItemToCard),
  };
}

export async function searchSongs(query: string, page = 0, limit = 20, signal?: AbortSignal) {
  // YouTube Music song search (one "Songs" shelf, ~20 results). Pagination via continuations is a
  // Phase-2 follow-up, so pages beyond the first return empty (the infinite query then stops).
  if (page > 0) return { total: 0, items: [] as AppSong[] };
  const json = await ytPost<any>('search', { query, params: SEARCH_FILTER.songs }, CTX.webRemix, { signal });
  const { items } = parseSongSearch(json);
  return { total: items.length, items };
}

export async function searchAlbums(query: string, page = 0, limit = 20, signal?: AbortSignal) {
  const data = await apiGet<SearchListResponse<RawAlbum>>(
    '/search/albums',
    { query, page, limit },
    signal,
  );
  return { total: data.total, items: data.results.map(normalizeAlbumCard) };
}

export async function searchArtists(query: string, page = 0, limit = 20, signal?: AbortSignal) {
  const data = await apiGet<SearchListResponse<{ id: string; name: string; image: RawArtist['image'] }>>(
    '/search/artists',
    { query, page, limit },
    signal,
  );
  return { total: data.total, items: data.results.map(normalizeArtistCard) };
}

export async function searchPlaylists(query: string, page = 0, limit = 20, signal?: AbortSignal) {
  const data = await apiGet<SearchListResponse<RawPlaylist>>(
    '/search/playlists',
    { query, page, limit },
    signal,
  );
  return { total: data.total, items: data.results.map(normalizePlaylistCard) };
}

// ---- Songs ---------------------------------------------------------------

export async function getSong(id: string, signal?: AbortSignal): Promise<AppSong | null> {
  const data = await apiGet<RawSong[]>(`/songs/${id}`, undefined, signal);
  // Return null (not undefined) so React Query accepts the result.
  return data?.[0] ? normalizeSong(data[0]) : null;
}

export async function getSongSuggestions(
  id: string,
  limit = 20,
  signal?: AbortSignal,
): Promise<AppSong[]> {
  try {
    const data = await apiGet<RawSong[]>(`/songs/${id}/suggestions`, { limit }, signal);
    return normalizeSongs(data);
  } catch {
    // Suggestions are best-effort (some tracks have none) — never fail playback over it.
    return [];
  }
}

export interface Lyrics {
  lyrics: string;
  snippet?: string;
  copyright?: string;
}

export async function getLyrics(id: string, signal?: AbortSignal): Promise<Lyrics | null> {
  // The primary host (saavn.sumit.co) doesn't implement lyrics (404), so try it then the
  // fallback host. Either may be unavailable — always resolve to `null` (never `undefined`,
  // which React Query rejects, and never throw, which would surface a console error).
  for (const base of [API_BASE, FALLBACK_API_BASE]) {
    try {
      const data = await apiGetFrom<Lyrics>(base, `/songs/${id}/lyrics`, undefined, signal);
      if (data?.lyrics) return data;
    } catch {
      // host unavailable or no lyrics here — try the next one
    }
  }
  return null;
}

// ---- Albums / Artists / Playlists ---------------------------------------

export async function getAlbum(id: string, signal?: AbortSignal): Promise<AppAlbum> {
  const data = await apiGet<RawAlbum>('/albums', { id }, signal);
  return normalizeAlbum(data);
}

export async function getArtist(id: string, signal?: AbortSignal): Promise<AppArtist> {
  const data = await apiGet<RawArtist>(`/artists/${id}`, { songCount: 20, albumCount: 20 }, signal);
  return normalizeArtist(data);
}

export async function getPlaylist(
  id: string,
  page = 0,
  limit = 50,
  signal?: AbortSignal,
): Promise<AppPlaylist> {
  const data = await apiGet<RawPlaylist>('/playlists', { id, page, limit }, signal);
  return normalizePlaylist(data);
}
