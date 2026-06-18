import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppCard, AppSong, LocalPlaylist } from '@/api/types';
import { storageKey, zustandStorage } from './storage';

interface LibraryState {
  /** Liked songs. */
  favorites: AppSong[];
  /** User-created playlists stored on device. */
  playlists: LocalPlaylist[];
  /** Albums / artists / JioSaavn playlists added to the library. */
  savedItems: AppCard[];

  isFavorite: (id: string) => boolean;
  toggleFavorite: (song: AppSong) => void;

  isSaved: (id: string) => boolean;
  toggleSaved: (item: AppCard) => void;

  createPlaylist: (name: string, initialSongs?: AppSong[]) => string;
  renamePlaylist: (id: string, name: string) => void;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (playlistId: string, song: AppSong) => void;
  removeFromPlaylist: (playlistId: string, songId: string) => void;
}

const genId = () => `lp_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      favorites: [],
      playlists: [],
      savedItems: [],

      isFavorite: (id) => get().favorites.some((s) => s.id === id),
      toggleFavorite: (song) =>
        set((s) => ({
          favorites: s.favorites.some((x) => x.id === song.id)
            ? s.favorites.filter((x) => x.id !== song.id)
            : [song, ...s.favorites],
        })),

      isSaved: (id) => get().savedItems.some((i) => i.id === id),
      toggleSaved: (item) =>
        set((s) => ({
          savedItems: s.savedItems.some((i) => i.id === item.id)
            ? s.savedItems.filter((i) => i.id !== item.id)
            : [item, ...s.savedItems],
        })),

      createPlaylist: (name, initialSongs = []) => {
        const id = genId();
        const playlist: LocalPlaylist = {
          id,
          name: name.trim() || 'New Playlist',
          createdAt: Date.now(),
          songs: initialSongs,
        };
        set((s) => ({ playlists: [playlist, ...s.playlists] }));
        return id;
      },
      renamePlaylist: (id, name) =>
        set((s) => ({
          playlists: s.playlists.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p)),
        })),
      deletePlaylist: (id) => set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) })),
      addToPlaylist: (playlistId, song) =>
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === playlistId && !p.songs.some((x) => x.id === song.id)
              ? { ...p, songs: [...p.songs, song] }
              : p,
          ),
        })),
      removeFromPlaylist: (playlistId, songId) =>
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === playlistId ? { ...p, songs: p.songs.filter((x) => x.id !== songId) } : p,
          ),
        })),
    }),
    { name: storageKey('library'), storage: zustandStorage },
  ),
);
