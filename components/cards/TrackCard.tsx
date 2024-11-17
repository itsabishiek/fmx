import { ALBUM_PLACEHOLDER } from "@/constants";
import { usePlayerContext } from "@/contexts/PlayerContext";
import React from "react";
import { Image, Pressable, Text } from "react-native";

interface TrackCardProps {
  item: any;
  styles?: string;
}

const TrackCard: React.FC<TrackCardProps> = ({ item, styles }) => {
  const { setCurrentTrack, play } = usePlayerContext();

  const playTrack = async () => {
    setCurrentTrack(item);

    await play(item);
  };

  return (
    <Pressable
      className={`bg-secondary p-3 mr-3 w-[200px] rounded-md ${styles}`}
      onPress={playTrack}
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
