import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sync } from '@/lib/syncBridge';
import { storageKey, zustandStorage } from './storage';

export type AudioQuality = '96kbps' | '160kbps' | '320kbps';

interface SettingsState {
  /** Preferred stream quality (used by pickStreamUrl when building tracks). */
  audioQuality: AudioQuality;
  /** Append AI-style suggestions when the queue runs out (Apple Music "Autoplay"). */
  autoplay: boolean;
  setAudioQuality: (q: AudioQuality) => void;
  toggleAutoplay: () => void;
  /** Apply synced preferences from the cloud reconcile (does NOT write back). */
  replaceFromRemote: (data: Partial<Pick<SettingsState, 'audioQuality' | 'autoplay'>>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      audioQuality: '320kbps',
      autoplay: true,
      setAudioQuality: (audioQuality) => {
        set({ audioQuality });
        sync.preferences();
      },
      toggleAutoplay: () => {
        set((s) => ({ autoplay: !s.autoplay }));
        sync.preferences();
      },
      replaceFromRemote: (data) => set(data),
    }),
    { name: storageKey('settings'), storage: zustandStorage },
  ),
);
