import {
  View,
  Text,
  ScrollView,
  SectionList,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Pressable,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { usePlaybackStore, useTrackActions, useTracksStore } from "../../store/store";
import { formatSeconds } from "../../utils/formatUtils";
import TrackPlayer, { useProgress } from "react-native-track-player";
import { colors } from "../../constants/Colors";
import sectionListGetItemLayout from "react-native-section-list-get-item-layout";
import { Chapter } from "@store/store-functions";
import { getCurrentChapter } from "@utils/chapterUtils";
import usePlaylistColors from "hooks/usePlaylistColors";
import { darkenColor, lightenColor } from "@utils/otherUtils";
import { play } from "react-native-track-player/lib/trackPlayer";
import { pl } from "date-fns/locale";
import { EnterKeyIcon } from "@components/common/svg/Icons";
import { MotiView } from "moti";

const { width, height } = Dimensions.get("window");

type QueueSectionChapters = Record<string, Chapter[]>;
type SectionListData = {
  id: string;
  title: string;
  filename: string;
  queuePos: number;
  duration: number;
  data: Chapter[];
};

const TrackList = ({ isExpanded }) => {
  const queue = usePlaybackStore((state) => state.trackPlayerQueue);
  const currentTrack = usePlaybackStore((state) => state.currentTrack);
  const isPlaylistLoaded = usePlaybackStore((state) => state.playlistLoaded);
  const currentTrackIndex = usePlaybackStore((state) => state.currentTrackIndex);
  const playbackActions = usePlaybackStore((state) => state.actions);
  const { position, duration } = useProgress();
  const [sectionList, setSectionList] = useState<SectionListData[]>([]);
  const currChapterIndex = usePlaybackStore((state) => state.currentChapterIndex);
  const playlistColors = usePlaylistColors();
  const plDate = useTracksStore((state) => state.playlistUpdated);

  // console.log("PL LOADED", isPlaylistLoaded, sectionList);
  //! Store "curr" track and chapter
  const [currLocation, setCurrLocation] = useState({
    trackIndex: currentTrackIndex,
    chapterIndex: currChapterIndex,
  });

  //!
  useEffect(() => {
    setCurrLocation({
      trackIndex: currentTrackIndex,
      chapterIndex: currChapterIndex,
    });
  }, [isExpanded]);

  // Track List Colors
  const trackActiveColor = playlistColors.bg;
  const trackInactiveColor = lightenColor(playlistColors.bg, 75);
  const trackText = playlistColors.bgText;
  const trackBorder = playlistColors.bgBorder;

  const chaptActiveColor = playlistColors.btnBg;
  const chaptInactiveColor = lightenColor(playlistColors.btnBg, 40);
  const chaptText = playlistColors.btnText;
  const chaptBorder = playlistColors.btnBorder;
  const chaptBtnBgInactive = lightenColor(playlistColors.bg, 75);
  const chaptBtnBgActive = playlistColors.btnBg;
  const scrollViewRef = useRef<SectionList>(null);

  const [viewSectionChapters, setViewSectionChapters] = useState([]);
  //! ==== get current queue position
  // const currentQueueId = queue.find((el) => el.id === currentTrack.id).id;
  //! ====

  // Scroll to the active track
  const scrollToRow = (sectionIndex: number, chapterIndex: number) => {
    if (!scrollViewRef.current.scrollToLocation) return;
    scrollViewRef.current.scrollToLocation({
      sectionIndex: sectionIndex,
      itemIndex: chapterIndex,
      animated: true,
    });
  };

  // Scroll to the current track and/or chapter
  useEffect(() => {
    if (
      scrollViewRef.current &&
      currChapterIndex !== undefined &&
      sectionList.length > 0 &&
      isExpanded
    ) {
      scrollToRow(currentTrackIndex, currChapterIndex + 1);
    }
  }, [currentTrackIndex, scrollViewRef.current, currChapterIndex, isExpanded]);

  useEffect(() => {
    if (queue) {
      const finalSectionList = queue.map((track, index) => {
        //! Here might be where we can offset the start/end seconds based on
        //! the position in the queue
        const chapters = track?.chapters?.map((chapt) => {
          // console.log(`chapt - ${chapt.title}-- ${chapt.endSeconds}`);
          return chapt;
        }) as Chapter[];
        const sectionList = {
          title: track.title,
          filename: track.filename,
          queuePos: index,
          id: track.id,
          duration: track.duration,
          data: chapters || [{ title: "~NO CHAPTERS~" }],
        } as SectionListData;
        return sectionList;
      });
      setSectionList(finalSectionList);
      // setChapters(finalSectionList.flatMap((el) => el.data));
      // Need to set chapters so that they correspond to the queue position
      // setChapters(
      //   finalSectionList.reduce((final, el, index) => {
      //     return { ...final, [el.id]: el.data };
      //   }, {})
      // );
    }
  }, [queue]);

  // Used to update array that will be checked and if section index included
  // then chapter will be hidden.
  function updateChaptView(sectionIndex: number) {
    let updatedSections: number[];
    if (viewSectionChapters.includes(sectionIndex)) {
      updatedSections = viewSectionChapters.filter((el) => el !== sectionIndex);
    } else {
      updatedSections = [...viewSectionChapters, sectionIndex];
    }
    setViewSectionChapters(updatedSections);
  }

  //~~ ========================================================
  //~~ Section RENDERERS
  const getItemLayout = sectionListGetItemLayout({
    getItemHeight: (rowData, sectionIndex, rowIndex) => 45,
  });

  //~ RENDER HEADER
  const renderSectionHeader = ({ section }) => {
    const isCurrentTrack = section?.id === currentTrack?.id;

    const hasChapters = section?.data?.[0]?.title !== "~NO CHAPTERS~";
    const isOpen = viewSectionChapters.includes(section?.queuePos);
    const numberPressFunction = hasChapters
      ? () => updateChaptView(section?.queuePos)
      : async () => {
          if (!isCurrentTrack) {
            await playbackActions.goToTrack(section?.queuePos);
          }
        };
    return (
      <View
        key={section?.id}
        className={` items-center flex-row h-full`}
        style={{
          backgroundColor: isCurrentTrack ? trackActiveColor : trackInactiveColor,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: trackBorder,
          height: 45,
        }}
      >
        <View className={`flex-row items-center justify-between h-full w-full`}>
          <Pressable
            onPress={numberPressFunction}
            className="flex-row h-full justify-center items-center px-3"
          >
            <Text
              className={`text-sm  ${isCurrentTrack ? "font-semibold" : ""} `}
              style={{ color: trackText }}
            >{`${(section.queuePos + 1).toString().padStart(2, "0")}`}</Text>
            {!hasChapters && <View className="w-[19]" />}
            {hasChapters && (
              <MotiView
                from={{
                  transform: [{ rotate: "-90deg" }, { translateX: -5 }],
                }}
                animate={{
                  transform: [
                    { rotate: !isOpen ? "-90deg" : "0deg" },
                    { translateX: !isOpen ? -5 : 0 },
                  ],
                }}
              >
                <EnterKeyIcon size={15} style={{ paddingLeft: 4 }} color={trackText} />
              </MotiView>
            )}
          </Pressable>
          <Pressable
            className="flex-row items-center justify-between flex-1 h-full"
            onPress={async () => {
              if (!isCurrentTrack) {
                await playbackActions.goToTrack(section?.queuePos);
              }
            }}
          >
            <Text
              className={`text-sm flex-1 flex-grow ${isCurrentTrack ? "font-semibold" : ""}`}
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{ color: trackText }}
            >{`${section.title}`}</Text>
            <View style={{ width: 75 }} className="flex-row justify-end pr-3">
              <Text className="text-xs" style={{ color: trackText }}>
                {isCurrentTrack
                  ? formatSeconds(section.duration - position)
                  : formatSeconds(section.duration)}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    );
  };
  //~ RENDER ITEM
  const renderItem = ({ item, index, section }) => {
    // console.log("SUBSECT", item);
    if (item.title === "~NO CHAPTERS~") {
      return <View></View>;
    }
    //! NOTE: we can't just use "isCurrChapter" as it is incex based
    //!  and each section has many of same indexes
    //! USE: isCurrentSection
    // const isCurrChapter = index === currChapterIndex;
    // const isCurrentTrack = currentTrackIndex === section?.queuePos;
    const isCurrChapter = index === currLocation.chapterIndex; // currChapterIndex;
    const isCurrentTrack = currLocation.trackIndex === section?.queuePos; //currentTrackIndex === section?.queuePos;
    const isCurrentSection = isCurrChapter && isCurrentTrack;

    if (viewSectionChapters.includes(section?.queuePos)) return null;
    const skipToChapter = async () => {
      const { chapterInfo, chapterIndex, chapterProgressOffset, nextChapterExists } =
        getCurrentChapter({
          chapters: queue[section.queuePos]?.chapters,
          position: item?.startSeconds,
        });
      if (!isCurrentTrack) {
        await TrackPlayer.skip(section.queuePos);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      setCurrLocation({ trackIndex: section.queuePos, chapterIndex });
      await playbackActions.seekTo(item?.startSeconds);
      await new Promise((resolve) => setTimeout(resolve, 10));
    };

    return (
      <View
        className={`flex-row items-center justify-between ml-4`}
        style={{
          backgroundColor: isCurrentSection ? chaptActiveColor : chaptInactiveColor,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: chaptBorder,
          height: 45,
        }}
      >
        <TouchableOpacity onPress={skipToChapter}>
          <View
            className="w-[40] flex-row justify-center items-center flex-grow"
            style={{
              backgroundColor: isCurrentSection ? chaptBtnBgActive : chaptBtnBgInactive,
              borderRightWidth: StyleSheet.hairlineWidth,
              borderRightColor: chaptBorder,
            }}
          >
            {/* <ToTopIcon /> */}
            <Text
              className={`text-base ${isCurrentSection ? "font-bold" : "font-semibold"}`}
              style={{ color: isCurrentSection ? chaptText : trackText }}
            >
              {index + 1}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity className={`flex-row flex-1 h-full`} onPress={skipToChapter}>
          <View className={`flex-row pl-2 items-center justify-between flex-1`}>
            {/* <Text className="text-base">{props.item.title}</Text> */}
            <Text
              className="text-sm flex-1"
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{ color: chaptText }}
            >
              {item.title}
            </Text>
            <Text className="text-xs pr-2" style={{ color: chaptText }}>{`${formatSeconds(
              item?.startSeconds
            )} - ${formatSeconds(item.endSeconds)}`}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };
  //~~ ========================================================
  if (!isPlaylistLoaded) {
    return null;
  }

  return (
    <View
      className="flex-1"
      style={
        {
          // borderWidth: StyleSheet.hairlineWidth,
          // borderColor: colors.amber950,
          // borderTopWidth: 0,
        }
      }
    >
      <SectionList
        ref={scrollViewRef}
        sections={sectionList}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderItem}
        style={{ flex: 1, paddingBottom: 10 }}
        contentContainerStyle={{ paddingBottom: 2 }}
        getItemLayout={getItemLayout}
      />
    </View>
  );
};

