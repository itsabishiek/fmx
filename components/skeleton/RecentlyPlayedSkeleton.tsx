import { View, Text } from "react-native";
import React from "react";

const RecentlyPlayedSkeleton = () => {
  return (
    <View
      className={`bg-secondary flex flex-row flex-1 items-center mr-2 rounded-md mb-3`}
    >
      <View className="w-[70px] h-[70px] bg-secondary-100/50 rounded-md mr-2" />
      <Text className="text-white flex-1 font-semibold bg-secondary-100/50 h-[30px] w-full rounded"></Text>
    </View>
  );
};

export default RecentlyPlayedSkeleton;
