import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { Artwork } from '@/components/Artwork';
import { useAuthStore } from '@/store/authStore';
import { palette, radius, spacing } from '@/theme';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const status = useAuthStore((s) => s.status);
  const profile = useAuthStore((s) => s.profile);
  const syncing = useAuthStore((s) => s.syncing);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const signOut = useAuthStore((s) => s.signOut);

  const [pending, setPending] = useState(false);

  const onSignIn = async () => {
    setPending(true);
    try {
      await signInWithGoogle();
    } finally {
      setPending(false);
    }
  };

  const onSignOut = async () => {
    setPending(true);
    try {
      await signOut();
    } finally {
      setPending(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <AppText variant="title2">Account</AppText>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={26} color={palette.textPrimary} />
        </Pressable>
      </View>

      {status === 'signedIn' && profile ? (
        <View style={styles.body}>
          <View style={styles.profileCard}>
            {profile.avatarUrl ? (
              <Artwork uri={profile.avatarUrl} size={72} round />
            ) : (
              <View style={styles.avatarFallback}>
                <Ionicons name="person" size={36} color={palette.textSecondary} />
              </View>
            )}
            <View style={{ flex: 1, marginLeft: spacing.base }}>
              <AppText variant="title3" numberOfLines={1}>
                {profile.fullName || 'FMX User'}
              </AppText>
              {profile.email ? (
                <AppText variant="subhead" color="secondary" numberOfLines={1}>
                  {profile.email}
                </AppText>
              ) : null}
              <View style={styles.syncRow}>
                <Ionicons
                  name={syncing ? 'sync' : 'cloud-done-outline'}
                  size={14}
                  color={syncing ? palette.accent : palette.textTertiary}
                />
                <AppText variant="caption" color={syncing ? 'accent' : 'tertiary'} style={{ marginLeft: spacing.xs }}>
                  {syncing ? 'Syncing…' : 'Library synced'}
                </AppText>
              </View>
            </View>
          </View>

          <Pressable
            onPress={onSignOut}
            disabled={pending}
            style={({ pressed }) => [styles.signOutRow, pressed && { opacity: 0.6 }]}>
            {pending ? (
              <ActivityIndicator color="#ff5a5a" />
            ) : (
              <>
                <Ionicons name="log-out-outline" size={22} color="#ff5a5a" />
                <AppText variant="headline" style={{ color: '#ff5a5a', marginLeft: spacing.sm }}>
                  Sign out
                </AppText>
              </>
            )}
          </Pressable>
        </View>
      ) : (
        <View style={styles.body}>
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name="cloud-upload-outline" size={40} color={palette.accent} />
            </View>
            <AppText variant="title2" style={styles.heroTitle}>
              Sync your library
            </AppText>
            <AppText variant="body" color="secondary" style={styles.heroCopy}>
              Sign in to back up your liked songs, playlists, and preferences — and pick up where you left off on any
              device. FMX works fully without an account; signing in just turns on cloud sync.
            </AppText>
          </View>

          <Pressable
            onPress={onSignIn}
            disabled={pending}
            style={({ pressed }) => [styles.googleBtn, pressed && { opacity: 0.85 }]}>
            {pending ? (
              <ActivityIndicator color="#1f1f22" />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#4285F4" />
                <AppText variant="headline" style={styles.googleBtnText}>
                  Continue with Google
                </AppText>
              </>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.lg,
  },
  body: { flex: 1, paddingHorizontal: spacing.base },
  hero: { alignItems: 'center', marginTop: spacing.xxl, paddingHorizontal: spacing.base },
  heroIcon: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    backgroundColor: palette.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: { textAlign: 'center', marginBottom: spacing.sm },
  heroCopy: { textAlign: 'center', lineHeight: 21 },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: palette.white,
    borderRadius: radius.pill,
    paddingVertical: spacing.base,
    marginTop: spacing.xxl,
  },
  googleBtnText: { color: '#1f1f22' },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.elevated,
    borderRadius: radius.lg,
    padding: spacing.base,
  },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.elevated,
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    marginTop: spacing.lg,
  },
});
