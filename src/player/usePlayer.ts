import { useEffect, useMemo, useState } from 'react';
import TrackPlayer, {
  RepeatMode,
  useActiveTrack,
  useIsPlaying,
  useProgress,
} from 'react-native-track-player';
import type { AppSong } from '@/api/types';
import { usePlaybackStore } from './playbackStore';

export { useActiveTrack, useIsPlaying, useProgress };

/**
 * The song currently playing. Derived from RNTP's reactive `useActiveTrack()` (the source of
 * truth for what's audibly playing) so the UI can never go stale — resolves to the full AppSong
 * from the queue mirror when available (keeps stream URLs etc.), otherwise reconstructs display
 * fields from the track. Falls back to the store's `currentSong` before any track is active.
 */
export function useCurrentSong(): AppSong | null {
  const track = useActiveTrack();
  const stored = usePlaybackStore((s) => s.currentSong);
  const queueSongs = usePlaybackStore((s) => s.queueSongs);

  return useMemo(() => {
    if (!track) return stored;
    const t = track as {
      id?: string | number;
      songId?: string;
      title?: string;
      artist?: string;
      album?: string;
      artwork?: string;
      duration?: number;
      albumId?: string;
      artistId?: string;
      language?: string;
      hasLyrics?: boolean;
      url?: string;
    };
    const id = t.songId ?? (t.id != null ? String(t.id) : undefined);
    if (!id) return stored;

    const known = queueSongs.find((s) => s.id === id);
    if (known) return known;

    return {
      id,
      title: t.title ?? '',
      artistName: t.artist ?? '',
      artistId: t.artistId,
      albumName: typeof t.album === 'string' ? t.album : undefined,
      albumId: t.albumId,
      artwork: typeof t.artwork === 'string' ? t.artwork : '',
      artworkSmall: typeof t.artwork === 'string' ? t.artwork : '',
      duration: typeof t.duration === 'number' ? t.duration : 0,
      language: t.language,
      hasLyrics: !!t.hasLyrics,
      downloadUrls: [],
      url: typeof t.url === 'string' ? t.url : undefined,
    };
  }, [track, stored, queueSongs]);
}

export function useQueueSongs() {
  return usePlaybackStore((s) => s.queueSongs);
}

export function useShuffle() {
  return usePlaybackStore((s) => s.shuffle);
}

/** Live repeat mode, kept in sync after changes. */
export function useRepeatMode(): [RepeatMode, () => void] {
  const [mode, setMode] = useState<RepeatMode>(RepeatMode.Off);
  useEffect(() => {
    TrackPlayer.getRepeatMode().then(setMode).catch(() => {});
  }, []);
  const refresh = () => {
    TrackPlayer.getRepeatMode().then(setMode).catch(() => {});
  };
  return [mode, refresh];
}

/** Format seconds as m:ss. */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
