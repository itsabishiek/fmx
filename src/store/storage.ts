import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

/** Shared AsyncStorage-backed JSON storage for all persisted zustand stores. */
export const zustandStorage = createJSONStorage(() => AsyncStorage);

/** Namespace for all FMX persistence keys. */
export const storageKey = (name: string) => `fmx:${name}`;
