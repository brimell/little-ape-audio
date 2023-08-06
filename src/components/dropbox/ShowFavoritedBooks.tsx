import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Pressable,
} from "react-native";
import React from "react";
import { FolderMetadataArrayItem, useDropboxStore } from "@store/store-dropbox";
import { ScrollView } from "react-native-gesture-handler";
import { Link, useRouter } from "expo-router";
import { colors } from "@constants/Colors";
import DraggableFlatList, {
  OpacityDecorator,
  ScaleDecorator,
} from "react-native-draggable-flatlist";

const ShowFavoritedBooks = () => {
  // const dropboxActions = useDropboxStore(state => state.actions)
  // const favBooks = useFavoriteBooks();
  const favBooks = useDropboxStore((state) => state.favoritedBooks);
  const actions = useDropboxStore((state) => state.actions);
  const router = useRouter();

  const renderItem = ({
    item,
    drag,
    isActive,
  }: {
    item: FolderMetadataArrayItem;
    drag: any;
    isActive: boolean;
  }) => {
    return (
      <ScaleDecorator activeScale={0.98}>
        <View
          className="flex-1 flex-row bg-white w-full"
          key={item.id}
          style={{
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.amber900,
          }}
        >
          <Pressable
            onPressIn={drag}
            style={({ pressed }) => [
              {
                backgroundColor: pressed ? "rgb(210, 230, 255)" : "white",
                // scale: pressed ? 1.5 : 1,
                zIndex: 10,
              },
            ]}
            disabled={isActive}
            key={item.id}
            // className="px-2 border-r border-amber-900 h-full justify-center"
          >
            <View
              className="flex-col bg-white justify-start"
              style={styles.shadow}
            >
              <Image
                style={{ width: 50, height: "100%" }}
                source={item.imageURL}
              />
            </View>
          </Pressable>

          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: `/audio/dropbox/favBook`,
                params: {
                  fullPath: item.dropboxPathLower,
                  backTitle: "Back",
                },
              })
            }
          >
            <View className="flex-row justify-start w-full mb-1">
              <View className="flex-col justify-start w-full ">
                <Text className="font-semibold text-sm pl-3 bg-amber-500">
                  {item.categoryOne} - {item.categoryTwo}
                </Text>
                <Text className="text-base font-bold px-2" style={{}}>
                  {item.title}
                </Text>
                <Text className="text-base px-2" style={{}}>
                  by {item.author}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScaleDecorator>
    );
  };
  const onDragEnd = (data: FolderMetadataArrayItem[]) => {
    let newData = [] as FolderMetadataArrayItem[];
    for (let i = 0; i < data.length; i++) {
      newData.push({ ...data[i], position: i + 1 });
    }
    console.log(newData.map((el) => `${el.title}--${el.position}`));
    // save to store
    //!  Need to update all items positions
    //! how to send and how to update???
    actions.updateFoldersMetadataPosition(newData);
    // setExtra((prev) => !prev);
  };
  return (
    <DraggableFlatList
      nestedScrollEnabled={true}
      data={favBooks}
      renderPlaceholder={() => (
        <View className="bg-amber-300 w-full h-full">
          <Text></Text>
        </View>
      )}
      onDragEnd={({ data }) => onDragEnd(data)}
      // onDragEnd={({ data }) => actions.updateFavFolderArray(data)}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      style={{
        // maxHeight: 220,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.amber700,

        // borderRadius: 10,
      }}
    />
    // <ScrollView
    //   style={{ flexGrow: 1 }}
    //   // contentContainerStyle={{ flex: 1, width: "100%", height: "100%" }}
    // >
    //   {favBooks?.map((book) => {
    //     return (
    //       <View
    //         className="flex-1 bg-white w-full"
    //         key={book.id}
    //         style={{
    //           borderWidth: StyleSheet.hairlineWidth,
    //           borderColor: colors.amber900,
    //         }}
    //       >
    //         <TouchableOpacity
    //           onPress={() =>
    //             router.push({
    //               pathname: `/audio/dropbox/favBook`,
    //               params: {
    //                 fullPath: book.dropboxPathLower,
    //                 backTitle: "Back",
    //               },
    //             })
    //           }
    //         >
    //           <View className="flex-row justify-start w-full mb-1">
    //             <View
    //               className="flex-col bg-white justify-start"
    //               style={styles.shadow}
    //             >
    //               <Image
    //                 style={{ width: 50, height: "100%" }}
    //                 source={book.imageURL}
    //               />
    //             </View>
    //             <View className="flex-col justify-start w-full ">
    //               <Text className="font-semibold text-sm pl-3 bg-amber-500">
    //                 {book.categoryOne} - {book.categoryTwo}
    //               </Text>
    //               <Text className="text-base font-bold px-2" style={{}}>
    //                 {book.title}
    //               </Text>
    //               <Text className="text-base px-2" style={{}}>
    //                 by {book.author}
    //               </Text>
    //             </View>
    //           </View>
    //         </TouchableOpacity>
    //       </View>
    //      );
    //   })}
    // </ScrollView>
  );
};

const styles = StyleSheet.create({
  trackImage: {
    width: 100,
    height: 100 * 1.28,
    borderRadius: 10,
    resizeMode: "stretch",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.amber900,
  },
  shadow: {
    shadowColor: "#000000",
    shadowOffset: {
      width: 0.5,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 5.62,
  },
});

export default ShowFavoritedBooks;
