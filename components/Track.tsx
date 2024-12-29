import { View, Text, Image, Pressable } from "react-native";
import React from "react";
import Entypo from "@expo/vector-icons/Entypo";
import { ALBUM_PLACEHOLDER } from "@/constants";
import { usePlayerContext } from "@/contexts/PlayerContext";
import TrackMenu from "./TrackMenu";

interface TrackProps {
  item: any;
}

const Track: React.FC<TrackProps> = ({ item }) => {
  const { setCurrentTrack, play, setIsTrackMenuVisible, setSelectedTrackId } =
    usePlayerContext();

  const playTrack = async () => {
    setCurrentTrack(item);

    await play(item);
  };

  const trackName = () => {
    let name;
    if (item?.track?.name) {
      if (item?.track?.name?.length > 26) {
        name = `${item?.track?.name?.slice(0, 26)}...`;
        return name;
      } else {
        name = item?.track?.name;
        return name;
      }
    } else {
      if (item?.name?.length > 26) {
        name = `${item?.name?.slice(0, 26)}...`;
        return name;
      } else {
        name = item?.name;
        return name;
      }
    }
  };

  return (
    <Pressable
      className="mb-4 flex-row items-center justify-between"
      onPress={playTrack}
    >
      <View className="flex-row items-center flex-1 w-full">
        <Image
          source={{
            uri:
              item?.track?.album?.images[0]?.url ||
              item?.album?.images[0]?.url ||
              ALBUM_PLACEHOLDER,
          }}
          className="w-[60px] h-[60px] rounded-md mr-2"
        />
        <View className="">
          <Text
            className="text-white font-semibold text-[17px]"
            numberOfLines={1}
          >
            {trackName()}
          </Text>
          <Text className="text-gray-400 font-semibold text-[15px]">
            {item?.track?.artists?.[0]?.name || item?.artists?.[0]?.name}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          setIsTrackMenuVisible(true);
          setSelectedTrackId(item?.track?.uri ?? item?.uri ?? item?.album?.uri);
        }}
      >
        <Entypo name="dots-three-vertical" size={24} color="gray" />
      </Pressable>
    </Pressable>
  );
};

export default Track;
