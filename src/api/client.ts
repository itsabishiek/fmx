import type { ApiEnvelope } from './types';

/**
 * Base URL for the saavn API.
 *
 * NOTE: the docs advertise `https://saavn.dev/api`, but that host does not resolve in
 * every region/network. `https://saavn.sumit.co/api` is the same API and is used here as
 * the default. Both are interchangeable — swap if one is unreachable.
 */
export const API_BASE = 'https://saavn.sumit.co/api';

/**
 * Secondary host, tried only as a fallback for endpoints the primary host doesn't implement
 * (notably lyrics, which `saavn.sumit.co` returns 404 for). May not resolve on every network —
 * callers must treat a failure here as "unavailable", never fatal.
 */
export const FALLBACK_API_BASE = 'https://saavn.dev/api';

const DEFAULT_HEADERS: Record<string, string> = {
  Accept: 'application/json',
  // A browser-like UA avoids occasional 403s from the upstream JioSaavn endpoint.
  'User-Agent':
    'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Mobile Safari/537.36',
};

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function buildUrl(
  base: string,
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
) {
  const url = new URL(`${base}${path.startsWith('/') ? path : `/${path}`}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

/** Like {@link apiGet} but against an explicit base URL (used for the lyrics fallback host). */
export async function apiGetFrom<T>(
  base: string,
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
  signal?: AbortSignal,
): Promise<T> {
  const url = buildUrl(base, path, params);
  let res: Response;
  try {
    res = await fetch(url, { headers: DEFAULT_HEADERS, signal });
  } catch (err) {
    throw new ApiError(`Network request failed: ${(err as Error).message}`);
  }

  if (!res.ok) {
    throw new ApiError(`Request failed (${res.status})`, res.status);
  }

  const json = (await res.json()) as ApiEnvelope<T>;
  if (!json.success) {
    throw new ApiError(json.message || 'API returned success: false');
  }
  return json.data;
}

/**
 * GET a saavn endpoint on the primary host and unwrap the `{ success, data }` envelope.
 * Throws {@link ApiError} on network/HTTP failure or `success: false`.
 */
export function apiGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
  signal?: AbortSignal,
): Promise<T> {
  return apiGetFrom<T>(API_BASE, path, params, signal);
}
