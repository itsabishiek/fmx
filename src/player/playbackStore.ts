import { create } from 'zustand';
import type { AppSong } from '@/api/types';

/**
 * Runtime mirror of the track-player queue (not persisted).
 * RNTP owns playback state; this keeps the *full* AppSong objects (with stream URLs,
 * album/artist ids, etc.) addressable by id so the UI can like / navigate / show artwork.
 */
interface PlaybackState {
  currentSong: AppSong | null;
  /** AppSongs aligned (by id) with the RNTP queue. */
  queueSongs: AppSong[];
  shuffle: boolean;
  setCurrentSong: (song: AppSong | null) => void;
  setQueueSongs: (songs: AppSong[]) => void;
  setShuffle: (shuffle: boolean) => void;
  songById: (id?: string) => AppSong | undefined;
}

export const usePlaybackStore = create<PlaybackState>((set, get) => ({
  currentSong: null,
  queueSongs: [],
  shuffle: false,
  setCurrentSong: (currentSong) => set({ currentSong }),
  setQueueSongs: (queueSongs) => set({ queueSongs }),
  setShuffle: (shuffle) => set({ shuffle }),
  songById: (id) => (id ? get().queueSongs.find((s) => s.id === id) : undefined),
}));
