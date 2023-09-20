import { Image } from "react-native";
import uuid from "react-native-uuid";
import { create } from "zustand";
import { saveToAsyncStorage } from "./data/asyncStorage";
import {
  DropboxDir,
  FolderEntry,
  downloadDropboxFile,
  getDropboxFileLink,
  listDropboxFiles,
} from "../utils/dropboxUtils";
import {
  CleanBookMetadata,
  BookJSONMetadata,
  cleanOneBook,
} from "./../utils/audiobookMetadata";
import { defaultImages, getRandomNumber } from "./storeUtils";
import {
  downloadToFileSystem,
  getCleanFileName,
} from "./data/fileSystemAccess";
import sortBy from "lodash/sortBy";
import { useTracksStore } from "./store";
import * as FileSystem from "expo-file-system";
import { update } from "lodash";

//-- ==================================
//-- DROPBOX STORE
//-- ==================================
export type FavoriteFolders = {
  id: string;
  folderPath: string;
  // order position when displaying
  position: number;
};

//! New Folder Metadata Types
// The PathInKey is full path to the booksFolder run through the "sanitizeString" function
type PathInKey = string;
export type FolderMetadata = Record<PathInKey, FolderMetadataDetails>;
// The PathInKey is full path to the book folder name run through the "sanitizeString" function
type FolderNameKey = string;
export type FolderMetadataDetails = Record<FolderNameKey, CleanBookMetadata>;

//! NEW FolderAttributes (Favorite and Read)
export type FolderAttributeItem = {
  id: string;
  pathToFolder: string;
  isFavorite?: boolean;
  isRead?: boolean;
  favPosition?: number;
  readPosition?: number;
  imageURL?: string;
  author?: string;
  title?: string;
  categoryOne?: string;
  categoryTwo?: string;
  genre?: string;
  flagForDelete?: boolean;
};

//! Old Folder Metadata types
// export type FolderMetadataDetails = Partial<CleanBookMetadata> & {
//   isFavorite?: boolean;
//   isRead?: boolean;
//   position?: number;
// };

// export type FolderMetadataArrayItem = FolderMetadataDetails & {
//   key: string;
//   position?: number;
// };
//!
export type MetadataErrorObj = {
  dropboxPath: string;
  folderName: string;
  metadataFileName: string;
  error: string;
};

type FolderNavigation = {
  fullPath: string;
  backTitle: string;
  yOffset?: number;
};

