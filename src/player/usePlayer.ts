import { useEffect, useState } from 'react';
import TrackPlayer, {
  RepeatMode,
  useActiveTrack,
  useIsPlaying,
  useProgress,
} from 'react-native-track-player';
import { usePlaybackStore } from './playbackStore';

export { useActiveTrack, useIsPlaying, useProgress };

/** The full AppSong currently playing (with stream URLs, ids for navigation, etc.). */
export function useCurrentSong() {
  return usePlaybackStore((s) => s.currentSong);
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
