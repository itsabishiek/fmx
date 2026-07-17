import { create } from 'zustand';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useUIStore } from './uiStore';

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

/** Whether Google sign-in can run (Supabase + a Google web client id are configured). */
export const isAuthAvailable = isSupabaseConfigured && Boolean(GOOGLE_WEB_CLIENT_ID);

export interface AuthProfile {
  id: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
}

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthState {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: AuthProfile | null;
  /** True while a reconcile (pull/merge/push) is in flight. */
  syncing: boolean;
  /** Wire up the gotrue session listener + foreground sync. Returns an unsubscribe. */
  init: () => () => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

function profileFromUser(user: User | null): AuthProfile | null {
  if (!user) return null;
  const m = (user.user_metadata ?? {}) as Record<string, string | undefined>;
  return {
    id: user.id,
    email: user.email ?? m.email,
    fullName: m.full_name ?? m.name,
    avatarUrl: m.avatar_url ?? m.picture,
  };
}

let googleConfigured = false;
function configureGoogle(): void {
  if (googleConfigured) return;
  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, iosClientId: GOOGLE_IOS_CLIENT_ID });
  googleConfigured = true;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  session: null,
  user: null,
  profile: null,
  syncing: false,

  init: () => {
    if (!isSupabaseConfigured) {
      set({ status: 'signedOut' });
      return () => {};
    }
    configureGoogle();

    // Mirror gotrue's session into the store. The sync engine (initSync) subscribes to `status`
    // and drives the cloud reconcile on sign-in — this store has no dependency on it.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      set({ session: session ?? null, user, profile: profileFromUser(user), status: session ? 'signedIn' : 'signedOut' });
    });

    return () => data.subscription.unsubscribe();
  },

  signInWithGoogle: async () => {
    if (!isAuthAvailable) {
      useUIStore.getState().showToast('Sign-in is not configured');
      return;
    }
    configureGoogle();
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result = await GoogleSignin.signIn();
      // v13+ returns { type: 'success' | 'cancelled', data }; older returns the user directly.
      if ((result as { type?: string })?.type === 'cancelled') return;
      const idToken =
        (result as { data?: { idToken?: string } })?.data?.idToken ??
        (result as { idToken?: string })?.idToken ??
        (await GoogleSignin.getTokens()).idToken;
      if (!idToken) throw new Error('No idToken returned from Google');
      const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
      if (error) throw error;
      // onAuthStateChange → SIGNED_IN updates state and triggers the reconcile.
    } catch (e) {
      if ((e as { code?: string })?.code === statusCodes.SIGN_IN_CANCELLED) return; // user backed out
      console.warn('[auth] Google sign-in failed:', e);
      useUIStore.getState().showToast('Sign-in failed. Please try again.');
    }
  },

  signOut: async () => {
    try {
      await GoogleSignin.signOut();
    } catch {
      // ignore — local Google session may already be gone
    }
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('[auth] sign-out failed:', e);
    }
    // onAuthStateChange → SIGNED_OUT. Local library data is intentionally kept as an offline cache.
  },
}));
