import { FlatList, StyleSheet, View } from 'react-native';
import type { AppCard } from '@/api/types';
import { spacing } from '@/theme';
import { AppText } from './AppText';
import { MediaCard } from './MediaCard';

interface HorizontalShelfProps {
  title: string;
  subtitle?: string;
  items: AppCard[];
  cardSize?: number;
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

export function HorizontalShelf({ title, subtitle, items, cardSize = 150 }: HorizontalShelfProps) {
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
        renderItem={({ item }) => <MediaCard item={item} size={cardSize} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.xl },
  header: { paddingHorizontal: spacing.base, marginBottom: spacing.md },
  list: { paddingHorizontal: spacing.base },
});
