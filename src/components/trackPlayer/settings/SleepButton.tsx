import { View, Text, ViewStyle } from "react-native";
import React from "react";
import { AnimatedPressable } from "@components/common/buttons/Pressables";
import { colors } from "@constants/Colors";
import { useSettingStore } from "@store/store-settings";

type Props = {
  onPress: () => void;
  buttonTime: string;
  style?: ViewStyle;
};
const SleepButton = ({ onPress, buttonTime, style = {} }: Props) => {
  return (
    <AnimatedPressable onPress={onPress}>
      <View
        className="p-2 border border-amber-950 rounded-md bg-amber-200 w-[45]"
        style={style}
      >
        <Text className="font-semibold text-center">{buttonTime}</Text>
      </View>
    </AnimatedPressable>
  );
};

export default SleepButton;