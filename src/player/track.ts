import type { Track } from 'react-native-track-player';
import type { AppSong } from '@/api/types';
import { pickStreamUrl } from '@/api/normalize';
import { resolveStreamUrl } from '@/api/innertube/stream';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * Build a track-player Track from an AppSong. The stream URL comes from `song.url` when it has
 * already been resolved (see {@link resolvePlayUrl}); otherwise it falls back to the legacy
 * JioSaavn `downloadUrls`. Extra fields (songId, albumId, artistId…) ride along so the now-playing
 * UI can deep-link and like the song.
 */
export function songToTrack(song: AppSong): Track {
  const url = song.url ?? pickStreamUrl(song.downloadUrls ?? [], useSettingsStore.getState().audioQuality);
  return {
    id: song.id,
    url: url ?? '',
    title: song.title,
    artist: song.artistName,
    album: song.albumName,
    artwork: song.artwork,
    duration: song.duration || undefined,
    // custom passthrough fields
    songId: song.id,
    albumId: song.albumId,
    artistId: song.artistId,
    language: song.language,
    hasLyrics: song.hasLyrics,
  } as Track;
}

/**
 * Songs that can (probably) be played: JioSaavn songs with a stream URL, or YouTube songs
 * (which resolve their URL by id at play time). Already-resolved songs (`song.url`) always pass.
 */
export function playableSongs(songs: AppSong[]): AppSong[] {
  return songs.filter((s) =>
    s.url ? true : s.downloadUrls?.length ? Boolean(pickStreamUrl(s.downloadUrls)) : Boolean(s.id),
  );
}

/**
 * Resolve a playable stream URL and return the song with `.url` populated (or null if unavailable).
 * JioSaavn songs derive it from `downloadUrls`; YouTube songs resolve it from the InnerTube player
 * endpoint by video id. The `.url` is stashed on the returned copy so re-adds (shuffle/reorder)
 * reuse it without re-resolving.
 */
export async function resolvePlayUrl(song: AppSong): Promise<AppSong | null> {
  if (song.url) return song;
  if (song.downloadUrls?.length) {
    const u = pickStreamUrl(song.downloadUrls, useSettingsStore.getState().audioQuality);
    return u ? { ...song, url: u } : null;
  }
  const u = await resolveStreamUrl(song.id);
  return u ? { ...song, url: u } : null;
}
