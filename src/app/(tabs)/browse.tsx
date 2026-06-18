import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { BROWSE_CATEGORIES } from '@/constants/homeFeed';
import { layout, palette, radius, spacing } from '@/theme';

const GAP = spacing.md;
const COL_WIDTH = (Dimensions.get('window').width - spacing.base * 2 - GAP) / 2;

export default function BrowseScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingBottom: layout.scrollBottomPad }}
      showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <AppText variant="largeTitle">Browse</AppText>
        <AppText variant="subhead" color="secondary" style={{ marginTop: 2 }}>
          Genres, moods & languages
        </AppText>
      </View>

      <View style={styles.grid}>
        {BROWSE_CATEGORIES.map((cat) => (
          <Pressable
            key={cat.key}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
            onPress={() => router.push(`/category/${cat.key}`)}>
            <LinearGradient
              colors={cat.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tile}>
              <AppText variant="title3" style={{ color: '#fff' }}>
                {cat.title}
              </AppText>
            </LinearGradient>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.base, marginBottom: spacing.lg },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.base,
    gap: GAP,
  },
  tile: {
    width: COL_WIDTH,
    height: 100,
    borderRadius: radius.lg,
    padding: spacing.base,
    justifyContent: 'flex-end',
  },
});
