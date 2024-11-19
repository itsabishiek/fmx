import { createContext, useContext, useState } from "react";
import { Audio } from "expo-av";

export const PlayerContext = createContext({});
export const usePlayerContext = () => useContext<any>(PlayerContext);

const PlayerContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<any>();
  const [sound, setSound] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const play = async (song: any) => {
    try {
      setIsLoading(true);

      const songName = song?.track?.name;
      const artistName = song?.track?.artists?.[0]?.name;

      if (!songName || !artistName) {
        console.error("Invalid song data.");
        return;
      }

      const res = await fetch(
        `https://saavn.dev/api/search/songs?query=${songName} ${artistName}`
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch song data: ${res.statusText}`);
      }

      const songData = await res.json();
      const audioURL = songData?.data?.results?.[0]?.downloadUrl?.[3]?.url;
      if (!audioURL) {
        console.error("No audio URL found.");
        return;
      }

      // Load and play the new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioURL },
        { shouldPlay: true, isLooping: false }
      );

      // Clean up the previous sound if necessary
      if (sound) {
        await sound.unloadAsync();
      }

      setSound(newSound);
      setIsLoading(false);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error("play Error", error);
    }
  };

  const playpause = async () => {
    // Check if the current song is already loaded
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync(); // Pause if already playing
        setIsPlaying(false);
      } else {
        await sound.playAsync(); // Play if paused
        setIsPlaying(true);
      }
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        setCurrentTrack,
        sound,
        setSound,
        play,
        isPlaying,
        setIsPlaying,
        isLoading,
        setIsLoading,
        playpause,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export default PlayerContextProvider;
