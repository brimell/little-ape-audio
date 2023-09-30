import { TouchableOpacity, View, Text } from "react-native";
import SettingsFolderMetadata from "../../components/settings/SettingsFolderMetadata";
import { useRouter } from "expo-router";

const FolderMetadataRoute = () => {
  const route = useRouter();
  return (
    <View>
      <SettingsFolderMetadata />
    </View>
  );
};

export default FolderMetadataRoute;