type DropboxState = {
  // Array of objects that contain folders that were starred by user in app
  favoriteFolders: FavoriteFolders[];
  // When a user tell a directory to be "read" the metadata for every folder
  // is stored in this object.
  folderMetadata: FolderMetadata;
  folderMetadataErrors: MetadataErrorObj[];
  // Currently store the isFavorite and isRead flags
  folderAttributes: FolderAttributeItem[];
  // This is a derived array created from the folderMetadata object
  // created for easier display of folderMetadata
  folderMetadataArray: FolderMetadataArrayItem[];
  // Generated list of favorited books.  generated by same function as the folderMetadataArray
  favoritedBooks: FolderMetadataArrayItem[];
  // When navigating audio sources (right now dropbox), this store the
  // directories so that the user can navigate backwards along same path
  folderNavigation: FolderNavigation[];
  actions: {
    // Add a folder navigation entry to the folderNavigation array
    pushFolderNavigation: (nextPath: FolderNavigation) => void;
    // Update the current foldernavigation entry with the yOffset value
    updateFolderNavOffset: (yOffset: number) => void;
    // Returns the dropbox path to go to when the back button is pressed.
    popFolderNavigation: () => FolderNavigation;
    clearFolderNavigation: () => void;
    updateFolderAttribute: (
      id: string,
      type: "isFavorite" | "isRead",
      action: "add" | "remove"
    ) => Promise<void>;
    addFavorite: (favPath: string) => Promise<void>;
    removeFavorite: (favPath: string) => Promise<void>;
    isFolderFavorited: (folders: FolderEntry[]) => FolderEntry[];
    updateFavFolderArray: (favFolders: FavoriteFolders[]) => void;
    // --  FOLDER METADATA ---
    addFolderMetadata: (
      newFolderMetadata: FolderMetadataDetails,
      path_lower: string,
      saveToStorage?: boolean
    ) => Promise<void>;
    addFoldersMetadata: (
      newFoldersObj: Record<string, FolderMetadataDetails>
    ) => Promise<void>;
    // merge new bookFolders detail object into the passed folderKey
    mergeFoldersMetadata: (
      folderKey: string,
      newBookFoldersObj: FolderMetadataDetails
    ) => Promise<void>;
    updateFoldersAttributePosition: (
      type: "favPosition" | "readPosition",
      newInfo: FolderAttributeItem[]
    ) => Promise<void>;
    getFolderMetadata: (path_lower: string) => FolderMetadataDetails;
    clearFolderMetadata: () => Promise<void>;
    // convert folderMetadata object into an array to facilitate
    // displaying the information and searching
    generateFolderMetadataArray: () => void;
    getFavoritedBooks: () => FolderMetadataArrayItem[];
    addMetadataError: (error: MetadataErrorObj) => Promise<void>;
    clearMetadataError: () => Promise<void>;
  };
};
export const useDropboxStore = create<DropboxState>((set, get) => ({
  favoriteFolders: [],
  folderMetadata: {},
  folderMetadataArray: [],
  folderMetadataErrors: [],
  folderAttributes: [],
  favoritedBooks: [],
  folderNavigation: [],
  actions: {
    pushFolderNavigation: (nextPathInfo) => {
      const nav = [...get().folderNavigation];
      nav.push(nextPathInfo);
      // console.log("folderNav", nav);
      set({ folderNavigation: nav });
    },
    updateFolderNavOffset: (yOffset) => {
      const nav = [...get().folderNavigation];
      nav[nav.length - 1] = { ...nav[nav.length - 1], yOffset };
      set({ folderNavigation: nav });
    },
    popFolderNavigation: () => {
      const nav = [...get().folderNavigation];
      nav.pop();
      const prevPath = nav.pop();
      set({ folderNavigation: nav || [] });
      return prevPath;
    },
    clearFolderNavigation: () => {
      set({ folderNavigation: [] });
    },
    updateFolderAttribute: async (pathIn, type, action) => {
      const id = createFolderMetadataKey(pathIn);
      const attributes = [...get().folderAttributes];
      let currAttribute = attributes?.find((el) => el.id === id);
      if (!currAttribute) {
        // If currAttrtibute doesn't exist, means we are creating it
        // so must grab the image from folderMetadata.
        const { pathToFolderKey, pathToBookFolderKey } =
          extractMetadataKeys(pathIn);
        const bookMetadata =
          get().folderMetadata?.[pathToFolderKey]?.[pathToBookFolderKey];
        const imageURL = bookMetadata?.imageURL
          ? bookMetadata.imageURL
          : bookMetadata?.localImageName
          ? `${FileSystem.documentDirectory}${bookMetadata.localImageName}`
          : bookMetadata.defaultImage;
        // Push a new attribute into the array.  It will be process in tne for loop
        attributes.push({
          id,
          pathToFolder: pathIn,
          imageURL: imageURL,
          title: bookMetadata.title,
          author: bookMetadata.author,
          categoryOne: bookMetadata.categoryOne,
          categoryTwo: bookMetadata.categoryTwo,
        });
      }

      for (let i = 0; i < attributes.length; i++) {
        if (attributes[i].id === id) {
          attributes[i] = { ...attributes[i], [type]: !!(action === "add") };
        }
        if (!attributes[i]?.isFavorite && !attributes[i]?.isRead) {
          attributes[i].flagForDelete = true;
        }
      }
      //REMOVE any items flagged for delete
      const finalAttributes = attributes.filter((el) => !el?.flagForDelete);

      //! May have to calculate favPosition and readPosition if they don't exists
      set({ folderAttributes: attributes });
      //!!!!!! IMPLEMENT Save to file system ()
      await saveToAsyncStorage("folderattributes", finalAttributes);
    },
    addFavorite: async (favPath) => {
      const favs = [...(get().favoriteFolders || [])];
      const newFav: FavoriteFolders = {
        id: uuid.v4() as string,
        folderPath: favPath,
        position: favs.length + 1,
      };
      const updatedFolders = [...favs, newFav];
      set({ favoriteFolders: updatedFolders });
      saveToAsyncStorage("favfolders", updatedFolders);
    },
    removeFavorite: async (favPath) => {
      const currFavs = [...(get().favoriteFolders || [])];
      const updatedFavs = currFavs.filter((el) => el.folderPath !== favPath);
      const finalFavs = updatedFavs.map((fav, index) => ({
        ...fav,
        position: index + 1,
      }));
      set({ favoriteFolders: finalFavs });
      saveToAsyncStorage("favfolders", finalFavs);
    },
    updateFavFolderArray: (favFolders) => {
      set({ favoriteFolders: favFolders });
      saveToAsyncStorage("favfolders", favFolders);
    },
    isFolderFavorited: (folders) => {
      const currFavs = get().favoriteFolders || [];
      const sourceArray = currFavs.map((el) => el.folderPath);

      let taggedFolders = [];
      if (Array.isArray(folders)) {
        for (const source of folders) {
          const isFavorited = sourceArray.includes(source.path_lower);
          taggedFolders.push({ ...source, favorited: isFavorited });
        }
      }

      return taggedFolders as FolderEntry[];
    },
    addFolderMetadata: async (newFolderMetadata, path_lower) => {
      const currMetadata = get().folderMetadata;
      const metadataKey = createFolderMetadataKey(path_lower);

      const newData = {
        ...currMetadata[metadataKey],
        ...newFolderMetadata,
      };

      const folderMetadata = { ...currMetadata, [metadataKey]: newData };
      set({ folderMetadata });
      get().actions.generateFolderMetadataArray();
      await saveToAsyncStorage("foldermetadata", folderMetadata);
    },
    addFoldersMetadata: async (newFoldersObj) => {
      const folderMetadata = { ...get().folderMetadata, ...newFoldersObj };
      set((state) => ({
        folderMetadata,
      }));
      get().actions.generateFolderMetadataArray();
      await saveToAsyncStorage("foldermetadata", folderMetadata);
    },
    //! NEW FolderMetada-NEW
    mergeFoldersMetadata: async (folderKey, newBookFoldersObj) => {
      const folderMetadata = { ...get().folderMetadata };
      // The newBookFoldersObj is empty or undefined, bail on function
      // we don't want to save empty keys
      if (
        !newBookFoldersObj ||
        Object.keys(newBookFoldersObj || {}).length === 0
      ) {
        return;
      }
      folderMetadata[folderKey] = {
        ...folderMetadata[folderKey],
        ...newBookFoldersObj,
      };
      set((state) => ({
        folderMetadata,
      }));
      // get().actions.generateFolderMetadataArray();
      await saveToAsyncStorage("foldermetadata", folderMetadata);
    },
    updateFoldersAttributePosition: async (type, newInfo) => {
      const copyFolderAttributes = [...get().folderAttributes];
      // Loop through the updated attributes and update the position
      for (const newAttrib of newInfo) {
        const index = copyFolderAttributes.findIndex(
          (el) => el.id === newAttrib.id
        );
        if (index) {
          copyFolderAttributes[index] = {
            ...copyFolderAttributes[index],
            [type]: newAttrib[type],
          };
        }
      }

      set({ folderAttributes: copyFolderAttributes });
      await saveToAsyncStorage("folderattributes", copyFolderAttributes);
    },
    getFolderMetadata: (path_lower: string) => {
      const key = createFolderMetadataKey(path_lower);
      return get().folderMetadata?.[key];
    },
    clearFolderMetadata: async () => {
      set({ folderMetadata: {} });
      set({ folderMetadataArray: [] });
      await saveToAsyncStorage("foldermetadata", {});
    },
    generateFolderMetadataArray: () => {
      let folderMetadataArray = [];
      for (const [key, value] of Object.entries(get().folderMetadata)) {
        folderMetadataArray.push({ key, ...value });
      }
      // Get favorite books
      let favBooks = [] as FolderMetadataArrayItem[];
      let i = 1;
      for (const book of folderMetadataArray) {
        if (book.isFavorite) {
          favBooks.push(book);
        }
      }
      // Sort by position field
      favBooks = sortBy(favBooks, ["position"]);
      // If no position give it one
      favBooks.map((el, index) => ({ position: index + 1, ...el }));

      set({ folderMetadataArray, favoritedBooks: favBooks });
    },
    getFavoritedBooks: () => {
      let favBooks = [];
      const books = get().folderMetadataArray;
      for (const book of books) {
        if (book.isFavorite) {
          favBooks.push(book);
        }
      }
      return favBooks;
    },
    addMetadataError: async (error) => {
      const folderMetadataErrors = [
        error,
        ...(get().folderMetadataErrors || []),
      ];
      set({ folderMetadataErrors });
      await saveToAsyncStorage("foldermetadataerrors", folderMetadataErrors);
    },
    clearMetadataError: async () => {
      set({ folderMetadataErrors: [] });
      await saveToAsyncStorage("foldermetadataerrors", []);
    },
  },
}));
export const useFavoriteBooks = () => {
  return useDropboxStore.getState().actions.getFavoritedBooks();
};

