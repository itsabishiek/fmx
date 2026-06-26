import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { createClient } from '@supabase/supabase-js';

// NOTE: these MUST be read as full member expressions so babel-preset-expo can
// statically inline the EXPO_PUBLIC_* values into the bundle. Do not destructure
// `process.env` or alias these reads, or the values won't be inlined.
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Whether Supabase credentials were provided at build time. When false the app
 * still runs fully (local-only); auth + sync just stay disabled. This lets the
 * app boot cleanly before the user has filled in their `.env` / EAS env.
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// The anon key is public-safe — all access is gated by row-level security.
// Fall back to harmless placeholders so createClient never throws when unconfigured.
export const supabase = createClient(SUPABASE_URL ?? 'http://localhost', SUPABASE_ANON_KEY ?? 'public-anon-key', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // RN has no URL bar to parse an OAuth redirect from — native sign-in handles tokens directly.
    detectSessionInUrl: false,
  },
});

// gotrue's token-refresh timer should only tick while the app is foregrounded.
if (isSupabaseConfigured) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
