import { View, Text, StyleSheet, Pressable, TouchableOpacity } from "react-native";
import React from "react";
import {
  CloudDownloadIcon,
  DatabaseDownloadIcon,
  EyeOffOutlineIcon,
  EyeOutlineIcon,
} from "../common/svg/Icons";
import { MotiView } from "moti";
import { colors } from "@constants/Colors";
import { useDropboxStore } from "@store/store-dropbox";
import { useShallow } from "zustand/react/shallow";
import { AudioSourceType } from "@app/audio/dropbox";

type Props = {
  // currentPath: string;
  audioSource: AudioSourceType;
  fileCount: number;
  folderCount: number;
  // showMetadata: "on" | "off" | "loading";
  displayMetadata: boolean;
  handleDownloadAll: () => Promise<void>;
  handleDownloadMetadata: () => Promise<void>;
  handleDisplayMetadata: () => void;
};

const ExplorerActionBar = ({
  // currentPath,
  audioSource,
  fileCount,
  folderCount,
  // showMetadata,
  displayMetadata,
  handleDownloadAll,
  handleDownloadMetadata,
  handleDisplayMetadata,
}: Props) => {
  const metadataProcessingFlag = useDropboxStore(
    (state) => state.folderMetadataProcessingInfo.metadataProcessingFlag
  );
  const metadataCurrentTask = useDropboxStore(
    (state) => state.folderMetadataProcessingInfo.currentTask
  );
  // console.log("ActionBAr tasks", metadataCurrentTask, metadataProcessingFlag);
  return (
    <View className="flex flex-row items-center justify-end mt-1 pb-1 pr-2 border-b border-black">
      {/* DOWNLOAD METADATA Button */}
      {folderCount > 0 ? (
        <View
          className="flex flex-row justify-between items-center flex-1"
          style={{ display: audioSource === "google" ? "none" : "flex" }}
        >
          <TouchableOpacity onPress={handleDisplayMetadata} className="mx-2 ">
            {displayMetadata ? <EyeOutlineIcon /> : <EyeOffOutlineIcon />}
          </TouchableOpacity>
          <View className="mr-1 flex-1 items-center flex flex-row">
            {metadataProcessingFlag && (
              <Text lineBreakMode="tail" numberOfLines={2} className="flex-1">
                {metadataCurrentTask}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={async () => await handleDownloadMetadata()}
            className="mx-2"
            disabled={metadataProcessingFlag}
          >
            <MotiView
              key={metadataProcessingFlag.toString()}
              className=""
              from={{ opacity: 0.3 }}
              animate={{ opacity: 1 }}
              transition={{
                loop: metadataProcessingFlag ? true : false,
                type: "timing",
                duration: 500,
              }}
            >
              <DatabaseDownloadIcon
                color={metadataProcessingFlag ? colors.amber600 : colors.amber900}
              />
            </MotiView>
          </TouchableOpacity>
        </View>
      ) : (
        // This is a placeholder so the justify between keeps icons in correct place
        <View />
      )}

      {/* DOWNLOAD ALL Button */}
      {fileCount > 0 && (
        <View className="flex-shrink flex justify-end">
          <TouchableOpacity
            className="flex-row flex-grow items-center space-x-1 pl-2 py-1 "
            onPress={async () => await handleDownloadAll()}
          >
            <CloudDownloadIcon />
            <Text>All</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 5,
  },
});
export default ExplorerActionBar;
