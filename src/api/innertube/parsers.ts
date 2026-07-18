import type { AppAlbum, AppArtist, AppCard, AppPlaylist, AppSong, CardType } from '../types';
import { bumpThumb, collect, parseDuration } from './client';

interface Run {
  text?: string;
  navigationEndpoint?: {
    browseEndpoint?: {
      browseId?: string;
      browseEndpointContextSupportedConfigs?: {
        browseEndpointContextMusicConfig?: { pageType?: string };
      };
    };
    watchEndpoint?: { videoId?: string };
  };
}

const runsText = (node: any): string => (node?.runs ?? []).map((r: Run) => r?.text ?? '').join('');
const lastThumb = (node: any): string | undefined => {
  const arr = collect<any[]>(node, 'thumbnails')[0] ?? [];
  return arr[arr.length - 1]?.url;
};

function runPageType(run: Run): string | undefined {
  return run?.navigationEndpoint?.browseEndpoint?.browseEndpointContextSupportedConfigs
    ?.browseEndpointContextMusicConfig?.pageType;
}

function typeFromPageType(pt?: string): CardType {
  return pt === 'MUSIC_PAGE_TYPE_ARTIST' ? 'artist' : pt === 'MUSIC_PAGE_TYPE_ALBUM' ? 'album' : 'playlist';
}

// --- songs ----------------------------------------------------------------

/** From a song row's secondary columns: artists (+id), album (+id), duration (s). */
function parseSecondary(runs: Run[]) {
  const artists: { name: string; id?: string }[] = [];
  let albumName: string | undefined;
  let albumId: string | undefined;
  let duration = 0;
  for (const run of runs ?? []) {
    const text = (run?.text ?? '').trim();
    const pt = runPageType(run);
    const bid = run?.navigationEndpoint?.browseEndpoint?.browseId;
    if (pt === 'MUSIC_PAGE_TYPE_ARTIST') artists.push({ name: text, id: bid });
    else if (pt === 'MUSIC_PAGE_TYPE_ALBUM') {
      albumName = text;
      albumId = bid;
    } else if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(text)) duration = parseDuration(text);
  }
  return { artists, albumName, albumId, duration };
}

/**
 * Parse a `musicResponsiveListItemRenderer` song row (search / album / playlist track) → AppSong.
 * Scans both flex and fixed columns so it works across contexts. Null for rows with no videoId.
 */
