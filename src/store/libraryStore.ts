import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppCard, AppSong, LocalPlaylist } from '@/api/types';
import { sync } from '@/lib/syncBridge';
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

  /**
   * Replace synced collections from the cloud reconcile. This setter is the ONLY
   * mutation that must NOT trigger write-through (it would echo back to Supabase).
   */
  replaceFromRemote: (data: Partial<Pick<LibraryState, 'favorites' | 'playlists' | 'savedItems'>>) => void;
}

const genId = () => `lp_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      favorites: [],
      playlists: [],
      savedItems: [],

      isFavorite: (id) => get().favorites.some((s) => s.id === id),
      toggleFavorite: (song) => {
        const has = get().favorites.some((x) => x.id === song.id);
        set((s) => ({
          favorites: has ? s.favorites.filter((x) => x.id !== song.id) : [song, ...s.favorites],
        }));
        if (has) sync.likeRemoved(song.id);
        else sync.likeAdded(song);
      },

      isSaved: (id) => get().savedItems.some((i) => i.id === id),
      toggleSaved: (item) => {
        const has = get().savedItems.some((i) => i.id === item.id);
        set((s) => ({
          savedItems: has ? s.savedItems.filter((i) => i.id !== item.id) : [item, ...s.savedItems],
        }));
        if (has) sync.savedRemoved(item.id);
        else sync.savedAdded(item);
      },

      createPlaylist: (name, initialSongs = []) => {
        const id = genId();
        const playlist: LocalPlaylist = {
          id,
          name: name.trim() || 'New Playlist',
          createdAt: Date.now(),
          songs: initialSongs,
        };
        set((s) => ({ playlists: [playlist, ...s.playlists] }));
        sync.playlistCreated(playlist);
        return id;
      },
      renamePlaylist: (id, name) => {
        set((s) => ({
          playlists: s.playlists.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p)),
        }));
        const p = get().playlists.find((x) => x.id === id);
        if (p) sync.playlistRenamed(id, p.name);
      },
      deletePlaylist: (id) => {
        set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) }));
        sync.playlistDeleted(id);
      },
      addToPlaylist: (playlistId, song) => {
        const already = get().playlists.find((p) => p.id === playlistId)?.songs.some((x) => x.id === song.id) ?? false;
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === playlistId && !p.songs.some((x) => x.id === song.id)
              ? { ...p, songs: [...p.songs, song] }
              : p,
          ),
        }));
        if (!already) sync.playlistSongAdded(playlistId, song);
      },
      removeFromPlaylist: (playlistId, songId) => {
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === playlistId ? { ...p, songs: p.songs.filter((x) => x.id !== songId) } : p,
          ),
        }));
        sync.playlistSongRemoved(playlistId, songId);
      },

      replaceFromRemote: (data) => set(data),
    }),
    { name: storageKey('library'), storage: zustandStorage },
  ),
);
