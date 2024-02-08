import {
  loadFromAsyncStorage,
  removeFromAsyncStorage,
  saveToAsyncStorage,
} from "./data/asyncStorage";
import { useTracksStore } from "./store";
import { useDropboxStore } from "./store-dropbox";
import { useSettingStore } from "./store-settings";
import { Playlist, defaultCollections } from "./types";

//~ ----------------------------------
//~ ON INITIALIZE
//~ ----------------------------------
export const onInitialize = async () => {
  // await removeFromAsyncStorage("playlists");
  // await removeFromAsyncStorage("favfolders");
  // await removeFromAsyncStorage("foldermetadata");
  // await removeFromAsyncStorage("settings");
  const tracks = await loadFromAsyncStorage("tracks");
  // const tracks = tracksx.map((el) => ({
  //   ...el,
  //   metadata: { ...el.metadata, chapters: undefined },
  // }));
  const playlists = await loadFromAsyncStorage("playlists");
  const favFolders = await loadFromAsyncStorage("favfolders");
  const folderMetadata = await loadFromAsyncStorage("foldermetadata");
  const folderAttributes = await loadFromAsyncStorage("folderattributes");
  const folderMetadataErrors = await loadFromAsyncStorage("foldermetadataerrors");
  const collections = await loadFromAsyncStorage("collections");
  const settings = await loadFromAsyncStorage("settings");

  useTracksStore.setState({
    tracks: tracks || [],
    playlists: playlists || {},
    collections: collections || defaultCollections,
  });

  // ******************
  // * patch favFolders
  if (favFolders) {
    const patchedFavs =
      favFolders &&
      favFolders.map((folder) => ({
        ...folder,
        audioSource: folder?.audioSource ? folder.audioSource : "dropbox",
      }));
    saveToAsyncStorage("favfolders", patchedFavs);
    useDropboxStore.setState({ favoriteFolders: patchedFavs });
  }
  // * Patch playlist collections
  if (playlists) {
    for (const key of Object.keys(playlists)) {
      if (!playlists[key]?.collection) {
        playlists[key].collection = {};
      }
    }
  }
  // ******************

  useDropboxStore.setState({
    folderMetadata: folderMetadata,
    folderAttributes: folderAttributes || [],
    folderMetadataErrors,
  });

  useSettingStore.setState({
    ...settings,
    jumpForwardSeconds: settings?.jumpForwardSeconds || 15,
    jumpBackwardSeconds: settings?.jumpBackwardSeconds || 15,
  });

  return;
};
