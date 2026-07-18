import { bumpThumb, collect, CTX, SEARCH_FILTER, ytPost } from './innertube/client';
import {
  getCarousels,
  getGridItems,
  itemToCard,
  itemToSong,
  parseAlbum,
  parseArtist,
  parseCardSearch,
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

// Relevance re-ranking: YouTube sometimes ranks a remix/cover above the canonical result, so gently
// promote the closest title match while keeping YouTube's order for ties.
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[([].*?[)\]]/g, ' ') // drop "(From …)", "[…]" qualifiers
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function relevance(nq: string, title: string): number {
  if (!nq) return 0;
  const nt = normalize(title);
  if (nt === nq) return 100;
  if (nt.startsWith(nq)) return 80;
  const qtok = nq.split(' ').filter(Boolean);
  const ttok = new Set(nt.split(' ').filter(Boolean));
  const present = qtok.filter((w) => ttok.has(w)).length;
  if (qtok.length && present === qtok.length) return 60;
  return qtok.length ? (present / qtok.length) * 40 : 0;
}
function rankByQuery<T extends { title: string }>(query: string, items: T[]): T[] {
  const nq = normalize(query);
  return items
    .map((item, i) => ({ item, i, score: relevance(nq, item.title) }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((x) => x.item);
}

async function searchCards(query: string, filter: string, signal?: AbortSignal) {
  const json = await ytPost<any>('search', { query, params: filter }, CTX.webRemix, { signal });
  const { items, continuation } = parseCardSearch(json);
  return { items: rankByQuery(query, items), continuation };
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
  const ranked = rankByQuery(query, items);
  return { total: ranked.length, items: ranked };
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

export interface HomeData {
  hero: AppCard[];
  trending: AppSong[];
  sections: { key: string; title: string; items: AppCard[] }[];
}

/**
 * Rich home feed aggregated from several YouTube Music browse surfaces (home is sparse on its own):
 * FEmusic_home (Top Picks + popular), FEmusic_explore (trending songs + new albums),
 * FEmusic_charts (top artists), FEmusic_new_releases_albums (new-release album grid). Each source
 * fails soft so one outage never blanks the page.
 */
export async function getHome(signal?: AbortSignal): Promise<HomeData> {
  const b = (browseId: string) =>
    ytPost<any>('browse', { browseId }, CTX.webRemix, { signal }).catch(() => null);
  const [home, explore, charts, releases] = await Promise.all([
    b('FEmusic_home'),
    b('FEmusic_explore'),
    b('FEmusic_charts'),
    b('FEmusic_new_releases_albums'),
  ]);

  type Car = { title: string; contents: any[] };
  const homeCars: Car[] = home ? getCarousels(home) : [];
  const exploreCars: Car[] = explore ? getCarousels(explore) : [];
  const chartsCars: Car[] = charts ? getCarousels(charts) : [];
  const find = (cars: Car[], kw: string) => cars.find((c) => c.title.toLowerCase().includes(kw));
  const cardsOf = (c?: Car) => (c?.contents ?? []).map(itemToCard).filter((x): x is AppCard => !!x);
  const songsOf = (c?: Car) => (c?.contents ?? []).map(itemToSong).filter((x): x is AppSong => !!x);

  const hero = cardsOf(homeCars[0]).slice(0, 12);
  const trending = songsOf(find(exploreCars, 'trending')).slice(0, 15);

  const sections: HomeData['sections'] = [];
  const push = (title: string, items: AppCard[]) => {
    if (items.length) sections.push({ key: title, title, items: items.slice(0, 20) });
  };
  push('New Albums & Singles', cardsOf(find(exploreCars, 'new album')));
  push(
    'New Releases',
    (releases ? getGridItems(releases) : []).map(itemToCard).filter((x): x is AppCard => !!x).slice(0, 18),
  );
  if (homeCars[1]) push(homeCars[1].title || 'Popular', cardsOf(homeCars[1]));
  push('Top Artists', cardsOf(find(chartsCars, 'top artist')));

  return { hero, trending, sections };
}
