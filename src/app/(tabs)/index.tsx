import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { HorizontalShelf } from '@/components/HorizontalShelf';
import { SongShelf } from '@/components/SongShelf';
import { Loading, ErrorState } from '@/components/states';
import { useHomeFeed, useSuggestions } from '@/hooks/queries';
import { useHistoryStore } from '@/store/historyStore';
import { layout, palette, spacing } from '@/theme';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, refetch } = useHomeFeed();
  const recentlyPlayed = useHistoryStore((s) => s.recentlyPlayed);
  const { data: suggestions } = useSuggestions(recentlyPlayed[0]?.id);

  if (isLoading) return <Loading label="Loading your music…" />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingBottom: layout.scrollBottomPad }}
      showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <AppText variant="caption" color="secondary">
          {greeting()}
        </AppText>
        <AppText variant="largeTitle">Listen Now</AppText>
      </View>

      {recentlyPlayed.length > 0 ? (
        <SongShelf title="Recently Played" songs={recentlyPlayed} />
      ) : null}

      <HorizontalShelf title="Top Picks" items={data.hero} cardSize={220} />

      {suggestions && suggestions.length > 0 ? (
        <SongShelf title="Made For You" subtitle="Based on what you played" songs={suggestions} />
      ) : null}

      {data.sections.map((section) => (
        <HorizontalShelf key={section.key} title={section.title} items={section.items} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.base, marginBottom: spacing.lg },
});
