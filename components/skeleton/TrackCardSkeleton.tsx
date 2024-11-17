import React from "react";
import { Text, View } from "react-native";

const TrackCardSkeleton = ({ isTrackCard }: { isTrackCard?: boolean }) => {
  return (
    <View className={`bg-secondary p-3 mr-3 w-[200px] rounded-md`}>
      <View className="w-full h-[150px] bg-secondary-100/50 rounded-md" />
      <Text
        className="text-white text-lg font-semibold mt-2 bg-secondary-100/50 h-[20px] w-full rounded"
        numberOfLines={1}
      ></Text>
      {isTrackCard && (
        <Text
          className="text-gray-400 text-sm font-semibold bg-secondary-100/50 h-[20px] w-[120px] mt-1 rounded"
          numberOfLines={1}
        ></Text>
      )}
    </View>
  );
};

export default TrackCardSkeleton;
