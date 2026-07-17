import { useEffect, useMemo, useState } from 'react';
import TrackPlayer, {
  Event,
  RepeatMode,
  useActiveTrack,
  useIsPlaying,
  useProgress,
  useTrackPlayerEvents,
} from 'react-native-track-player';
import type { AppSong } from '@/api/types';
import { usePlaybackStore } from './playbackStore';

export { useActiveTrack, useIsPlaying, useProgress };

/**
 * The song currently playing. Derived from the active track's *position* (`useActiveIndex`) into
 * the queue mirror — NOT from RNTP's `useActiveTrack()` object. After a queue reorder, RNTP's
 * `PlaybackActiveTrackChanged` event carries the correct `index` (media3's real playing position,
 * proven by the audio) but a **stale `track`** payload (resolved from KotlinAudio's item list),
 * so keying off the track object leaves the UI stuck on the previous song. The index is
 * trustworthy and the mirror is kept aligned with RNTP's real order, so `queueSongs[index]` is
 * always the actually-playing song (and the full AppSong, with artwork / ids / stream URLs).
 * Falls back to the store's `currentSong` before a track is active / while the index is seeding.
 */
export function useCurrentSong(): AppSong | null {
  const index = useActiveIndex();
  const queueSongs = usePlaybackStore((s) => s.queueSongs);
  const stored = usePlaybackStore((s) => s.currentSong);

  return useMemo(() => {
    if (index >= 0 && index < queueSongs.length) return queueSongs[index];
    return stored;
  }, [index, queueSongs, stored]);
}

export function useQueueSongs() {
  return usePlaybackStore((s) => s.queueSongs);
}

/**
 * The active track's *position* in the queue (the source of truth, robust to duplicate song ids —
 * unlike matching by id, since the same song can legitimately appear twice). -1 when idle.
 */
export function useActiveIndex(): number {
  const [index, setIndex] = useState(-1);
  useEffect(() => {
    TrackPlayer.getActiveTrackIndex()
      .then((i) => setIndex(i ?? -1))
      .catch(() => {});
  }, []);
  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged], (e) => {
    if (e.type === Event.PlaybackActiveTrackChanged) setIndex(e.index ?? -1);
  });
  return index;
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
