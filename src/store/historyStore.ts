import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSong } from '@/api/types';
import { storageKey, zustandStorage } from './storage';

const MAX_HISTORY = 60;
const MAX_SEARCHES = 12;

interface HistoryState {
  recentlyPlayed: AppSong[];
  recentSearches: string[];
  addToHistory: (song: AppSong) => void;
  addSearch: (query: string) => void;
  clearSearches: () => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      recentlyPlayed: [],
      recentSearches: [],
      addToHistory: (song) =>
        set((s) => ({
          recentlyPlayed: [song, ...s.recentlyPlayed.filter((x) => x.id !== song.id)].slice(
            0,
            MAX_HISTORY,
          ),
        })),
      addSearch: (query) => {
        const q = query.trim();
        if (!q) return;
        set((s) => ({
          recentSearches: [q, ...s.recentSearches.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(
            0,
            MAX_SEARCHES,
          ),
        }));
      },
      clearSearches: () => set({ recentSearches: [] }),
      clearHistory: () => set({ recentlyPlayed: [] }),
    }),
    { name: storageKey('history'), storage: zustandStorage },
  ),
);
