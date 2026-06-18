import type { Track } from 'react-native-track-player';
import type { AppSong } from '@/api/types';
import { pickStreamUrl } from '@/api/normalize';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * Build a track-player Track from an AppSong, choosing the stream URL by the
 * user's preferred audio quality. Extra fields (songId, albumId, artistId…) ride
 * along on the track so the now-playing UI can deep-link and like the song.
 */
export function songToTrack(song: AppSong): Track {
  const quality = useSettingsStore.getState().audioQuality;
  const url = pickStreamUrl(song.downloadUrls, quality);
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

/** Songs that actually have a playable stream URL at the current quality. */
export function playableSongs(songs: AppSong[]): AppSong[] {
  return songs.filter((s) => Boolean(pickStreamUrl(s.downloadUrls)));
}
