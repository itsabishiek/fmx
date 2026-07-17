import type { AppSong } from '../types';
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
  };
}

function runPageType(run: Run): string | undefined {
  return run?.navigationEndpoint?.browseEndpoint?.browseEndpointContextSupportedConfigs
    ?.browseEndpointContextMusicConfig?.pageType;
}

/** From a song row's secondary flex column: artists (+id), album (+id), duration (s). */
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
 * Parse a `musicResponsiveListItemRenderer` (a song row from search/browse) into an AppSong.
 * Returns null for rows that aren't playable audio tracks (no videoId).
 */
export function parseSongRow(item: any): AppSong | null {
  if (!item) return null;

  // videoId: the play-button overlay's watchEndpoint is the canonical source.
  const videoId =
    collect<any>(item.overlay, 'watchEndpoint')[0]?.videoId ??
    collect<any>(item, 'watchEndpoint')[0]?.videoId;
  if (!videoId) return null;

  const flex = item.flexColumns ?? [];
  const titleRuns: Run[] = flex[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs ?? [];
  const title = titleRuns[0]?.text ?? '';
  if (!title) return null;

  const secondaryRuns: Run[] = flex[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs ?? [];
  const { artists, albumName, albumId, duration } = parseSecondary(secondaryRuns);

  // Fallback artist from the accessibility label ("Play <title> - <artists>").
  let artistName = artists.map((a) => a.name).filter(Boolean).join(', ');
  if (!artistName) {
    const label: string | undefined = collect<string>(item.overlay, 'label')[0];
    const m = label?.match(/^Play .+? - (.+)$/);
    if (m) artistName = m[1];
  }

  const thumbs = collect<any[]>(item.thumbnail, 'thumbnails')[0] ?? [];
  const rawThumb = thumbs[thumbs.length - 1]?.url;

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
    downloadUrls: [], // YT songs stream by videoId (resolved at play time), not stored URLs
  };
}

/** Parse a WEB_REMIX `search` response (songs filter) → songs + a continuation token. */
export function parseSongSearch(json: any): { items: AppSong[]; continuation?: string } {
  const shelves = collect<any>(json, 'musicShelfRenderer');
  const contents = shelves.flatMap((s) => s?.contents ?? []);
  const items = contents
    .map((c: any) => parseSongRow(c?.musicResponsiveListItemRenderer))
    .filter((s: AppSong | null): s is AppSong => !!s);
  const continuation = collect<any>(json, 'continuationCommand')[0]?.token
    ?? collect<any>(json, 'nextContinuationData')[0]?.continuation;
  return { items, continuation };
}
