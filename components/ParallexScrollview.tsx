import { usePlayerContext } from "@/contexts/PlayerContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from "react-native-reanimated";
import BottomPlayer from "./BottomPlayer";

interface ParallaxScrollViewProps {
  children: React.ReactNode;
  headerBackgroundColor: string;
  headerImage: React.ReactElement;
  headerHeight?: number;
}

const ParallaxScrollView: React.FC<ParallaxScrollViewProps> = ({
  children,
  headerBackgroundColor,
  headerImage,
  headerHeight,
}) => {
  const HEADER_HEIGHT = headerHeight || 300;

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollViewOffset(scrollRef);

  const { currentTrack } = usePlayerContext();

  // @ts-ignore
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]
          ),
        },
        {
          scale: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [2, 1, 1]
          ),
        },
      ],
    };
  });

  return (
    <View className="flex-1 relative">
      <Animated.ScrollView ref={scrollRef} scrollEventThrottle={16}>
        <Animated.View
          style={[
            {
              height: headerHeight || 300,
              overflow: "hidden",
              position: "relative",
            },
            { backgroundColor: headerBackgroundColor },
            headerAnimatedStyle,
          ]}
        >
          {headerImage}

          <View className="absolute top-[50px] left-0 px-4 w-full flex flex-row items-center justify-between">
            <TouchableOpacity
              className="w-[40px] h-[40px] bg-white rounded-full flex items-center justify-center"
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} />
            </TouchableOpacity>
          </View>
        </Animated.View>
        <View className="flex-1 p-5 bg-primary z-20">{children}</View>
      </Animated.ScrollView>

      {currentTrack && <BottomPlayer />}

      <StatusBar translucent backgroundColor="transparent" />
    </View>
  );
};

export default ParallaxScrollView;
