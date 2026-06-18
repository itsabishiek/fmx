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
}

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
}));
