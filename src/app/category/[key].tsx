import { useLocalSearchParams } from 'expo-router';
import { Dimensions, FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { BackButton } from '@/components/CollectionHeader';
import { MediaCard } from '@/components/MediaCard';
import { Loading, EmptyState } from '@/components/states';
import { BROWSE_CATEGORIES } from '@/constants/homeFeed';
import { useSearchPlaylists } from '@/hooks/queries';
import { layout, palette, spacing } from '@/theme';

const GAP = spacing.base;
const CARD = (Dimensions.get('window').width - spacing.base * 2 - GAP) / 2;

export default function CategoryScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const insets = useSafeAreaInsets();
  const category = BROWSE_CATEGORIES.find((c) => c.key === key);
  const query = category?.query ?? key ?? '';

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useSearchPlaylists(query);
  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <BackButton />
      {isLoading ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState title="Nothing here yet" subtitle="Try another category." />
      ) : (
        <FlatList
          data={items}
          numColumns={2}
          keyExtractor={(item, i) => `${item.id}-${i}`}
          columnWrapperStyle={{ gap: GAP, paddingHorizontal: spacing.base }}
          contentContainerStyle={{
            paddingTop: insets.top + 56,
            paddingBottom: layout.scrollBottomPad,
            gap: spacing.lg,
          }}
          ListHeaderComponent={
            <AppText variant="largeTitle" style={{ paddingHorizontal: spacing.base, marginBottom: spacing.md }}>
              {category?.title ?? 'Results'}
            </AppText>
          }
          renderItem={({ item }) => <MediaCard item={item} size={CARD} />}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
