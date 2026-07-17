import { bumpThumb, collect, CTX, SEARCH_FILTER, ytPost } from './innertube/client';
import {
  parseAlbum,
  parseArtist,
  parseCardSearch,
  parseHome,
  parsePlaylist,
  parseRadio,
  parseSongSearch,
} from './innertube/parsers';
import type { AppAlbum, AppArtist, AppCard, AppPlaylist, AppSong } from './types';

// ---- Search --------------------------------------------------------------

export interface GlobalSearch {
  topQuery: AppCard[];
  songs: AppCard[];
  albums: AppCard[];
  artists: AppCard[];
  playlists: AppCard[];
}

async function searchCards(query: string, filter: string, signal?: AbortSignal) {
  const json = await ytPost<any>('search', { query, params: filter }, CTX.webRemix, { signal });
  return parseCardSearch(json);
}

/** Top tab: albums/artists/playlists (songs come from the paginated `searchSongs`). */
export async function searchAll(query: string, signal?: AbortSignal): Promise<GlobalSearch> {
  const safe = (f: string) => searchCards(query, f, signal).then((r) => r.items).catch(() => [] as AppCard[]);
  const [albums, artists, playlists] = await Promise.all([
    safe(SEARCH_FILTER.albums),
    safe(SEARCH_FILTER.artists),
    safe(SEARCH_FILTER.playlists),
  ]);
  return {
    topQuery: [],
    songs: [],
    albums: albums.slice(0, 10),
    artists: artists.slice(0, 10),
    playlists: playlists.slice(0, 10),
  };
}

export async function searchSongs(query: string, page = 0, limit = 20, signal?: AbortSignal) {
  // YouTube Music returns one "Songs" shelf (~20). Pagination via continuations is a follow-up;
  // pages beyond the first return empty so the infinite query stops.
  if (page > 0) return { total: 0, items: [] as AppSong[] };
  const json = await ytPost<any>('search', { query, params: SEARCH_FILTER.songs }, CTX.webRemix, { signal });
  const { items } = parseSongSearch(json);
  return { total: items.length, items };
}

export async function searchAlbums(query: string, page = 0, limit = 20, signal?: AbortSignal) {
  if (page > 0) return { total: 0, items: [] as AppCard[] };
  const { items } = await searchCards(query, SEARCH_FILTER.albums, signal);
  return { total: items.length, items };
}

export async function searchArtists(query: string, page = 0, limit = 20, signal?: AbortSignal) {
  if (page > 0) return { total: 0, items: [] as AppCard[] };
  const { items } = await searchCards(query, SEARCH_FILTER.artists, signal);
  return { total: items.length, items };
}

export async function searchPlaylists(query: string, page = 0, limit = 20, signal?: AbortSignal) {
  if (page > 0) return { total: 0, items: [] as AppCard[] };
  const { items } = await searchCards(query, SEARCH_FILTER.playlists, signal);
  return { total: items.length, items };
}

// ---- Songs ---------------------------------------------------------------

export async function getSong(id: string, signal?: AbortSignal): Promise<AppSong | null> {
  try {
    const j = await ytPost<any>('player', { videoId: id, contentCheckOk: true, racyCheckOk: true }, CTX.ios, {
      signal,
    });
    const d = j?.videoDetails;
    if (!d) return null;
    const thumbs = collect<any[]>(d, 'thumbnails')[0] ?? [];
    const raw = thumbs[thumbs.length - 1]?.url;
    return {
      id,
      title: d.title ?? '',
      artistName: d.author ?? '',
      artwork: bumpThumb(raw, 544),
      artworkSmall: bumpThumb(raw, 120),
      duration: parseInt(d.lengthSeconds, 10) || 0,
      hasLyrics: false,
      downloadUrls: [],
    };
  } catch {
    return null;
  }
}

/** Autoplay/radio seeded from a track (YouTube Music `next`), excluding the seed itself. */
export async function getSongSuggestions(id: string, limit = 20, signal?: AbortSignal): Promise<AppSong[]> {
  try {
    const json = await ytPost<any>('next', { videoId: id, playlistId: `RDAMVM${id}` }, CTX.webRemix, { signal });
    return parseRadio(json, id).slice(0, limit);
  } catch {
    return [];
  }
}

// ---- Lyrics (LRCLIB — reliable, no key) ----------------------------------

export interface Lyrics {
  lyrics: string;
}

export async function getLyrics(
  opts: { title: string; artist: string; duration?: number },
  signal?: AbortSignal,
): Promise<Lyrics | null> {
  try {
    const params = new URLSearchParams({ track_name: opts.title, artist_name: opts.artist });
    const res = await fetch(`https://lrclib.net/api/search?${params.toString()}`, { signal });
    if (!res.ok) return null;
    const arr = (await res.json()) as { plainLyrics?: string; syncedLyrics?: string }[];
    if (!Array.isArray(arr)) return null;
    const best = arr.find((x) => x.plainLyrics) ?? arr.find((x) => x.syncedLyrics);
    if (!best) return null;
    const raw = best.plainLyrics ?? (best.syncedLyrics ?? '').replace(/\[\d+:\d+(\.\d+)?\]\s?/g, '');
    return raw.trim() ? { lyrics: raw } : null;
  } catch {
    return null;
  }
}

// ---- Albums / Artists / Playlists / Home (InnerTube browse) --------------

export async function getAlbum(id: string, signal?: AbortSignal): Promise<AppAlbum> {
  const json = await ytPost<any>('browse', { browseId: id }, CTX.webRemix, { signal });
  return parseAlbum(json, id);
}

export async function getArtist(id: string, signal?: AbortSignal): Promise<AppArtist> {
  const json = await ytPost<any>('browse', { browseId: id }, CTX.webRemix, { signal });
  return parseArtist(json, id);
}

export async function getPlaylist(
  id: string,
  page = 0,
  limit = 50,
  signal?: AbortSignal,
): Promise<AppPlaylist> {
  const browseId = id.startsWith('VL') ? id : `VL${id}`;
  const json = await ytPost<any>('browse', { browseId }, CTX.webRemix, { signal });
  return parsePlaylist(json, id);
}

/** Home feed carousels from YouTube Music (`FEmusic_home`). */
export async function getHome(signal?: AbortSignal): Promise<{ title: string; items: AppCard[] }[]> {
  const json = await ytPost<any>('browse', { browseId: 'FEmusic_home' }, CTX.webRemix, { signal });
  return parseHome(json);
}
