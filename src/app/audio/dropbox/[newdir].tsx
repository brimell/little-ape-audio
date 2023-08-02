import { View, Text, SafeAreaView } from "react-native";
import React, { useEffect, useLayoutEffect } from "react";
import { Link, Stack, useRouter, useLocalSearchParams } from "expo-router";
import ExplorerContainer from "../../../components/dropbox/ExplorerContainer";
import { useNavigation } from "expo-router";
import CustomHeader from "../../../components/dropbox/CustomHeader";
import { useDropboxStore } from "@store/store-dropbox";

type SearchParms = { fullPath: string; backTitle: string };
const NewDirectory = () => {
  const actions = useDropboxStore((state) => state.actions);
  const navigation = useNavigation();
  const router = useRouter();

  const { newdir, fullPath, backTitle } = useLocalSearchParams<SearchParms>();
  useEffect(() => {
    actions.pushFolderNavigation({ fullPath, backTitle });
  }, [newdir]);

  const onPathChange = (
    newPath: string,
    folderName: string,
    previousYOffset?: number
  ) => {
    // const trailingPath = newPath.slice(newPath.lastIndexOf("/") + 1);

    router.push({
      pathname: `/audio/dropbox/${folderName}`,
      params: {
        fullPath: newPath,
        backTitle: folderName,
      },
    });
  };
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerBackTitleVisible: false,
          headerBackVisible: false,
          header: () => <CustomHeader title={fullPath} backText={backTitle} />,
        }}
      />

      <ExplorerContainer pathIn={fullPath} onPathChange={onPathChange} />
    </SafeAreaView>
  );
};

export default NewDirectory;
