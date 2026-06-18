import type {
  AppAlbum,
  AppArtist,
  AppCard,
  AppPlaylist,
  AppSong,
  DownloadQuality,
  ImageQuality,
  RawAlbum,
  RawArtist,
  RawArtistMini,
  RawPlaylist,
  RawSong,
} from './types';

const PLACEHOLDER_IMAGE =
  'https://www.jiosaavn.com/_i/3.0/artist-default-music.png';

/** JioSaavn embeds HTML entities (&quot; &amp; &#039; …) in titles — decode them. */
export function decodeEntities(input?: string | null): string {
  if (!input) return '';
  return input
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#0?38;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function httpsify(url?: string | null): string {
  if (!url) return '';
  return url.replace(/^http:\/\//, 'https://');
}

const QUALITY_RANK = ['12kbps', '48kbps', '96kbps', '160kbps', '320kbps'];

/** Pick an image URL by preferred quality, falling back to the largest available. */
export function pickImage(images?: ImageQuality[], preferred = '500x500'): string {
  if (!images?.length) return PLACEHOLDER_IMAGE;
  const exact = images.find((i) => i.quality === preferred);
  if (exact) return httpsify(exact.url);
  return httpsify(images[images.length - 1].url);
}

/**
 * Pick the best stream URL at or below the requested quality.
 * `desired` is a quality string like "320kbps"; falls back to the highest available.
 */
export function pickStreamUrl(urls?: DownloadQuality[], desired = '320kbps'): string | undefined {
  if (!urls?.length) return undefined;
  const desiredRank = QUALITY_RANK.indexOf(desired);
  const sorted = [...urls].sort(
    (a, b) => QUALITY_RANK.indexOf(a.quality) - QUALITY_RANK.indexOf(b.quality),
  );
  // Highest quality that is <= desired.
  let chosen = sorted[sorted.length - 1];
  for (const u of sorted) {
    if (QUALITY_RANK.indexOf(u.quality) <= desiredRank) chosen = u;
  }
  return httpsify(chosen.url);
}

function artistNames(artists?: RawArtistMini[]): string {
  if (!artists?.length) return '';
  return artists.map((a) => decodeEntities(a.name)).filter(Boolean).join(', ');
}

export function normalizeSong(raw: RawSong): AppSong {
  const primary = raw.artists?.primary ?? [];
  return {
    id: raw.id,
    title: decodeEntities(raw.name),
    artistName: artistNames(primary) || artistNames(raw.artists?.all) || 'Unknown Artist',
    artistId: primary[0]?.id,
    albumName: decodeEntities(raw.album?.name) || undefined,
    albumId: raw.album?.id ?? undefined,
    artwork: pickImage(raw.image, '500x500'),
    artworkSmall: pickImage(raw.image, '150x150'),
    duration: typeof raw.duration === 'number' ? raw.duration : 0,
    language: raw.language,
    hasLyrics: Boolean(raw.hasLyrics),
    downloadUrls: raw.downloadUrl ?? [],
    url: raw.url,
  };
}

export function normalizeSongs(raw?: RawSong[]): AppSong[] {
  return (raw ?? []).map(normalizeSong);
}

export function normalizeAlbumCard(raw: RawAlbum): AppCard {
  return {
    id: raw.id,
    type: 'album',
    title: decodeEntities(raw.name),
    subtitle: artistNames(raw.artists?.primary) || undefined,
    image: pickImage(raw.image, '500x500'),
  };
}

export function normalizeAlbum(raw: RawAlbum): AppAlbum {
  return {
    ...normalizeAlbumCard(raw),
    type: 'album',
    year: raw.year ? Number(raw.year) : undefined,
    songCount: raw.songCount ?? raw.songs?.length,
    songs: normalizeSongs(raw.songs),
  };
}

export function normalizePlaylistCard(raw: RawPlaylist): AppCard {
  return {
    id: raw.id,
    type: 'playlist',
    title: decodeEntities(raw.name),
    subtitle: raw.songCount ? `${raw.songCount} songs` : undefined,
    image: pickImage(raw.image, '500x500'),
  };
}

export function normalizePlaylist(raw: RawPlaylist): AppPlaylist {
  return {
    ...normalizePlaylistCard(raw),
    type: 'playlist',
    description: decodeEntities(raw.description) || undefined,
    songCount: raw.songCount ?? raw.songs?.length,
    songs: normalizeSongs(raw.songs),
  };
}

export function normalizeArtistCard(raw: { id: string; name: string; image: ImageQuality[] }): AppCard {
  return {
    id: raw.id,
    type: 'artist',
    title: decodeEntities(raw.name),
    image: pickImage(raw.image, '500x500'),
    round: true,
  };
}

export function normalizeArtist(raw: RawArtist): AppArtist {
  const bio = raw.bio?.find((b) => b.text)?.text;
  return {
    id: raw.id,
    name: decodeEntities(raw.name),
    image: pickImage(raw.image, '500x500'),
    followerCount: raw.followerCount ?? undefined,
    bio: decodeEntities(bio) || undefined,
    topSongs: normalizeSongs(raw.topSongs),
    topAlbums: (raw.topAlbums ?? []).map(normalizeAlbumCard),
    singles: normalizeSongs(raw.singles).map((s) => ({
      id: s.id,
      type: 'song' as const,
      title: s.title,
      subtitle: s.artistName,
      image: s.artwork,
    })),
  };
}

export { PLACEHOLDER_IMAGE };
