import { create } from 'zustand';
import type { AppSong } from '@/api/types';

/** Controls globally-mounted sheets (song actions, add-to-playlist). */
interface UIState {
  /** Song whose action sheet is open, or null. */
  songActions: AppSong | null;
  /** Optional context: the local playlist the song is being shown from. */
  songActionsPlaylistId?: string;
  addToPlaylistFor: AppSong | null | undefined; // undefined = closed, null = create-only
  createPlaylistOpen: boolean;

  openSongActions: (song: AppSong, playlistId?: string) => void;
  closeSongActions: () => void;
  openAddToPlaylist: (song: AppSong | null) => void;
  closeAddToPlaylist: () => void;
  openCreatePlaylist: () => void;
  closeCreatePlaylist: () => void;

  /** Transient toast message (auto-clears). `toastSeq` bumps so repeated identical messages re-trigger. */
  toast: string | null;
  toastSeq: number;
  showToast: (message: string) => void;
  hideToast: () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useUIStore = create<UIState>((set) => ({
  songActions: null,
  songActionsPlaylistId: undefined,
  addToPlaylistFor: undefined,
  createPlaylistOpen: false,

  openSongActions: (song, playlistId) => set({ songActions: song, songActionsPlaylistId: playlistId }),
  closeSongActions: () => set({ songActions: null, songActionsPlaylistId: undefined }),
  openAddToPlaylist: (song) => set({ addToPlaylistFor: song, songActions: null }),
  closeAddToPlaylist: () => set({ addToPlaylistFor: undefined }),
  openCreatePlaylist: () => set({ createPlaylistOpen: true }),
  closeCreatePlaylist: () => set({ createPlaylistOpen: false }),

  toast: null,
  toastSeq: 0,
  showToast: (message) =>
    set((s) => {
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => useUIStore.getState().hideToast(), 2200);
      return { toast: message, toastSeq: s.toastSeq + 1 };
    }),
  hideToast: () => set({ toast: null }),
}));
