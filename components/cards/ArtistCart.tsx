import { ALBUM_PLACEHOLDER } from "@/constants";
import React from "react";
import { Image, Pressable, Text } from "react-native";

interface ArtistCardProps {
  item: any;
  styles?: string;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ item, styles }) => {
  return (
    <Pressable
      className={`bg-secondary p-3 mr-3 rounded-md w-[200px] ${styles}`}
    >
      <Image
        source={{ uri: item?.images[0]?.url || ALBUM_PLACEHOLDER }}
        resizeMode="cover"
        className="w-full h-[150px] rounded-md"
      />
      <Text className="text-white text-lg font-semibold mt-2" numberOfLines={1}>
        {item?.name}
      </Text>
    </Pressable>
  );
};

export default ArtistCard;