export const useFolderMeta = (folderId) => {
  const currMeta = useDropboxStore.getState().folderMetadata;
  return currMeta?.[folderId];
};

//------------------------------------------------------
//-- FOLDER FILE READER FUNCTIONS
//------------------------------------------------------
function filterAudioFiles(filesAndFolders: DropboxDir) {
  const files = filesAndFolders.files;
  const AUDIO_FORMATS = [
    "mp3",
    "mb4",
    "m4a",
    "m4b",
    "wav",
    "aiff",
    "aac",
    "ogg",
    "wma",
    "flac",
  ];
  const newFiles = files.filter((file) =>
    AUDIO_FORMATS.includes(file.name.slice(file.name.lastIndexOf(".") + 1))
  );
  return { folders: filesAndFolders.folders, files: newFiles };
}

//~~=================================
//~~ Read folders and file from Dropbox or other service
//~~ focused on dropbox only now.
//~~=================================
export const folderFileReader = async (pathIn: string) => {
  const trackActions = useTracksStore.getState().actions;
  const dropboxActions = useDropboxStore.getState().actions;
  try {
    const files = await listDropboxFiles(pathIn);

    const filteredFoldersFiles = filterAudioFiles(files);
    // tag tracks as being already downloaded
    const taggedFiles = trackActions.isTrackDownloaded(
      filteredFoldersFiles.files
    );
    // Tag folders as being favorited
    const taggedFolders = dropboxActions.isFolderFavorited(
      filteredFoldersFiles.folders
    );
    const finalFolderFileList: DropboxDir = {
      folders: taggedFolders, //filteredFoldersFiles.folders,
      files: taggedFiles,
    };
    //- Success reading directory, return data
    return finalFolderFileList;
  } catch (err) {
    console.log(err);
    throw new Error("folderFileReader Error" + err);
  }
};
//------------------------------------------------------
//------------------------------------------------------
//~ ===================================
//~ Download Function Metadata FUNCIONS
//~ ===================================
//~ downloadFolderMetadata
export const downloadFolderMetadata = async (folders: FolderEntry[]) => {
  // If we already downloaded metadata do not do it again!
  let foldersToDownload = [];
  const foldersMetadata = useDropboxStore.getState().folderMetadata;

  // 1. First, grab the first entry in the "folders" and extract the path to the folder name
  const pathToFolder = folders[0].path_lower.slice(
    0,
    folders[0].path_lower.lastIndexOf("/")
  );
  // console.log("store-dropbox", pathToFolder);
  // 2. create folderMetadataKey used in for loop to check
  //   for data in folderMetadata store
  const folderMetadataKey = sanitizeString(pathToFolder);

  for (const folder of folders) {
    const folderNameKey = sanitizeString(
      folder.path_lower.slice(folder.path_lower.lastIndexOf("/") + 1)
    );

    //! Check if we have metadata in zustand store
    const folderMetadata =
      foldersMetadata?.[folderMetadataKey]?.[folderNameKey];
    if (!folderMetadata) {
      foldersToDownload.push(folder);
    }
  }
  // Bail there are no folders to download (i.e. they exist in the store)
  if (foldersToDownload.length === 0) return;

  // START DOWNLOAD
  let chunkedFolders = [];
  const CHUNK_SIZE = 10;
  chunkedFolders = chunkArray(foldersToDownload, CHUNK_SIZE);

  const promises = chunkedFolders.map((chunk) => getArrayOfPromises(chunk));

  const delayedPromises = [];
  for (let i = 0; i < promises.length; i++) {
    delayedPromises.push(
      new Promise(
        (resolve) =>
          setTimeout(() => {
            processPromises(promises[i], folderMetadataKey);
            resolve(undefined);
          }, i * 800 * CHUNK_SIZE) // Give each record in chunk 900 ms to process (keeps rate limit error from api at bay)
      )
    );
  }
  await Promise.all(delayedPromises);
  // console.log(useDropboxStore.getState().folderMetadata);
};
//~ -------------------------
//~ downloadFolderMetadata
//~ -------------------------
export const getSingleFolderMetadata = async (folder) => {
  //! Since we didn't have it in the store, download it
  // Start download and parse
  const randomNum = getRandomNumber();
  const dropboxFolder = await listDropboxFiles(folder.path_lower);
  const metadataFile = dropboxFolder.files.find(
    (entry) => entry.name.includes("metadata") && entry.name.endsWith(".json")
  );
  // Look for local image file
  const localImage = dropboxFolder.files.find(
    (entry) => entry.name.endsWith(".jpg") || entry.name.endsWith(".png")
  );

  let finalCleanImageName = "";

  let convertedMeta: CleanBookMetadata;
  if (metadataFile) {
    try {
      // console.log("PATH", metadataFile.path_lower);
      const metadata = (await downloadDropboxFile(
        `${metadataFile.path_lower}`
      )) as BookJSONMetadata;

      //-- LOCAL IMAGE CHECK
      // Check to see if there is a google image, if not look for one it directory
      // Don't want to check every time, dropbox will throw 429 rate limit error
      if (!metadata?.googleAPIData?.imageURL && localImage) {
        finalCleanImageName = await getLocalImage(localImage, folder.name);
      }
      convertedMeta = cleanOneBook(
        metadata,
        folder.path_lower,
        finalCleanImageName
      );
    } catch (error) {
      const errorObj = {
        dropboxPath: folder.path_lower,
        folderName: folder.name,
        metadataFileName: metadataFile.name,
        error,
      };
      await useDropboxStore.getState().actions.addMetadataError(errorObj);
      // Alert.alert(
      //   "Error Downloading Metadata File",
      //   `Error downloading "${metadataFile.name}" with ${error.message}`
      // );
    }
  } else {
    //!!! Here is where we can decide if NO metadata file, do we do anything??
    //!! Maybe if there is an image??
    //!! If we send any converted metadata, it will take up space in our list
    //!! We probably only want to store stuff that has real book data in it.
    // This means we did NOT find any ...metadata.json file build minimal info
    // if (localImage) {
    //   finalCleanImageName = await getLocalImage(localImage, folder.name);
    // }
    // convertedMeta = {
    //   id: folder.path_lower,
    //   title: folder.name,
    //   localImageName: finalCleanImageName,
    //   defaultImage: Image.resolveAssetSource(defaultImages[`image${randomNum}`])
    //     .uri,
    // } as Partial<CleanBookMetadata>;
  }
  return convertedMeta;
};

