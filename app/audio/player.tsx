import { Dimensions, View, Image, Text } from "react-native";
import React from "react";
import { Stack } from "expo-router";
import { usePlaybackStore } from "../../src/store/store";
import TrackPlayerContainer from "../../src/components/trackPlayer/TrackPlayerContainer";
const littleApeImage05 = require("../../assets/images/LittleApAudio05.png");

const { width, height } = Dimensions.get("window");
const PlaylistScreen = () => {
  const playlist = usePlaybackStore((state) => state.currentPlaylist);
  const imageSource =
    playlist?.imageType === "uri"
      ? { uri: playlist.imageURI }
      : playlist.imageURI;
  return (
    <View className="flex-1 bg-amber-50 pt-2">
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Text
              className="text-base font-bold text-amber-950 text-center"
              style={{ width: width / 1.35 }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {playlist.name}
            </Text>
          ),
        }}
      />
      <Image
        className="rounded-xl"
        style={{
          width: width / 1.25,
          height: width / 1.25,
          resizeMode: "stretch",
          alignSelf: "center",
        }}
        // source={{ uri: playlist.imageURI }}
        source={imageSource}
      />
      {/* <TrackPlaybackState />
      <Link href="./playersettings">Playlist Settings</Link> */}
      <TrackPlayerContainer />
    </View>
  );
};

export default PlaylistScreen;
