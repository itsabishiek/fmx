import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppCard, AppSong } from '@/api/types';
import { storageKey, zustandStorage } from './storage';

const MAX_HISTORY = 60;
const MAX_SEARCHES = 12;
const MAX_SEARCH_ITEMS = 24;

export interface ArtistAffinity {
  id: string;
  name: string;
  count: number;
}

/** A song or browse-item the user opened from the Search tab (shown on the search landing). */
export type RecentSearchItem =
  | { kind: 'song'; song: AppSong }
  | { kind: 'card'; card: AppCard };

const itemKey = (i: RecentSearchItem) => (i.kind === 'song' ? `song:${i.song.id}` : `${i.card.type}:${i.card.id}`);

interface HistoryState {
  recentlyPlayed: AppSong[];
  recentSearches: string[];
  /** Songs/items the user opened from Search, newest first (shown on the search landing). */
  recentSearchItems: RecentSearchItem[];
  /** Play counts per primary artist id — drives "More from {artist}" + seed picking. */
  artistPlays: Record<string, { name: string; count: number }>;
  /** Play counts per language — drives the "dominant language" personalization bias. */
  languagePlays: Record<string, number>;

  addToHistory: (song: AppSong) => void;
  addSearch: (query: string) => void;
  addSearchItem: (item: RecentSearchItem) => void;
  clearSearches: () => void;
  clearSearchItems: () => void;
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
      recentSearchItems: [],
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
      addSearchItem: (item) =>
        set((s) => {
          const k = itemKey(item);
          return {
            recentSearchItems: [item, ...s.recentSearchItems.filter((x) => itemKey(x) !== k)].slice(
              0,
              MAX_SEARCH_ITEMS,
            ),
          };
        }),
      clearSearches: () => set({ recentSearches: [] }),
      clearSearchItems: () => set({ recentSearchItems: [] }),
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
    {
      name: storageKey('history'),
      storage: zustandStorage,
      // One-time reset alongside the YouTube Music migration (see libraryStore) — clear stale
      // JioSaavn-era plays/searches so history/recommendations start clean on YouTube ids.
      version: 1,
      migrate: () =>
        ({
          recentlyPlayed: [],
          recentSearches: [],
          recentSearchItems: [],
          artistPlays: {},
          languagePlays: {},
        }) as unknown as HistoryState,
    },
  ),
);
