import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { Link, Stack } from "expo-router";
import { colors } from "../../constants/Colors";
import { BackIcon, HomeIcon } from "../../components/common/svg/Icons";
import Constants from "expo-constants";

const SettingsLayout = () => {
  const version = Constants?.expoConfig?.version;
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Settings",
          headerStyle: { backgroundColor: colors.amber200 },
          headerTintColor: colors.amber900,
          headerLeft: () => (
            <Link href="/audio" className="p-[10] ml-[-10]">
              <HomeIcon />
            </Link>
          ),
        }}
      />
      <Stack.Screen
        name="dropboxauth"
        options={{
          title: "Dropbox Auth",
          headerStyle: { backgroundColor: colors.amber200 },
          headerTintColor: colors.amber900,
        }}
      />
      <Stack.Screen
        name="managetracksroute"
        options={{
          title: "Manage Tracks",
          headerStyle: { backgroundColor: colors.amber200 },
          headerTintColor: colors.amber900,
        }}
      />
      <Stack.Screen
        name="managetracksmodal"
        options={{
          title: "Manage Tracks Modal",
          headerStyle: { backgroundColor: colors.amber200 },
          headerTintColor: colors.amber900,
          presentation: "modal",
          // headerShown: false,
        }}
      />
      <Stack.Screen
        name="foldermetadataroute"
        options={{
          title: "Folder Metadata Storage",
          headerStyle: { backgroundColor: colors.amber200 },
          headerTintColor: colors.amber900,
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="foldermetadatamodal"
        options={{
          title: "Folder Metadata Details",
          headerStyle: { backgroundColor: colors.amber200 },
          headerTintColor: colors.amber900,
          presentation: "card",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="[bookdir]"
        options={{
          title: "",
          headerStyle: { backgroundColor: colors.amber200 },
          headerTintColor: colors.amber900,
          presentation: "card",
          headerBackTitle: "Back",
          // headerBackTitleVisible: false,
          // headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="playarea"
        options={{
          title: "Play Area",
        }}
      />
    </Stack>
  );
};

export default SettingsLayout;
