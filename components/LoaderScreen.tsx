import { View, ActivityIndicator, Dimensions, Platform } from "react-native";
import React from "react";

const LoaderScreen = ({ isLoading }: { isLoading: boolean }) => {
  const screenHeight = Dimensions.get("screen").height;

  return (
    <View
      className="absolute flex flex-row items-center justify-center h-full w-full bg-primary z-10"
      style={{ height: screenHeight }}
    >
      <ActivityIndicator
        animating={isLoading}
        color="#fff"
        size={Platform.OS === "ios" ? "large" : 50}
      />
    </View>
  );
};

export default LoaderScreen;
