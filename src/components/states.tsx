import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing } from '@/theme';
import { AppText } from './AppText';

export function Loading({ label }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={palette.accent} size="large" />
      {label ? (
        <AppText variant="subhead" color="secondary" style={{ marginTop: spacing.md }}>
          {label}
        </AppText>
      ) : null}
    </View>
  );
}

export function EmptyState({
  icon = 'musical-notes-outline',
  title,
  subtitle,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={52} color={palette.textTertiary} />
      <AppText variant="title3" style={{ marginTop: spacing.base, textAlign: 'center' }}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText
          variant="subhead"
          color="secondary"
          style={{ marginTop: spacing.xs, textAlign: 'center', paddingHorizontal: spacing.xl }}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon="cloud-offline-outline"
      title="Something went wrong"
      subtitle="Check your connection and try again."
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    minHeight: 200,
  },
});