//~===========================================
//~ GET LOCAL IMAGE --
//~===========================================
async function getLocalImage(localImage, folderName) {
  // Get extension
  const localImageExt = localImage.name.slice(localImage.name.length - 4);
  // Create full file name
  //NOTE: we are using the base folder name for the image name NOT the actual filename
  //    this is why we are tacking on the extension
  const localImageName = `localimages_${folderName}${localImageExt}`;
  // Get the dropbox link to image file
  const localImageURI = await getDropboxFileLink(`${localImage.path_lower}`);
  // Download and store the image locally
  const { uri, cleanFileName } = await downloadToFileSystem(
    localImageURI,
    localImageName
  );
  return cleanFileName;
}
//~ ------------------------------
//~ Chunk passed array into smaller arrays
//~ ------------------------------
function chunkArray(array: any[], chunkSize: number) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

//~===========================================
//~ getArrayOfPromises --
//~ Creates an array of promises with the getSingleFolderMetadata function
//~ We will be getting "chunks" as arrays of promises (default 10 at a time)
//~===========================================
function getArrayOfPromises(arr: FolderEntry[]) {
  return arr.map(async (folder) => {
    const returnMeta = await getSingleFolderMetadata(folder);

    if (!returnMeta) return;

    const folderNameKey = sanitizeString(
      folder.path_lower.slice(folder.path_lower.lastIndexOf("/") + 1)
    );
    // const metadataKey = createFolderMetadataKey(folder.path_lower);
    return { [folderNameKey]: returnMeta };
  });
}

