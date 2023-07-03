import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  FolderEntry,
  downloadDropboxFile,
  getDropboxFileLink,
  listDropboxFiles,
} from "../../utils/dropboxUtils";
import {
  EmptyMDHeartIcon,
  FolderClosedIcon,
  MDHeartIcon,
} from "../common/svg/Icons";
import {
  createFolderMetadataKey,
  getSingleFolderMetadata,
  useDropboxStore,
  useFolderMeta,
} from "../../store/store-dropbox";
import { colors } from "../../constants/Colors";
import {
  CleanBookMetadata,
  FolderMetadata,
  cleanOneBook,
} from "../../utils/audiobookMetadata";
import ExplorerFolderRow from "./ExplorerFolderRow";
import { MotiView } from "moti";
import { defaultImages } from "../../store/storeUtils";
import * as FileSystem from "expo-file-system";
import { downloadToFileSystem } from "../../store/data/fileSystemAccess";

type Props = {
  folder: FolderEntry;
  index: number;
  onNavigateForward: (path: string, folderName: string) => void;
  showFolderMetadata: "on" | "off" | "loading";
  folderMetadata: Partial<CleanBookMetadata>;
};

const ExplorerFolder = ({
  folder,
  index,
  onNavigateForward,
  showFolderMetadata = "on",
  folderMetadata,
}: Props) => {
  const [isFavorite, setIsFavorite] = useState(!!folder.favorited);
  const actions = useDropboxStore((state) => state.actions);
  const [metadataInfo, setMetadataInfo] = useState(folderMetadata);
  // const metadataInfo = useFolderMeta(folder.path_lower);
  // Stores Metadata info if requested
  // const metadataInfo = useMemo(() => meta, [meta]);
  // const [metadataInfo, setMetadataInfo] = useState();
  const [folderMetaState, setFolderMetaState] = useState<
    "on" | "off" | "loading"
  >("off");

  // Using local state for passed in show flag and metadata
  // because we allow reload of metadata from a single row with
  // a long press
  useEffect(() => {
    // setFolderMetaState(showFolderMetadata);
    setMetadataInfo(folderMetadata);
  }, [showFolderMetadata, folderMetadata]);

  const setFavorite = async () => {
    if (isFavorite) {
      setIsFavorite(false);
      await actions.removeFavorite(folder.path_lower);
    } else {
      setIsFavorite(true);
      await actions.addFavorite(folder.path_lower);
    }
  };

  //~ ----------------------------
  //~ Download Function
  //~ ----------------------------
  const downloadFolderMetadata = async () => {
    // console.log("starting manual download", folder.path_lower);
    // Start download and parse
    setFolderMetaState("loading");

    const convertedMetadata = await getSingleFolderMetadata(folder);
    // Create key and store the data in the dropbox store
    const metadataKey = createFolderMetadataKey(folder.path_lower);
    actions.addFoldersMetadata({ [metadataKey]: convertedMetadata });

    setMetadataInfo(convertedMetadata);
    setFolderMetaState("on");
  };

  return (
    <View
      style={{
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.amber700,
        backgroundColor: index % 2 === 0 ? colors.amber100 : colors.amber50,
        flex: 1,
        paddingBottom: 5,
      }}
    >
      <TouchableOpacity
        onPress={() => onNavigateForward(folder.path_lower, folder.name)}
        onLongPress={downloadFolderMetadata}
        key={folder.id}
      >
        <MotiView
          key={`${showFolderMetadata}-${metadataInfo?.id}`}
          from={{ opacity: 0.3 }}
          animate={{ opacity: 1 }}
          transition={{
            loop:
              (showFolderMetadata === "loading" && !metadataInfo) ||
              folderMetaState === "loading"
                ? true
                : false,
            type: "timing",
            duration: 500,
          }}
          style={{
            flexDirection: "row",
            flexGrow: 1,
            alignItems: "center",
            paddingHorizontal: 8,
          }}
          className={`${
            (showFolderMetadata === "loading" && !metadataInfo) ||
            folderMetaState === "loading"
              ? "bg-amber-600"
              : ""
          }`}
        >
          <FolderClosedIcon color="#d97706" />
          <Text
            style={{ marginLeft: 10, flex: 1 }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {folder.name}
          </Text>
          <TouchableOpacity
            className="border-l border-l-gray-400 pl-2 w-[35] py-2"
            onPress={setFavorite}
          >
            {isFavorite && <MDHeartIcon color="#74be73" />}
            {!isFavorite && <EmptyMDHeartIcon color="gray" />}
          </TouchableOpacity>
        </MotiView>
      </TouchableOpacity>
      <View className="mb-0">
        <ExplorerFolderRow
          showMetadata={
            folderMetaState !== "off" || showFolderMetadata !== "off"
          }
          metadata={metadataInfo}
          index={index}
          key="data"
        />
      </View>
      {/* {folderMetaState !== "off" || showFolderMetadata !== "off" ? (
        <View className="mb-2">
          <ExplorerFolderRow metadata={metadataInfo} index={index} key="data" />
        </View>
      ) : (
        <ExplorerFolderRow metadata={undefined} index={index} key="empty" />
      )} */}
    </View>
  );
};

export default React.memo(ExplorerFolder);
