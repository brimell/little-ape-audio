import { View, Text, Pressable, ScrollView, TouchableOpacity } from "react-native";
import React from "react";
import { useFocusEffect } from "expo-router";
import ABSAdvSearchGenres from "./ABSAdvSearchGenres";
import ABSAdvSearchTags from "./ABSAdvSearchTags";
import HiddenContainer from "@components/common/hiddenContainer/HiddenContainer";
import { useABSStore } from "@store/store-abs";
import ABSResultSearchInputText from "./ABSSearchInputText";
import { useGetAllABSBooks } from "@store/data/absHooks";
import { CheckCircleIcon, EmptyCircleIcon } from "@components/common/svg/Icons";
import { colors } from "@constants/Colors";

const buildExtraInfo = (selectedItems: string[]) => {
  if (!selectedItems || selectedItems?.length === 0) return "";

  return `${selectedItems[0]} ${
    selectedItems?.length > 1 ? `+ ${selectedItems.length - 1} more` : ""
  } `;
};
const ABSAdvSearchContainer = () => {
  useFocusEffect(() => {
    // console.log("Focuse Effect - ABSAdvSearchContianer.tsx");
    // return () => console.log("UNMOUNT focus effect-ABSAdvSearchContianer");
  });
  const searchObject = useABSStore((state) => state.searchObject);
  const { selectedBookCount } = useGetAllABSBooks();
  const updateSearchObject = useABSStore((state) => state.actions.updateSearchObject);
  const updateDescription = (description: string) => {
    updateSearchObject({ description });
  };

  return (
    <View className="bg-abs-50 h-full">
      <View className="p-1 border-b border-abs-800 mb-2 flex-row justify-center bg-abs-400">
        <Text className="text-lg font-semibold text-abs-950">Advanced Search</Text>
      </View>
      <View className="flex-row justify-center">
        <Text className="text-base font-semibold">
          Matched {selectedBookCount === -1 ? 0 : selectedBookCount} Books
        </Text>
      </View>
      <ScrollView className="flex-col bg-abs-50" contentContainerStyle={{}}>
        <View className="flex-row justify-between mr-3">
          <TouchableOpacity
            className="mt-2 mb-2"
            onPress={() => updateSearchObject({ favorites: !searchObject.favorites })}
          >
            <View className="ml-2 flex-row items-center">
              {searchObject.favorites ? (
                <>
                  <CheckCircleIcon size={20} color={colors.abs900} />
                  <Text className="ml-2 text-abs-900">Showing Favorites</Text>
                </>
              ) : (
                <>
                  <EmptyCircleIcon size={20} color={colors.abs950} />
                  <Text className="ml-2 text-abs-950">Show Favorites</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
          {/* isRead Exclude */}
          <TouchableOpacity
            className="mt-2 mb-2"
            onPress={() =>
              updateSearchObject({
                isRead: searchObject.isRead === "exclude" ? undefined : "exclude",
              })
            }
          >
            <View className="ml-2 flex-row items-center">
              {searchObject.isRead === "exclude" ? (
                <>
                  <CheckCircleIcon size={20} color={colors.abs900} />
                  <Text className="ml-2 text-abs-900">Exclude Read</Text>
                </>
              ) : (
                <>
                  <EmptyCircleIcon size={20} color={colors.abs950} />
                  <Text className="ml-2 text-abs-950">Exclude Read</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
        <HiddenContainer
          title="Genres"
          style={{ height: 200 }}
          titleInfo={buildExtraInfo(searchObject?.genres)}
          leftIconFunction={() => updateSearchObject({ genres: undefined })}
        >
          <ABSAdvSearchGenres />
        </HiddenContainer>
        <HiddenContainer
          title="Tags"
          style={{ height: 200 }}
          titleInfo={buildExtraInfo(searchObject?.tags)}
          leftIconFunction={() => updateSearchObject({ tags: undefined })}
        >
          <ABSAdvSearchTags />
        </HiddenContainer>
        {/* <View className="flex-col mx-2 mt-2 flex-1">
          <Text className="text-base font-semibold">Description</Text>
        </View> */}
        <View className="flex-row p-2">
          <ABSResultSearchInputText
            updateSearch={updateDescription}
            label="Description"
            showLabel={true}
            value={searchObject.description || ""}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default ABSAdvSearchContainer;
