import { View, Text, Image, Pressable } from "react-native";
import React from "react";
import Entypo from "@expo/vector-icons/Entypo";
import { ALBUM_PLACEHOLDER } from "@/constants";
import { usePlayerContext } from "@/contexts/PlayerContext";

interface TrackProps {
  item: any;
}

const Track: React.FC<TrackProps> = ({ item }) => {
  const { setCurrentTrack, play } = usePlayerContext();

  const playTrack = async () => {
    setCurrentTrack(item);

    await play(item);
  };

  return (
    <Pressable
      className="mb-4 flex-row items-center justify-between"
      onPress={playTrack}
    >
      <View className="flex-row items-center flex-1 w-full">
        <Image
          source={{
            uri: item?.track?.album?.images[0]?.url || ALBUM_PLACEHOLDER,
          }}
          className="w-[60px] h-[60px] rounded-md mr-2"
        />
        <View className="">
          <Text
            className="text-white font-semibold text-[17px]"
            numberOfLines={1}
          >
            {item?.track?.name?.length > 30
              ? `${item?.track?.name?.slice(0, 30)}...`
              : item?.track?.name}
          </Text>
          <Text className="text-gray-400 font-semibold text-[15px]">
            {item?.track?.artists?.[0]?.name}
          </Text>
        </View>
      </View>

      <Pressable>
        <Entypo name="dots-three-vertical" size={24} color="gray" />
      </Pressable>
    </Pressable>
  );
};

export default Track;
