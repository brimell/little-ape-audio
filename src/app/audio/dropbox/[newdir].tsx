import { View, Text, SafeAreaView } from "react-native";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { Link, Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useNavigation } from "expo-router";
import CustomHeader from "../../../components/dropbox/CustomHeader";
import { sanitizeString, useDropboxStore } from "@store/store-dropbox";
import { AudioSourceLinkParams, AudioSourceType } from "./index";
import ExplorerAllContainer from "@components/dropbox/ExplorerAllContainer";

const NewDirectory = () => {
  const actions = useDropboxStore((state) => state.actions);
  const router = useRouter();
  const navigation = useNavigation();
  const { newdir, fullPath, backTitle, audioSource, yOffset, parentFolderId } =
    useLocalSearchParams<AudioSourceLinkParams>();

  const [prevDir, setPrevDir] = useState("");
  const audioSourceIn = audioSource as AudioSourceType;

  useEffect(() => {
    if (prevDir !== newdir) {
      actions.pushFolderNavigation({
        fullPath: fullPath || "/",
        backTitle,
        audioSource: audioSourceIn,
      });
    }
    setPrevDir(newdir);
  }, [newdir]);
  // console.log("NEWDIR-newdir", newdir);
  // console.log("NEWDIR-fulPath BackTitle", fullPath, backTitle);
  // Need a listener that will clear the dropbox store folderNavigation array
  // This is when the modal is dismissed
  navigation.addListener("beforeRemove", () => {
    actions.clearFolderNavigation();
  });

  const onPathChange = (newPath: string, folderName: string) => {
    router.push({
      pathname: `/audio/dropbox/${folderName}`,
      params: {
        fullPath: newPath,
        backTitle: folderName,
        audioSource: audioSourceIn || "dropbox",
        parentFolderId: fullPath,
      } as AudioSourceLinkParams,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerBackTitleVisible: false,
          headerBackVisible: false,
          header: () => (
            <CustomHeader
              title={fullPath || "/"}
              backText={backTitle}
              sessionAudioSource={audioSourceIn}
            />
          ),
        }}
      />
      {/* {audioSourceIn === "dropbox" ? (
        <ExplorerContainer
          pathIn={fullPath || ""}
          onPathChange={onPathChange}
          audioSource={audioSourceIn}
          yOffset={yOffset ? parseFloat(yOffset) : 0}
        />
      ) : ( */}
      <ExplorerAllContainer
        pathIn={fullPath || ""}
        onPathChange={onPathChange}
        audioSource={audioSourceIn}
        yOffset={yOffset ? parseFloat(yOffset) : 0}
        parentFolderId={parentFolderId}
      />
      {/* )} */}
    </SafeAreaView>
  );
};

export default NewDirectory;
