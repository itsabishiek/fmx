import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSong } from '@/api/types';
import { storageKey, zustandStorage } from './storage';

const MAX_HISTORY = 60;
const MAX_SEARCHES = 12;

export interface ArtistAffinity {
  id: string;
  name: string;
  count: number;
}

interface HistoryState {
  recentlyPlayed: AppSong[];
  recentSearches: string[];
  /** Play counts per primary artist id — drives "More from {artist}" + seed picking. */
  artistPlays: Record<string, { name: string; count: number }>;
  /** Play counts per language — drives the "dominant language" personalization bias. */
  languagePlays: Record<string, number>;

  addToHistory: (song: AppSong) => void;
  addSearch: (query: string) => void;
  clearSearches: () => void;
  clearHistory: () => void;

  /** Top artists by play count, most-played first. */
  topArtists: (limit?: number) => ArtistAffinity[];
  /** The single most-played language (e.g. "tamil"), or undefined if no plays yet. */
  dominantLanguage: () => string | undefined;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      recentlyPlayed: [],
      recentSearches: [],
      artistPlays: {},
      languagePlays: {},

      addToHistory: (song) =>
        set((s) => {
          const artistPlays = { ...s.artistPlays };
          if (song.artistId) {
            const prev = artistPlays[song.artistId];
            artistPlays[song.artistId] = {
              name: song.artistName || prev?.name || 'Unknown Artist',
              count: (prev?.count ?? 0) + 1,
            };
          }
          const languagePlays = { ...s.languagePlays };
          if (song.language) {
            languagePlays[song.language] = (languagePlays[song.language] ?? 0) + 1;
          }
          return {
            recentlyPlayed: [song, ...s.recentlyPlayed.filter((x) => x.id !== song.id)].slice(
              0,
              MAX_HISTORY,
            ),
            artistPlays,
            languagePlays,
          };
        }),

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
      clearHistory: () => set({ recentlyPlayed: [], artistPlays: {}, languagePlays: {} }),

      topArtists: (limit = 10) =>
        Object.entries(get().artistPlays)
          .map(([id, v]) => ({ id, name: v.name, count: v.count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, limit),

      dominantLanguage: () => {
        const entries = Object.entries(get().languagePlays);
        if (!entries.length) return undefined;
        return entries.sort((a, b) => b[1] - a[1])[0][0];
      },
    }),
    { name: storageKey('history'), storage: zustandStorage },
  ),
);