//~===========================================
//~ processPromises --
//~ When called it resolves the promises and processes
//~ the return data. That data goes into folder Metadata object
//~ Lastly it stores that data to the Zustand store (and to async storage)
//~===========================================
/**
 *
 * {
 * "folder_key": {
 *  "book_key": {
 *      id: "",
 *      title: "",
 *      other book metadata...
 *      Maybe-isFavorite
 *      Maybe-hasRead
 *    }
 *   ...
 * },
 *  ...
 * }
 */
async function processPromises(promises, folderMetadataKey) {
  const folderMetadataArray = await Promise.all(promises);
  // console.log("FMD", folderMetadataArray[0]);
  const currMetadata = useDropboxStore.getState().folderMetadata;
  const folderMetaObj = folderMetadataArray.reduce((final, el) => {
    // If the getSingleFolderMetadata function doesn't find any metata.json file
    // don't save anything for that folder
    if (!el) return final;
    //! el will = { [folderNameKey]: { ...returnMeta } },
    // each el will have one object with one key.  Grab that key and it will be the folderNameKey
    const folderNameKey = Object.keys(el)[0];
    // load up the final object
    return { ...final, [folderNameKey]: el[folderNameKey] };
  }, {}) as FolderMetadataDetails;
  // console.log("in PROCESS PROMISES", folderMetadataArray.length);
  // Save to store
  const folderMetadata = {
    ...currMetadata,
    [folderMetadataKey]: folderMetaObj,
  };

  await useDropboxStore
    .getState()
    .actions.mergeFoldersMetadata(folderMetadataKey, folderMetaObj);
}

