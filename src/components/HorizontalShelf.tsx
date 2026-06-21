import { FlatList, StyleSheet, View } from 'react-native';
import type { AppCard } from '@/api/types';
import { spacing } from '@/theme';
import { AppText } from './AppText';
import { MediaCard, navigateToCard } from './MediaCard';

interface HorizontalShelfProps {
  title: string;
  subtitle?: string;
  items: AppCard[];
  cardSize?: number;
  /** Side-effect fired on tap (e.g. record the search interaction); navigation still happens. */
  onItemPress?: (item: AppCard) => void;
}

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.header}>
      <AppText variant="title2">{title}</AppText>
      {subtitle ? (
        <AppText variant="subhead" color="secondary" style={{ marginTop: 2 }}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

export function HorizontalShelf({ title, subtitle, items, cardSize = 150, onItemPress }: HorizontalShelfProps) {
  if (!items.length) return null;
  return (
    <View style={styles.wrap}>
      <SectionHeader title={title} subtitle={subtitle} />
      <FlatList
        horizontal
        data={items}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ width: spacing.base }} />}
        renderItem={({ item }) => (
          <MediaCard
            item={item}
            size={cardSize}
            onPress={
              onItemPress
                ? () => {
                    onItemPress(item);
                    navigateToCard(item);
                  }
                : undefined
            }
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.xl },
  header: { paddingHorizontal: spacing.base, marginBottom: spacing.md },
  list: { paddingHorizontal: spacing.base },
});
