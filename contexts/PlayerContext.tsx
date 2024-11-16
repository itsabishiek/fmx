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
      const songName = song?.track?.name;
      const artistName = song?.track?.artists?.[0]?.name;

      if (!songName || !artistName) {
        console.error("Invalid song data.");
        return;
      }

      // Check if the current song is already loaded
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync(); // Pause if already playing
          setIsPlaying(false);
        } else {
          await sound.playAsync(); // Play if paused
          setIsPlaying(true);
        }
        return; // Skip fetching the audio URL
      }

      // Load new song: Unload the previous sound if needed
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      setIsLoading(true);

      // Fetch song's audio URL
      const fetchAudioUrl = async () => {
        const res = await fetch(
          `https://saavn.dev/api/search/songs?query=${songName} ${artistName}`
        );

        if (!res.ok) {
          throw new Error(`Failed to fetch song data: ${res.statusText}`);
        }

        const songData = await res.json();
        return songData?.data?.results?.[0]?.downloadUrl?.[3]?.url;
      };

      const audioURL = await fetchAudioUrl();
      if (!audioURL) {
        console.error("No audio URL found.");
        return;
      }

      // Load and play the new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioURL },
        { shouldPlay: true, isLooping: false }
      );

      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error("play Error", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PlayerContext.Provider
      value={{ currentTrack, setCurrentTrack, play, isPlaying, isLoading }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export default PlayerContextProvider;