//~ -------------------------
//~ createFolderMetadataKey
//~ -------------------------
export function createFolderMetadataKey(pathIn: string) {
  const pathArr = pathIn.split("/");
  let finalKey = [];
  for (var i = pathArr.length - 1; i >= pathArr.length - 2; i--) {
    if (pathArr[i]) {
      finalKey.push(sanitizeString(pathArr[i]));
    }
  }
  return finalKey.reverse().join("_");
}

function sanitizeString(stringToKey: string) {
  return stringToKey.replace(/[^/^\w.]+/g, "_").replace(/_$/, "");
}

//~ -------------------------
//~ extractMetadataKeys
//~ Takes a full path to a book folder '/mark/myAudiobooks/fiction/BookTitle
//~ and return two keys that can be used to check the folderMetadata object
//~ folderMetadata[pathToFolderKey][pathToBookFolderKey]
//~ -------------------------
export function extractMetadataKeys(pathIn: string) {
  const fullPath = pathIn.toLocaleLowerCase();
  const pathToFolderKey = sanitizeString(
    fullPath.slice(0, fullPath.lastIndexOf("/"))
  );
  const pathToBookFolderKey = sanitizeString(
    fullPath.slice(fullPath.lastIndexOf("/") + 1)
  );

  return {
    pathToFolderKey,
    pathToBookFolderKey,
  };
}