export default TrackList;

// const ChapterRow = ({
//   isCurrentTrack,
//   playbackActions,
//   chapt,
//   trackIndex,
//   chapterIndex,
//   progress,
// }) => {
//   const [isCurrChapter, setIsCurrChapter] = useState(
//     progress <= chapt.endSeconds && progress >= chapt?.startSeconds
//   );
//   // const isCurrChapter = progress <= chapt.endSeconds && progress >= chapt.startSeconds;
//   // console.log("chapter test", chapt.startSeconds, chapt.endSeconds, progress, isCurrChapter);
//   // For each chapter, check every second where we are at in the chapter.
//   useEffect(() => {
//     setIsCurrChapter(progress <= chapt.endSeconds && progress >= chapt?.startSeconds);
//   }, [progress]);

//   return (
//     <View
//       className={`flex-row ml-4 border-b border-l border-amber-600 ${
//         isCurrChapter ? "bg-amber-500" : "bg-amber-100"
//       }`}
//     >
//       <TouchableOpacity
//         onPress={async () => {
//           if (!isCurrentTrack) {
//             await playbackActions.goToTrack(trackIndex);
//           }
//           await playbackActions.seekTo(chapt?.startSeconds || 0);
//           setIsCurrChapter(true);
//         }}
//       >
//         <View className="w-[40] flex-row justify-center items-center border-r border-amber-600 bg-[#FFE194] flex-grow">
//           {/* <ToTopIcon /> */}
//           <Text className="text-base font-bold">{chapterIndex + 1}</Text>
//         </View>
//       </TouchableOpacity>
//       <View className="flex-row justify-between p-2 pr-3 flex-grow">
//         <Text
//           numberOfLines={1}
//           ellipsizeMode="tail"
//           className={`${isCurrChapter ? "font-semibold text-sm" : ""} flex-1`}
//         >
//           {chapt.title}
//         </Text>
//         <View className="flex-row justify-start ">
//           <Text className="text-xs">{formatSeconds(chapt?.startSeconds || 0)} - </Text>
//           <Text className="text-xs">{formatSeconds(chapt.endSeconds)}</Text>
//         </View>
//       </View>
//     </View>
//   );
// };
