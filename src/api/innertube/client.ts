/**
 * Minimal YouTube Music InnerTube client (replaces the JioSaavn REST API).
 *
 * Two client contexts, mirroring the approach of the open-source Echo-Music app:
 *  - WEB_REMIX  → search / browse / next (metadata). Origin music.youtube.com.
 *  - IOS        → the `player` endpoint for STREAM extraction. Returns direct, un-ciphered
 *                 audio URLs (itag 140 = m4a/AAC) with NO poToken / signature deciphering, and
 *                 works for YT-Music ATV tracks WITHOUT a visitorData token.
 *  - ANDROID_VR (1.43.32) → player fallback; needs a visitorData token but is a solid backup.
 *
 * No API key of our own — YouTube's public web key is a constant. Pure fetch, no native module.
 */

const KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
const LOCALE = { hl: 'en', gl: 'IN' } as const;

export interface ClientContext {
  origin: string;
  userAgent: string;
  referer?: string;
  client: Record<string, string | number>;
}

export const CTX: Record<'webRemix' | 'ios' | 'androidVr', ClientContext> = {
  webRemix: {
    origin: 'https://music.youtube.com',
    referer: 'https://music.youtube.com/',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0',
    client: { clientName: 'WEB_REMIX', clientVersion: '1.20260213.01.00', ...LOCALE },
  },
  ios: {
    origin: 'https://www.youtube.com',
    userAgent: 'com.google.ios.youtube/21.03.1 (iPhone16,2; U; CPU iOS 18_2 like Mac OS X;)',
    client: {
      clientName: 'IOS',
      clientVersion: '21.03.1',
      deviceMake: 'Apple',
      deviceModel: 'iPhone16,2',
      osName: 'iPhone',
      osVersion: '18.2.22C152',
      ...LOCALE,
    },
  },
  androidVr: {
    origin: 'https://www.youtube.com',
    userAgent:
      'com.google.android.apps.youtube.vr.oculus/1.43.32 (Linux; U; Android 12; en_US; Quest 3; Build/SQ3A.220605.009.A1; Cronet/107.0.5284.2)',
    client: {
      clientName: 'ANDROID_VR',
      clientVersion: '1.43.32',
      deviceMake: 'Oculus',
      deviceModel: 'Quest 3',
      osName: 'Android',
      osVersion: '12',
      androidSdkVersion: 32,
      ...LOCALE,
    },
  },
};

/** Search filter tokens (protobuf, base64). Select a single result type + its continuation. */
export const SEARCH_FILTER = {
  songs: 'EgWKAQIIAWoKEAkQBRAKEAMQBA==',
  albums: 'EgWKAQIYAWoKEAkQChAFEAMQBA==',
  artists: 'EgWKAQIgAWoKEAkQChAFEAMQBA==',
  playlists: 'EgWKAQIoAWoKEAkQChAFEAMQBA==',
} as const;

export class InnerTubeError extends Error {}

/** POST a youtubei/v1 endpoint with a client context. `body` is merged with the context. */
export async function ytPost<T = any>(
  path: string,
  body: Record<string, unknown>,
  ctx: ClientContext,
  opts?: { visitorData?: string; signal?: AbortSignal },
): Promise<T> {
  const client = { ...ctx.client, ...(opts?.visitorData ? { visitorData: opts.visitorData } : {}) };
  let res: Response;
  try {
    res = await fetch(`${ctx.origin}/youtubei/v1/${path}?key=${KEY}&prettyPrint=false`, {
      method: 'POST',
      // 'omit' prevents React Native's native cookie jar from attaching any ambient youtube.com
      // cookies — those make the cookieless ANDROID_VR player client return LOGIN_REQUIRED.
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': ctx.userAgent,
        Origin: ctx.origin,
        ...(ctx.referer ? { Referer: ctx.referer } : {}),
      },
      body: JSON.stringify({ context: { client }, ...body }),
      signal: opts?.signal,
    });
  } catch (e) {
    throw new InnerTubeError(`network: ${(e as Error).message}`);
  }
  if (!res.ok) throw new InnerTubeError(`${path} HTTP ${res.status}`);
  return (await res.json()) as T;
}

// --- shared helpers -------------------------------------------------------

/** Depth-first collect every value under `key` anywhere in a nested object. */
export function collect<T = any>(obj: unknown, key: string, out: T[] = []): T[] {
  if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj as Record<string, unknown>)) {
      if (k === key) out.push((obj as Record<string, unknown>)[k] as T);
      collect((obj as Record<string, unknown>)[k], key, out);
    }
  }
  return out;
}

/** Bump a YT thumbnail URL (…=w120-h120-…) to a larger square. */
export function bumpThumb(url: string | undefined, size = 544): string {
  if (!url) return '';
  return url.replace(/=w\d+-h\d+/, `=w${size}-h${size}`).replace(/^http:/, 'https:');
}

/** Parse "m:ss" / "h:mm:ss" → seconds. */
export function parseDuration(text?: string): number {
  if (!text) return 0;
  const parts = text.trim().split(':').map((n) => parseInt(n, 10));
  if (parts.some((n) => Number.isNaN(n))) return 0;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

// --- visitorData (cached; only needed for the ANDROID_VR player fallback) -------------

let visitorDataPromise: Promise<string | undefined> | null = null;

export function getVisitorData(): Promise<string | undefined> {
  if (!visitorDataPromise) {
    visitorDataPromise = ytPost('search', { query: 'a' }, CTX.webRemix)
      .then((j) => collect<string>(j?.responseContext, 'visitorData')[0])
      .catch(() => undefined);
  }
  return visitorDataPromise;
}
