import { StyleSheet, View, SafeAreaView } from "react-native";
import PlaylistContainer from "../../src/components/playlists/PlaylistContainer";
import { usePlaybackStore } from "../../src/store/store";
import PlaylistTrackControl from "../../src/components/playlists/PlaylistTrackControl";

// const track: Track = {
//   id: "one",
//   url: require("../../assets/funk.mp3"),
//   artist: "Hunter McCoid",
//   artwork: require("../../assets/littleapeaudio.png"),
//   isLiveStream: true,
// };
export default function AudioScreen() {
  const isPlaylistLoaded = usePlaybackStore((state) => state.playlistLoaded);

  return (
    <SafeAreaView
      className={`flex-1 ${isPlaylistLoaded ? "bg-amber-200" : "bg-amber-50"}`}
    >
      <View className="flex-col justify-start flex-grow bg-amber-50">
        <PlaylistContainer />
        {isPlaylistLoaded && <PlaylistTrackControl />}
      </View>
    </SafeAreaView>
  );
}
