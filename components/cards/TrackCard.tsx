import { ALBUM_PLACEHOLDER } from "@/constants";
import { router } from "expo-router";
import React from "react";
import { Image, Pressable, Text } from "react-native";

interface TrackCardProps {
  item: any;
  styles?: string;
}

const TrackCard: React.FC<TrackCardProps> = ({ item, styles }) => {
  const artists = item?.track?.artists
    ?.map((artist: any) => artist?.name)
    ?.join(", ");

  return (
    <Pressable
      className={`bg-secondary p-3 mr-3 w-[200px] rounded-md ${styles}`}
      onPress={() =>
        router.push({
          pathname: `/album/${item?.track?.album?.id}` as any,
          params: {
            albumImg: item?.track?.album?.images[0].url,
            trackName: item?.track?.name,
            artists,
          },
        })
      }
    >
      <Image
        source={{
          uri: item?.track?.album?.images[0]?.url || ALBUM_PLACEHOLDER,
        }}
        className="w-full h-[150px] rounded-md"
      />
      <Text className="text-white text-lg font-semibold mt-2" numberOfLines={1}>
        {item?.track?.name}
      </Text>
      <Text className="text-gray-400 text-sm font-semibold" numberOfLines={1}>
        {item?.track?.artists?.[0]?.name}
      </Text>
    </Pressable>
  );
};

export default TrackCard;
