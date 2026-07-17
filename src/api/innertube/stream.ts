import { CTX, ClientContext, collect, getVisitorData, ytPost } from './client';

interface Format {
  itag?: number;
  url?: string;
  mimeType?: string;
  bitrate?: number;
}

/** Pick the best playable audio format. itag 140 (m4a/AAC) is cross-platform (iOS + Android). */
function pickAudioUrl(formats: Format[] | undefined): string | undefined {
  const audio = (formats ?? []).filter((f) => (f.mimeType ?? '').includes('audio') && f.url);
  if (!audio.length) return undefined;
  const m4a = audio.find((f) => f.itag === 140);
  if (m4a) return m4a.url;
  const opus = audio.find((f) => f.itag === 251); // Android-only fallback
  if (opus) return opus.url;
  return [...audio].sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0))[0]?.url;
}

async function tryPlayer(
  videoId: string,
  ctx: ClientContext,
  visitorData?: string,
  signal?: AbortSignal,
): Promise<string | undefined> {
  try {
    const j = await ytPost<any>(
      'player',
      { videoId, contentCheckOk: true, racyCheckOk: true },
      ctx,
      { visitorData, signal },
    );
    if (j?.playabilityStatus?.status !== 'OK') return undefined;
    return pickAudioUrl(j?.streamingData?.adaptiveFormats);
  } catch {
    return undefined;
  }
}

/** Unix `expire` query param (seconds) → ms; default ~5h if absent. */
function expiryFromUrl(url: string): number {
  const m = url.match(/[?&]expire=(\d+)/);
  return m ? parseInt(m[1], 10) * 1000 : Date.now() + 5 * 60 * 60 * 1000;
}

const cache = new Map<string, { url: string; expireAt: number }>();

/**
 * Resolve a directly-playable audio URL for a YouTube video id.
 * IOS client first (works for ATV tracks with no token), ANDROID_VR (+visitorData) as fallback.
 * Result is cached until shortly before its URL expires. Returns null if nothing is playable.
 */
export async function resolveStreamUrl(videoId: string, signal?: AbortSignal): Promise<string | null> {
  const cached = cache.get(videoId);
  if (cached && cached.expireAt > Date.now() + 60_000) return cached.url;

  let url = await tryPlayer(videoId, CTX.ios, undefined, signal);
  if (!url) {
    const vd = await getVisitorData();
    url = await tryPlayer(videoId, CTX.androidVr, vd, signal);
  }
  if (!url) return null;

  cache.set(videoId, { url, expireAt: expiryFromUrl(url) });
  return url;
}

/** Drop a cached URL (e.g. after a playback error) so the next resolve re-fetches. */
export function invalidateStreamUrl(videoId: string): void {
  cache.delete(videoId);
}

// re-export so callers don't reach into client for this
export { collect };
