/**
 * Types for the saavn (unofficial JioSaavn) API at https://saavn.sumit.co/api.
 * `Raw*` types mirror the API response; `App*` types are the normalized shapes the UI consumes.
 */

export interface ImageQuality {
  quality: string; // "50x50" | "150x150" | "500x500"
  url: string;
}

export interface DownloadQuality {
  quality: string; // "12kbps" .. "320kbps"
  url: string;
}

export interface RawArtistMini {
  id: string;
  name: string;
  role?: string;
  type?: string;
  image: ImageQuality[];
  url?: string;
}

export interface RawArtists {
  primary: RawArtistMini[];
  featured: RawArtistMini[];
  all: RawArtistMini[];
}

export interface RawSong {
  id: string;
  name: string;
  type: string;
  year?: number | string | null;
  releaseDate?: string | null;
  duration?: number | null;
  label?: string | null;
  explicitContent?: boolean;
  playCount?: number | null;
  language?: string;
  hasLyrics?: boolean;
  lyricsId?: string | null;
  url?: string;
  album?: { id?: string | null; name?: string | null; url?: string | null } | null;
  artists?: RawArtists;
  image: ImageQuality[];
  downloadUrl?: DownloadQuality[];
}

export interface RawAlbum {
  id: string;
  name: string;
  description?: string;
  year?: number | string | null;
  type: string;
  playCount?: number | null;
  language?: string;
  explicitContent?: boolean;
  artists?: RawArtists;
  songCount?: number | null;
  url?: string;
  image: ImageQuality[];
  songs?: RawSong[];
}

export interface RawArtistBio {
  text?: string;
  title?: string;
  sequence?: number;
}

export interface RawArtist {
  id: string;
  name: string;
  url?: string;
  type: string;
  image: ImageQuality[];
  followerCount?: number | null;
  fanCount?: string | null;
  isVerified?: boolean;
  dominantLanguage?: string;
  dominantType?: string;
  bio?: RawArtistBio[];
  availableLanguages?: string[];
  topSongs?: RawSong[];
  topAlbums?: RawAlbum[];
  singles?: RawSong[];
  similarArtists?: { id: string; name: string; image: ImageQuality[] }[];
}

export interface RawPlaylist {
  id: string;
  name: string;
  description?: string;
  year?: number | string | null;
  type: string;
  playCount?: number | null;
  language?: string;
  explicitContent?: boolean;
  songCount?: number | null;
  url?: string;
  image: ImageQuality[];
  songs?: RawSong[];
  artists?: RawArtistMini[];
}

/** Generic envelope. */
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface SearchListResponse<T> {
  total: number;
  start: number;
  results: T[];
}

export interface GlobalSearchResponse {
  topQuery: { results: GlobalSearchItem[] };
  songs: { results: GlobalSearchItem[] };
  albums: { results: GlobalSearchItem[] };
  artists: { results: GlobalSearchItem[] };
  playlists: { results: GlobalSearchItem[] };
}

export interface GlobalSearchItem {
  id: string;
  title: string;
  image: ImageQuality[];
  type: string;
  description?: string;
  url?: string;
}

// ---------------------------------------------------------------------------
// Normalized app models
// ---------------------------------------------------------------------------

/** The canonical song the UI and player work with. */
export interface AppSong {
  id: string;
  title: string;
  /** Display string of primary artists, e.g. "Anirudh Ravichander, Dhanush". */
  artistName: string;
  /** Primary artist id for navigation (may be undefined). */
  artistId?: string;
  albumName?: string;
  albumId?: string;
  /** Best-quality square artwork URL. */
  artwork: string;
  /** Smaller artwork for list rows. */
  artworkSmall: string;
  duration: number;
  language?: string;
  hasLyrics: boolean;
  /** All available stream qualities (highest last is not guaranteed; selected via helper). */
  downloadUrls: DownloadQuality[];
  url?: string;
}

export type CardType = 'album' | 'artist' | 'playlist' | 'song';

/** A generic browsable item rendered as a card (album / artist / playlist). */
export interface AppCard {
  id: string;
  type: CardType;
  title: string;
  subtitle?: string;
  image: string;
  /** Artists render as circles. */
  round?: boolean;
}

export interface AppAlbum extends AppCard {
  type: 'album';
  year?: number;
  songCount?: number;
  songs: AppSong[];
}

export interface AppPlaylist extends AppCard {
  type: 'playlist';
  description?: string;
  songCount?: number;
  songs: AppSong[];
}

export interface AppArtist {
  id: string;
  name: string;
  image: string;
  followerCount?: number;
  bio?: string;
  topSongs: AppSong[];
  topAlbums: AppCard[];
  singles: AppCard[];
}

/** A user-created, locally-stored playlist. */
export interface LocalPlaylist {
  id: string;
  name: string;
  createdAt: number;
  songs: AppSong[];
}
