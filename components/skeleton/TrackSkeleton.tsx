import React from "react";
import { Text, View } from "react-native";

const TrackSkeleton = () => {
  return (
    <View className="mb-4 flex-row items-center justify-between">
      <View className="flex-row items-center flex-1 w-full">
        <View className="w-[60px] h-[60px] rounded-md mr-2 bg-secondary-100/50" />
        <View className="">
          <Text className="text-white font-semibold bg-secondary-100/50 h-[20px] w-[250px] rounded text-[17px]"></Text>
          <Text className="text-gray-400 font-semibold bg-secondary-100/50 h-[20px] w-[150px] mt-1 rounded text-[15px]"></Text>
        </View>
      </View>
    </View>
  );
};

export default TrackSkeleton;