export function parseSongRow(item: any): AppSong | null {
  if (!item) return null;
  const videoId =
    collect<any>(item.overlay, 'watchEndpoint')[0]?.videoId ?? collect<any>(item, 'watchEndpoint')[0]?.videoId;
  if (!videoId) return null;

  const flex = item.flexColumns ?? [];
  const title = flex[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text ?? '';
  if (!title) return null;

  const secondaryRuns: Run[] = [
    ...flex.slice(1).flatMap((c: any) => c?.musicResponsiveListItemFlexColumnRenderer?.text?.runs ?? []),
    ...(item.fixedColumns ?? []).flatMap((c: any) => c?.musicResponsiveListItemFixedColumnRenderer?.text?.runs ?? []),
  ];
  const { artists, albumName, albumId, duration } = parseSecondary(secondaryRuns);

  let artistName = artists.map((a) => a.name).filter(Boolean).join(', ');
  if (!artistName) {
    const label: string | undefined = collect<string>(item.overlay, 'label')[0];
    const m = label?.match(/^Play .+? - (.+)$/);
    if (m) artistName = m[1];
  }

  const rawThumb = lastThumb(item.thumbnail);
  return {
    id: videoId,
    title,
    artistName,
    artistId: artists[0]?.id,
    albumName,
    albumId,
    artwork: bumpThumb(rawThumb, 544),
    artworkSmall: bumpThumb(rawThumb, 120),
    duration,
    hasLyrics: false,
    downloadUrls: [],
  };
}

export function parseSongSearch(json: any): { items: AppSong[]; continuation?: string } {
  const shelves = collect<any>(json, 'musicShelfRenderer');
  const contents = shelves.flatMap((s) => s?.contents ?? []);
  const items = contents
    .map((c: any) => parseSongRow(c?.musicResponsiveListItemRenderer))
    .filter((s: AppSong | null): s is AppSong => !!s);
  const continuation = collect<any>(json, 'continuationCommand')[0]?.token;
  return { items, continuation };
}

// --- cards (album / artist / playlist) ------------------------------------

/** A `musicResponsiveListItemRenderer` that links to a browse page (search results). */
export function parseCardRow(item: any): AppCard | null {
  if (!item) return null;
  const nav = item.navigationEndpoint?.browseEndpoint ?? collect<any>(item, 'browseEndpoint')[0];
  const browseId = nav?.browseId;
  if (!browseId) return null;
  const type = typeFromPageType(nav?.browseEndpointContextSupportedConfigs?.browseEndpointContextMusicConfig?.pageType);
  const flex = item.flexColumns ?? [];
  const title = flex[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text ?? '';
  const subtitle = runsText(flex[1]?.musicResponsiveListItemFlexColumnRenderer?.text);
  return {
    id: browseId,
    type,
    title,
    subtitle: subtitle || undefined,
    image: bumpThumb(lastThumb(item.thumbnail), type === 'artist' ? 300 : 400),
    round: type === 'artist',
  };
}

/** A `musicTwoRowItemRenderer` card (home carousels, artist carousels). */
export function parseTwoRow(node: any): AppCard | null {
  const r = node?.musicTwoRowItemRenderer ?? node;
  if (!r) return null;
  const browse = r.navigationEndpoint?.browseEndpoint ?? collect<any>(r, 'browseEndpoint')[0];
  const watchId = r.navigationEndpoint?.watchEndpoint?.videoId ?? collect<any>(r, 'watchEndpoint')[0]?.videoId;
  let id: string;
  let type: CardType;
  if (browse?.browseId) {
    id = browse.browseId;
    type = typeFromPageType(browse.browseEndpointContextSupportedConfigs?.browseEndpointContextMusicConfig?.pageType);
  } else if (watchId) {
    id = watchId;
    type = 'song';
  } else {
    return null;
  }
  return {
    id,
    type,
    title: runsText(r.title),
    subtitle: runsText(r.subtitle) || undefined,
    image: bumpThumb(lastThumb(r.thumbnailRenderer) ?? lastThumb(r), type === 'artist' ? 300 : 400),
    round: type === 'artist',
  };
}

/** Search results for a card type (albums / artists / playlists). */
export function parseCardSearch(json: any): { items: AppCard[]; continuation?: string } {
  const shelves = collect<any>(json, 'musicShelfRenderer');
  const contents = shelves.flatMap((s) => s?.contents ?? []);
  const items = contents
    .map((c: any) => parseCardRow(c?.musicResponsiveListItemRenderer))
    .filter((c: AppCard | null): c is AppCard => !!c);
  const continuation = collect<any>(json, 'continuationCommand')[0]?.token;
  return { items, continuation };
}

// --- browse pages ---------------------------------------------------------

export function parseAlbum(json: any, id: string): AppAlbum {
  const header = collect<any>(json, 'musicResponsiveHeaderRenderer')[0] ?? {};
  const title = runsText(header.title) || 'Album';
  const subRuns: Run[] = header.subtitle?.runs ?? [];
  const subtitle = subRuns.map((r) => r.text).join('');
  const year = subtitle.match(/\b(19|20)\d{2}\b/)?.[0];
  const artistRun = subRuns.find((r) => r.navigationEndpoint?.browseEndpoint?.browseId?.startsWith('UC'));
  const image = bumpThumb(lastThumb(header.thumbnail) ?? lastThumb(json), 544);

  const songs = collect<any>(json, 'musicResponsiveListItemRenderer')
    .map((t) => parseSongRow(t))
    .filter((s): s is AppSong => !!s)
    .map((s) => ({
      ...s,
      albumName: s.albumName ?? title,
      albumId: s.albumId ?? id,
      artwork: s.artwork || image,
      artworkSmall: s.artworkSmall || image,
      artistName: s.artistName || artistRun?.text || '',
    }));

  return {
    id,
    type: 'album',
    title,
    subtitle: artistRun?.text,
    image,
    year: year ? parseInt(year, 10) : undefined,
    songCount: songs.length,
    songs,
  };
}

export function parsePlaylist(json: any, id: string): AppPlaylist {
  const header =
    collect<any>(json, 'musicResponsiveHeaderRenderer')[0] ?? collect<any>(json, 'musicDetailHeaderRenderer')[0] ?? {};
  const title = runsText(header.title) || 'Playlist';
  const image = bumpThumb(lastThumb(header.thumbnail) ?? lastThumb(json), 544);
  const description = runsText(header.description) || undefined;
  const songs = collect<any>(json, 'musicResponsiveListItemRenderer')
    .map((t) => parseSongRow(t))
    .filter((s): s is AppSong => !!s)
    .map((s) => ({ ...s, artwork: s.artwork || image, artworkSmall: s.artworkSmall || image }));
  return { id, type: 'playlist', title, image, description, songCount: songs.length, songs };
}

export function parseArtist(json: any, id: string): AppArtist {
  const header =
    collect<any>(json, 'musicImmersiveHeaderRenderer')[0] ?? collect<any>(json, 'musicVisualHeaderRenderer')[0] ?? {};
  const name = runsText(header.title) || 'Artist';
  const image = bumpThumb(lastThumb(header.thumbnail) ?? lastThumb(header.foregroundThumbnail) ?? lastThumb(json), 544);

  const songShelf = collect<any>(json, 'musicShelfRenderer')[0];
  const topSongs = (songShelf?.contents ?? [])
    .map((c: any) => parseSongRow(c?.musicResponsiveListItemRenderer))
    .filter((s: AppSong | null): s is AppSong => !!s);

  const carousels = collect<any>(json, 'musicCarouselShelfRenderer');
  const carouselByKeyword = (kw: string) =>
    carousels.find((c) =>
      runsText(c.header?.musicCarouselShelfBasicHeaderRenderer?.title).toLowerCase().includes(kw),
    );
  const cardsOf = (c: any): AppCard[] => (c?.contents ?? []).map(parseTwoRow).filter((x: AppCard | null): x is AppCard => !!x);

  return {
    id,
    name,
    image,
    topSongs,
    topAlbums: cardsOf(carouselByKeyword('album')),
    singles: cardsOf(carouselByKeyword('single')),
  };
}

// --- home + radio ---------------------------------------------------------

export function parseHome(json: any): { title: string; items: AppCard[] }[] {
  return collect<any>(json, 'musicCarouselShelfRenderer')
    .map((c) => ({
      title: runsText(c.header?.musicCarouselShelfBasicHeaderRenderer?.title),
      items: (c.contents ?? []).map(parseTwoRow).filter((x: AppCard | null): x is AppCard => !!x),
    }))
    .filter((s) => s.items.length > 0);
}

/** Trim YouTube video-title noise ("… | channel | views", "(Official Video)", "- Video Song"). */
function cleanTitle(t: string): string {
  const cleaned = t
    .replace(/\s*\|\s.*$/, '') // drop everything after the first " | "
    .replace(/\s*[([][^)\]]*\b(official|lyrics?|music)\b[^)\]]*\b(video|audio|song)\b[^)\]]*[)\]]/gi, '')
    .replace(/\s*[-–—]\s*(official\s*)?(lyrical|(lyrics?|music|video|full)\s*(video|song|audio)?)\s*$/gi, '')
    .trim();
  return cleaned || t.trim();
}

