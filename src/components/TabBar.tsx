import { BlurView } from 'expo-blur';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing } from '@/theme';
import { AppText } from './AppText';
import { MiniPlayer } from './MiniPlayer';

const ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap; label: string }> = {
  index: { active: 'home', inactive: 'home-outline', label: 'Home' },
  browse: { active: 'compass', inactive: 'compass-outline', label: 'Browse' },
  search: { active: 'search', inactive: 'search-outline', label: 'Search' },
  library: { active: 'library', inactive: 'library-outline', label: 'Library' },
};

interface TabRoute {
  key: string;
  name: string;
}
interface TabBarProps {
  state: { index: number; routes: TabRoute[] };
  navigation: {
    emit: (event: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
}

export function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <MiniPlayer />
      <BlurView intensity={80} tint="dark" style={[styles.bar, { paddingBottom: insets.bottom || spacing.sm }]}>
        {state.routes.map((route: TabRoute, index: number) => {
          const meta = ICONS[route.name];
          if (!meta) return null;
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <Pressable key={route.key} style={styles.tab} onPress={onPress} hitSlop={6}>
              <Ionicons
                name={focused ? meta.active : meta.inactive}
                size={24}
                color={focused ? palette.accent : palette.textSecondary}
              />
              <AppText
                variant="micro"
                style={{ color: focused ? palette.accent : palette.textSecondary, marginTop: 3 }}>
                {meta.label}
              </AppText>
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  bar: {
    flexDirection: 'row',
    paddingTop: spacing.sm,
    backgroundColor: 'rgba(10,10,11,0.85)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