function parsePanelVideo(r: any): AppSong | null {
  if (!r) return null;
  const videoId = r.videoId ?? collect<any>(r, 'watchEndpoint')[0]?.videoId;
  if (!videoId) return null;
  const byline: Run[] = r.longBylineText?.runs ?? r.shortBylineText?.runs ?? [];
  const artistRuns = byline.filter((x) => x.navigationEndpoint?.browseEndpoint?.browseId?.startsWith('UC'));
  const artistName =
    artistRuns.map((a) => a.text).join(', ') ||
    byline.map((x) => x.text ?? '').find((t) => t && !/^[\s•|]+$/.test(t)) ||
    '';
  const rawThumb = lastThumb(r.thumbnail);
  return {
    id: videoId,
    title: cleanTitle(runsText(r.title)),
    artistName,
    artistId: artistRuns[0]?.navigationEndpoint?.browseEndpoint?.browseId,
    artwork: bumpThumb(rawThumb, 544),
    artworkSmall: bumpThumb(rawThumb, 120),
    duration: parseDuration(r.lengthText?.runs?.[0]?.text),
    hasLyrics: false,
    downloadUrls: [],
  };
}

/** Radio/autoplay queue from a `next` response, excluding the seed track. */
export function parseRadio(json: any, seedId: string): AppSong[] {
  return collect<any>(json, 'playlistPanelVideoRenderer')
    .map(parsePanelVideo)
    .filter((s): s is AppSong => !!s && s.id !== seedId);
}

// --- home / explore / charts aggregation ----------------------------------

/** Every `musicCarouselShelfRenderer` as { title, raw contents }. */
export function getCarousels(json: any): { title: string; contents: any[] }[] {
  return collect<any>(json, 'musicCarouselShelfRenderer').map((c) => ({
    title: runsText(c.header?.musicCarouselShelfBasicHeaderRenderer?.title),
    contents: c.contents ?? [],
  }));
}

/** Items of the first `gridRenderer` (e.g. the new-releases album grid). */
export function getGridItems(json: any): any[] {
  return collect<any>(json, 'gridRenderer')[0]?.items ?? [];
}

/** A carousel/grid entry → AppCard (two-row card, or a browse row). */
export function itemToCard(node: any): AppCard | null {
  if (node?.musicTwoRowItemRenderer) return parseTwoRow(node);
  if (node?.musicResponsiveListItemRenderer) return parseCardRow(node.musicResponsiveListItemRenderer);
  return null;
}

/** A carousel entry → AppSong (song rows only). */
export function itemToSong(node: any): AppSong | null {
  return node?.musicResponsiveListItemRenderer ? parseSongRow(node.musicResponsiveListItemRenderer) : null;
}
